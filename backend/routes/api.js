const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const db = mysql.createPool({
  host: '0.tcp.eu.ngrok.io',
  user: 'telecom_user',
  password: 'parola123!',
  database: 'DaemonView',
  port: 11167,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get paginated tickets
    const [tickets] = await db.query(
      'SELECT * FROM tickets ORDER BY ticket_id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    // Get total count
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM tickets');
    const totalCount = countResult[0].total;

    res.json({
      tickets,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching tickets' });
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
