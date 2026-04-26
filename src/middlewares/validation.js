const pool = require('../db');

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 6 chars)
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Name validation
const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 191;
};

// Quantity validation
const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity > 0;
};

// Unit code validation (uppercase alphanumeric with dash/underscore, 3-50 chars)
const validateUnitCode = (code) => {
  return code && /^[A-Z0-9\-_]{3,50}$/.test(code);
};

// Unit exists check
const validateUnitExists = async (req, res, next) => {
  try {
    const { unitId } = req.body;
    if (unitId) {
      const [rows] = await pool.query('SELECT id FROM `unit` WHERE id = ?', [unitId]);
      if (!rows.length) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error validating unit' });
  }
};

// Warehouse exists check
const validateWarehouseExists = async (req, res, next) => {
  try {
    const { warehouseId } = req.body;
    if (warehouseId) {
      const [rows] = await pool.query('SELECT id FROM `warehouse` WHERE id = ?', [warehouseId]);
      if (!rows.length) {
        return res.status(404).json({ message: 'Warehouse not found' });
      }
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error validating warehouse' });
  }
};

// Item exists check
const validateItemExists = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    if (itemId) {
      const [rows] = await pool.query('SELECT id FROM `item` WHERE id = ?', [itemId]);
      if (!rows.length) {
        return res.status(404).json({ message: 'Item not found' });
      }
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error validating item' });
  }
};

// Request exists check
const validateRequestExists = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (requestId) {
      const [rows] = await pool.query('SELECT id FROM `request` WHERE id = ?', [requestId]);
      if (!rows.length) {
        return res.status(404).json({ message: 'Request not found' });
      }
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error validating request' });
  }
};

// User input validation for create/update
const validateUserInput = (req, res, next) => {
  const { name, email, password } = req.body;

  if (name && !validateName(name)) {
    return res.status(400).json({ message: 'Name must be between 2 and 191 characters' });
  }

  if (email && !validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password && !validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  next();
};

// Item input validation
const validateItemInput = (req, res, next) => {
  const { name, category, condition, stock } = req.body;

  if (name && !validateName(name)) {
    return res.status(400).json({ message: 'Item name must be between 2 and 191 characters' });
  }

  if (category && !['Persenjataan', 'Amunisi', 'Kendaraan Militer'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  if (condition && !['Aktif', 'Digunakan', 'Rusak', 'Perbaikan', 'Cadangan', 'Habis'].includes(condition)) {
    return res.status(400).json({ message: 'Invalid condition' });
  }

  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
    return res.status(400).json({ message: 'Stock must be a non-negative integer' });
  }

  next();
};

// Request input validation
const validateRequestInput = (req, res, next) => {
  const { quantity, reason } = req.body;

  if (quantity && !validateQuantity(quantity)) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  if (reason && (reason.trim().length < 3 || reason.trim().length > 191)) {
    return res.status(400).json({ message: 'Reason must be between 3 and 191 characters' });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateQuantity,
  validateUnitCode,
  validateUnitExists,
  validateWarehouseExists,
  validateItemExists,
  validateRequestExists,
  validateUserInput,
  validateItemInput,
  validateRequestInput
};