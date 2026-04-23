const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middlewares/auth');

async function register(req, res) {
  try {
    const { name, email, password, unitId } = req.body;
    const role = 'user';
    if (!name || !email || !password || !unitId) {
      return res.status(400).json({ message: 'Name, email, password and unitId are required' });
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

    const token = jwt.sign({ id: result.insertId, email, role }, JWT_SECRET, { expiresIn: '8h' });
    return res.status(201).json({ token, user: { id: result.insertId, name, email, role, unitId } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal register' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password diperlukan' });
    }

    const [rows] = await pool.query('SELECT id, name, email, password, role, unitId FROM `user` WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const user = rows[0];
    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, unitId: user.unitId } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal login' });
  }
}

async function me(req, res) {
  return res.json(req.user);
}

module.exports = { register, login, me };