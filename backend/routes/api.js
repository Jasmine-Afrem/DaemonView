const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');

const db = mysql.createPool({
  host: '4.tcp.eu.ngrok.io',
  user: 'telecom_user',
  password: 'parola123!',
  database: 'DaemonView',
  port: 16741,
}).promise();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

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

// GET /api/get-notes
router.get('/get-notes/:id', async(req, res) => {
  const ticketId = req.params.id;

  try {
    const [rows] = await db.execute(
      'SELECT notes FROM tickets_raw WHERE ticket_id = ?',
      [ticketId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ ticket_id: ticketId, notes: rows[0].notes });
  } catch (err) {
    console.error('Error fetching ticket description:', err);
    res.status(500).json({ message: 'Failed to fetch description' });
  }
});

// PUT /api/update-ticket
router.put('/update-ticket', async (req, res) => {
  const { ticket_id, status, assigned_to_name, notes } = req.body;

  if (!ticket_id || (!status && !assigned_to_name && notes === undefined)) {
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

      if (status === 'Resolved') {
        updateFields.push('resolved_at = NOW()');
      } else if (status === 'Closed') {
        updateFields.push('closed_at = NOW()');
      }
    }

    if (assignedToId !== null) {
      updateFields.push('assigned_to = ?');
      updateValues.push(assignedToId);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    updateFields.push('updated_at = NOW()');

    updateValues.push(ticket_id); // For WHERE clause

    const updateQuery = `
      UPDATE tickets_raw
      SET ${updateFields.join(', ')}
      WHERE ticket_id = ?
    `;

    await db.query(updateQuery, updateValues);

    const [updatedTicketRows] = await db.query(
      `
      SELECT 
        t.*, 
        u.username AS assigned_to_name 
      FROM tickets_raw t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      WHERE t.ticket_id = ?
      `,
      [ticket_id]
    );

    if (updatedTicketRows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found after update' });
    }

    const updatedTicket = updatedTicketRows[0];

    res.json({ message: 'Ticket updated', ticket: updatedTicket });
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ message: 'Server error while updating ticket' });
  }
});


// GET /api/sla-compliance
router.get('/sla-compliance', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_sla_compliance_filtered(?, ?, ?)',
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching SLA compliance KPI' });
  }
});

// GET /api/sla-compliance-tickets
router.get('/sla-compliance-tickets', async (req, res) => {
  const { start_date, end_date, priority, sla_status } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_filtered_tickets_by_sla(?, ?, ?, ?)',
      [start_date || null, end_date || null, priority || null, sla_status || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching SLA compliance KPI' });
  }
});

// GET /api/tickets-resolved
router.get('/tickets-resolved', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_resolution_status_filtered(?, ?, ?)',
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching resolved tickets:', err);
    res.status(500).json({ message: 'Failed to fetch resolved tickets' });
  }
});

// GET /api/tickets-resolved-tickets
router.get('/tickets-resolved-tickets', async (req, res) => {
  const { start_date, end_date, priority, resolved } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_ticket_resolution_status(?, ?, ?, ?)',
      [start_date || null, end_date || null, priority || null, resolved || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching resolved tickets:', err);
    res.status(500).json({ message: 'Failed to fetch resolved tickets' });
  }
});

// GET /api/tickets-by-status
router.get('/tickets-by-status', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      `CALL get_status_summary_filtered(?, ?, ?)`,
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ticket counts by status' });
  }
});

