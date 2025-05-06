const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const db = mysql.createPool({
  host: '4.tcp.eu.ngrok.io',
  user: 'telecom_user',
  password: 'parola123!',
  database: 'DaemonView',
  port: 14402,
}).promise();

// GET /api/check-auth
router.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// GET /api/get-tickets
router.get('/get-tickets', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const status = req.query.status || null;
    const priority = req.query.priority || null;
    const created_at = req.query.created_at || null;
    const submitted_by = req.query.submitted_by || null;

    const [results] = await db.query(
      'CALL get_tickets_filtered(?, ?, ?, ?, ?, ?)',
      [limit, page, status, priority, created_at, submitted_by]
    );

    const paginatedTickets = results[0];
    const totalCount = results[1][0]?.total ?? 0;

    res.json({
      tickets: paginatedTickets,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });

  } catch (err) {
    console.error('Error fetching filtered tickets:', err);
    res.status(500).json({ message: 'Server error while fetching tickets' });
  }
});

// PUT /api/update-ticket-status
router.put('/update-ticket', async (req, res) => {
  const { ticket_id, status, assigned_to_name } = req.body;

  if (!ticket_id || (!status && !assigned_to_name)) {
    return res.status(400).json({ message: 'Missing data to update' });
  }

  try {
    let assignedToId = null;

    if (assigned_to_name) {
      const [userResult] = await db.query(
        'SELECT id FROM users WHERE username = ?',
        [assigned_to_name]
      );

      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }

      assignedToId = userResult[0].id;
    }

    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (assignedToId !== null) {
      updateFields.push('assigned_to = ?');
      updateValues.push(assignedToId);
    }

    // Always update updated_at
    updateFields.push('updated_at = NOW()');

    updateValues.push(ticket_id); // For WHERE clause

    const updateQuery = `
      UPDATE tickets_raw
      SET ${updateFields.join(', ')}
      WHERE ticket_id = ?
    `;

    await db.query(updateQuery, updateValues);

  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ message: 'Server error while updating ticket' });
  }
});

// POST /api/register
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch user from database
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});


module.exports = router;
