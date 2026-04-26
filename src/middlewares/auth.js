const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'military-secret-key';

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query('SELECT id, name, email, role, unitId FROM `user` WHERE id = ?', [payload.id]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// SuperAdmin role check
function superAdminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: superadmin only' });
  }
  next();
}

// Admin role check (superadmin + admin)
function adminOnly(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }
  next();
}

// User role check (semua role bisa akses)
function userOnly(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ message: 'Forbidden: user access required' });
  }
  next();
}

module.exports = { auth, superAdminOnly, adminOnly, userOnly, JWT_SECRET };