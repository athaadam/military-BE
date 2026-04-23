const bcrypt = require('bcryptjs');
const pool = require('../db');

async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.unitId, unit.name as unitName FROM `user` u LEFT JOIN `unit` unit ON u.unitId = unit.id'
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil data users' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role = 'user', unitId } = req.body;
    if (!name || !email || !password || !unitId) {
      return res.status(400).json({ message: 'Name, email, password dan unitId dibutuhkan' });
    }

    const [existing] = await pool.query('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO `user` (name, email, password, role, unitId) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, unitId]
    );
    return res.status(201).json({ id: result.insertId, name, email, role, unitId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat user' });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const { name, email, password, role, unitId } = req.body;
    const [rows] = await pool.query('SELECT id FROM `user` WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
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
    if (role) {
      fields.push('role = ?');
      values.push(role);
    }
    if (unitId) {
      fields.push('unitId = ?');
      values.push(unitId);
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'Tidak ada field yang diupdate' });
    }

    values.push(userId);
    await pool.query(`UPDATE \`user\` SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'User berhasil diupdate' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const [rows] = await pool.query('SELECT id FROM `user` WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    await pool.query('DELETE FROM `user` WHERE id = ?', [userId]);
    return res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal hapus user' });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };