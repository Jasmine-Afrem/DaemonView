const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');

const db = mysql.createPool({
  host: '0.tcp.eu.ngrok.io',
  user: 'telecom_user',
  password: 'parola123!',
  database: 'DaemonView',
  port: 14645,
}).promise();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// GET /api/me
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.status(200).json(req.session.user);
    console.log(req.session.user.role);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// GET /api/get-users
router.get('/get-users', async (req, res) => {
  try {
    const query = 'SELECT id, username, email, role FROM users ORDER BY id ASC';
    const [users] = await db.execute(query);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// GET /api/get-teams
router.get('/get-teams', async (req, res) => {
  try {
    const query = 'CALL get_team_details()';
    const [users] = await db.execute(query);
    res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// POST /api/delete-user
router.post('/delete-user', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    const [result] = await db.query('DELETE FROM users WHERE username = ?', [username]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `User with username '${username}' not found.` });
    }

    res.status(200).json({ message: `User '${username}' deleted successfully.` });

  } catch (error) {
    console.error('Error deleting user by name:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// POST /api/delete-team
router.post('/delete-team', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Team name is required.' });
  }

  try {
    const [result] = await db.query('DELETE FROM teams WHERE name = ?', [name]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Team with name '${name}' not found.` });
    }

    res.status(200).json({ message: `Team '${name}' and all its memberships deleted successfully.` });

  } catch (error) {
    console.error('Error deleting team by name:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// POST /api/update-team
router.post('/update-team', async (req, res) => {
  const { current_name, name, description } = req.body;
  
  if (name === undefined && description === undefined) {
    return res.status(400).json({ message: 'Missing data to update (new name or description)' });
  }

  try {
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    updateValues.push(current_name);

    const updateQuery = `
      UPDATE teams
      SET ${updateFields.join(', ')}
      WHERE name = ?
    `;

    const [result] = await db.query(updateQuery, updateValues);
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Team not found' });
    }

    const [updatedTeamRows] = await db.query(
      'SELECT * FROM teams WHERE name = ?',
      [current_name]
    );

    res.status(200).json({ message: 'Team updated successfully' });

  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ message: 'Server error while updating team' });
  }
});

// PUT /api/update-user
router.put('/update-user', async (req, res) => {
  const { current_username, username, email, role } = req.body;

  if (!current_username) {
    return res.status(400).json({ message: 'Bad Request: current_username is required to identify the user.' });
  }
  if (!username && !email && !role) {
    return res.status(400).json({ message: 'Bad Request: At least one field (username, email, role) is required to update.' });
  }

  const updateFields = [];
  const updateValues = [];
  const allowedRoles = ['user', 'admin', 'tehnician', 'supervisor'];

  if (username) { updateFields.push('username = ?'); updateValues.push(username); }
  if (email) { updateFields.push('email = ?'); updateValues.push(email); }
  if (role) {
      if (!allowedRoles.includes(role)) {
          return res.status(400).json({ message: `Invalid role specified.` });
      }
      updateFields.push('role = ?');
      updateValues.push(role);
  }

  updateValues.push(current_username); // Add identifier for the WHERE clause at the end
  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE username = ?`;

  try {
    const [result] = await db.query(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `User with username '${current_username}' not found.` });
    }

    const finalUsername = username || current_username; // Use new username if it was changed
    const [updatedUserRows] = await db.query(
      'SELECT id, username, email, role FROM users WHERE username = ?',
      [finalUsername]
    );

    res.status(200).json({ message: 'User updated successfully', user: updatedUserRows[0] });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Conflict: That username or email is already taken.' });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// POST /api/remove-member
router.post('/remove-member', async (req, res) => {
  const { team_name, username } = req.body;

  if (!team_name || !username) {
    return res.status(400).json({ message: 'Bad Request: team_name and username are required.' });
  }

  try {
    const [teamRows] = await db.query('SELECT id FROM teams WHERE name = ?', [team_name]);
    if (teamRows.length === 0) {
      return res.status(404).json({ message: `Team with name '${team_name}' not found.` });
    }
    const team_id = teamRows[0].id;

    const [userRows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: `User with username '${username}' not found.` });
    }
    const user_id = userRows[0].id;

    const [deleteResult] = await db.query(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [team_id, user_id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: `Membership not found: User '${username}' is not a member of team '${team_name}'.` });
    }

    res.status(200).json({ message: `User '${username}' successfully removed from team '${team_name}'.` });

  } catch (error) {
    console.error('Error removing member from team:', error);
    res.status(500).json({ message: 'An internal server error occurred while removing the member.' });
  }
});

// POST /api/add-member
router.post('/add-member', async (req, res) => {
  const { team_name, username } = req.body;

  if (!team_name || !username) {
    return res.status(400).json({ message: 'Bad Request: team_name and username are required.' });
  }

  try {
    const [teamRows] = await db.query('SELECT id FROM teams WHERE name = ?', [team_name]);
    if (teamRows.length === 0) {
      return res.status(404).json({ message: `Team with name '${team_name}' not found.` });
    }
    const team_id = teamRows[0].id;

    const [userRows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: `User with username '${username}' not found.` });
    }
    const user_id = userRows[0].id;

    await db.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [team_id, user_id]
    );

    res.status(201).json({ message: `User '${username}' successfully added to team '${team_name}'.` });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: `Conflict: User '${username}' is already a member of team '${team_name}'.` });
    }
    console.error('Error adding member to team:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// POST /api/create-team
router.post('/create-team', async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Bad Request: Team name is required and cannot be empty.' });
  }

  try {
    const [existingTeams] = await db.query('SELECT id FROM teams WHERE name = ?', [name]);
    if (existingTeams.length > 0) {
      return res.status(409).json({ message: `Conflict: A team with the name '${name}' already exists.` });
    }

    const [result] = await db.query(
      'INSERT INTO teams (name, description) VALUES (?, ?)',
      [name, description || null] // Use null if description is not provided or is empty
    );

    const newTeamId = result.insertId;

    const [newTeamRows] = await db.query('SELECT * FROM teams WHERE id = ?', [newTeamId]);
    
    if (newTeamRows.length === 0) {
        return res.status(500).json({ message: 'Failed to retrieve the newly created team.' });
    }

    res.status(201).json({ message: 'Team created successfully', team: newTeamRows[0] });

  } catch (error) {
    console.error('Error creating team:', error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: `Conflict: A team with the name '${name}' already exists.` });
    }
    res.status(500).json({ message: 'An internal server error occurred while creating the team.' });
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
  const { username, email } = req.body;

  try {
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const password = crypto.randomBytes(12).toString('hex');

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your New Account at DaemonView',
      html: `
        <h2>Welcome to DaemonView!</h2>
        <p>An account has been created for you.</p>
        <p>Your username is: <strong>${username}</strong></p>
        <p>Your temporary password is: <strong>${password}</strong></p>
        <p>Please log in and change your password immediately for security reasons.</p>
      `,
    });

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
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    res.status(200).json(req.session.user);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/logout
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
