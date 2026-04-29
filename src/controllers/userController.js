const bcrypt = require('bcryptjs');
const pool = require('../db');
const { logAction } = require('../middlewares/auditLog');

async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.unitId, unit.name as unitName, u.created_at FROM `user` u LEFT JOIN `unit` unit ON u.unitId = unit.id WHERE u.role IN ("admin", "user")'
    );
    return res.json({ message: 'Users retrieved successfully', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve users' });
  }
}

async function getUser(req, res) {
  try {
    const userId = req.params.id;
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, u.password, u.role, u.unitId, u.created_at, u.updated_at FROM `user` u WHERE u.id = ? AND u.role IN ("admin", "user")',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User retrieved successfully', data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve user' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role = 'admin', unitId } = req.body;
    
    // Validation
    if (!name || !email || !password || !unitId) {
      return res.status(400).json({ message: 'Name, email, password, and unitId are required' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only admin or user allowed' });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Check if unit exists
    const [unitCheck] = await pool.query('SELECT id FROM `unit` WHERE id = ?', [unitId]);
    if (!unitCheck.length) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO `user` (name, email, password, role, unitId) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, unitId]
    );

    // Log action
    await logAction(
      req.user.id,
      'CREATE_USER',
      `Created user: ${name} (${email}) with role: ${role}`,
      null,
      { id: result.insertId, name, email, role, unitId }
    );

    return res.status(201).json({ 
      message: 'User created successfully',
      data: { id: result.insertId, name, email, role, unitId } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const { name, email, password, role, unitId } = req.body;

    // Check if user exists
    const [rows] = await pool.query('SELECT id, role FROM `user` WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent updating superadmin by non-superadmin
    if (rows[0].role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot update superadmin account' });
    }

    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(hashed);
    }
    if (role && ['admin', 'user'].includes(role)) {
      fields.push('role = ?');
      values.push(role);
    }
    if (unitId) {
      fields.push('unitId = ?');
      values.push(unitId);
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userId);
    await pool.query(`UPDATE \`user\` SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    // Check if user exists
    const [rows] = await pool.query('SELECT id, role, name, email FROM `user` WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting superadmin
    if (rows[0].role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete superadmin account' });
    }

    const deletedUser = rows[0];
    await pool.query('DELETE FROM `user` WHERE id = ?', [userId]);

    // Log action
    await logAction(
      req.user.id,
      'DELETE_USER',
      `Deleted user: ${deletedUser.name} (${deletedUser.email})`,
      { id: deletedUser.id, name: deletedUser.name, email: deletedUser.email, role: deletedUser.role },
      null
    );

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}

async function resetPassword(req, res) {
  try {
    const userId = req.params.id;

    // Check if user exists
    const [rows] = await pool.query('SELECT id, name, email, role FROM `user` WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent resetting superadmin password
    if (rows[0].role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot reset superadmin password' });
    }

    // Generate random password (8 chars: uppercase, lowercase, number)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query('UPDATE `user` SET password = ? WHERE id = ?', [hashed, userId]);

    // Log action
    await logAction(
      req.user.id,
      'RESET_PASSWORD',
      `Reset password for user: ${rows[0].name} (${rows[0].email})`,
      null,
      { userId, userName: rows[0].name, userEmail: rows[0].email }
    );

    return res.json({ 
      message: 'Password reset successfully',
      data: { password: newPassword }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, resetPassword };