// GET /api/tickets-by-status-tickets
router.get('/tickets-by-status-tickets', async (req, res) => {
  const { start_date, end_date, priority, status } = req.query;

  try {
    const [rows] = await db.query(
      `CALL get_ticket_status_details(?, ?, ?, ?)`,
      [start_date || null, end_date || null, priority || null, status || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ticket counts by status' });
  }
});

// GET /api/monthly-ticket-counts
router.get('/monthly-ticket-counts', async (req, res) => {
  const { start_date, end_date, priority } = req.query;
  try {
    const [rows] = await db.query(
      'CALL get_monthly_ticket_counts(?, ?, ?)',
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0] || rows);
  } catch (err) {
    console.error('Error calling get_monthly_ticket_counts:', err);
    res.status(500).json({ message: 'Error fetching monthly ticket counts.' });
  }
});

// GET /api/monthly-ticket-counts-tickets
router.get('/monthly-ticket-counts-tickets', async (req, res) => {
  const { start_date, end_date, priority, p_year_month } = req.query;
  try {
    const [rows] = await db.query(
      'CALL get_tickets_grouped_by_month(?, ?, ?, ?)',
      [start_date || null, end_date || null, priority || null, p_year_month || null]
    );
    res.json(rows[0] || rows);
  } catch (err) {
    console.error('Error calling get_tickets_grouped_by_month:', err);
    res.status(500).json({ message: 'Error fetching tickets grouped by month.' });
  }
});

// GET /api/resolution-time
router.get('/resolution-time', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      `CALL get_average_resolution_time(?, ?, ?)`,
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ticket counts by status' });
  }
});

// GET /api/sla-compliance-teams
router.get('/sla-compliance-teams', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_sla_compliance_filtered_by_team(?, ?, ?)',
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching SLA compliance KPI' });
  }
});

// GET /api/sla-compliance-teams-tickets
router.get('/sla-compliance-teams-tickets', async (req, res) => {
  const { start_date, end_date, priority, sla_status, team } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_sla_compliance_tickets_by_team(?, ?, ?, ?, ?)',
      [start_date || null, end_date || null, priority || null, team || null, sla_status || null], 
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching SLA compliance KPI' });
  }
});

// GET /api/tickets-resolved-teams
router.get('/tickets-resolved-teams', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_resolution_status_filtered_by_team(?, ?, ?)',
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching resolved tickets:', err);
    res.status(500).json({ message: 'Failed to fetch resolved tickets' });
  }
});

// GET /api/tickets-resolved-teams-tickets
router.get('/tickets-resolved-teams-tickets', async (req, res) => {
  const { start_date, end_date, priority, resolved, team } = req.query;

  try {
    const [rows] = await db.query(
      'CALL get_ticket_resolution_by_team(?, ?, ?, ?, ?)',
      [start_date || null, end_date || null, priority || null, team || null, resolved || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching resolved tickets:', err);
    res.status(500).json({ message: 'Failed to fetch resolved tickets' });
  }
});

// GET /api/tickets-by-status-teams
router.get('/tickets-by-status-teams', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      `CALL get_status_summary_filtered_by_team(?, ?, ?)`,
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ticket counts by status' });
  }
});

// GET /api/tickets-by-status-teams-tickets
router.get('/tickets-by-status-teams-tickets', async (req, res) => {
  const { start_date, end_date, priority, status, team } = req.query;

  try {
    const [rows] = await db.query(
      `CALL get_ticket_details_status_by_team(?, ?, ?, ?, ?)`,
      [start_date || null, end_date || null, priority || null, team || null, status || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ticket counts by status' });
  }
});

// GET /api/resolution-time-teams
router.get('/resolution-time-teams', async (req, res) => {
  const { start_date, end_date, priority } = req.query;

  try {
    const [rows] = await db.query(
      `CALL get_average_resolution_time_by_team(?, ?, ?)`,
      [start_date || null, end_date || null, priority || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ticket counts by status' });
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

router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.execute('SELECT id, email FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 3600000);

      await db.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [resetToken, tokenExpiry, user.id]
      );
      const resetLink = `${process.env.FRONTEND_URL}/login/forgot-password/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: { name: "Daemonview", address: "noreply@daemonview.com" },
        to: user.email,
        subject: 'Password Reset Request',
        html: `<p>Click this link to reset your password (the link expires in one hour): <a href="${resetLink}">Reset Password</a></p>`,
      });
    }
  } catch (error) {
    console.error('Error in /request-reset:', error);
  }
  res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
});

router.post('/validate-token', async (req, res) => {
    try {
        const { token } = req.body;
        const [rows] = await db.execute(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'This link is invalid or has expired.' });
        }

        res.status(200).json({ message: 'Token is valid.' });
    } catch (error) {
        console.error('Error in /validate-token:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const [rows] = await db.execute(
      'SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your Password Has Been Changed',
      html: `<p>This is a confirmation that the password for your account has just been changed.</p>`,
    });

    res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    console.error('Error in /reset-password:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

module.exports = router;
