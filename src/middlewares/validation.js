const pool = require('../db');

const validateUnitExists = async (req, res, next) => {
  try {
    const { unitId } = req.body;
    if (unitId) {
      const [rows] = await pool.query('SELECT id FROM `unit` WHERE id = ?', [unitId]);
      if (!rows.length) {
        return res.status(400).json({ message: 'Unit tidak ditemukan' });
      }
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error validating unit' });
  }
};

const validateWarehouseExists = async (req, res, next) => {
  try {
    const { warehouseId } = req.body;
    if (warehouseId) {
      const [rows] = await pool.query('SELECT id FROM `warehouse` WHERE id = ?', [warehouseId]);
      if (!rows.length) {
        return res.status(400).json({ message: 'Warehouse tidak ditemukan' });
      }
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error validating warehouse' });
  }
};

const validateItemExists = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    if (itemId) {
      const [rows] = await pool.query('SELECT id FROM `item` WHERE id = ?', [itemId]);
      if (!rows.length) {
        return res.status(400).json({ message: 'Item tidak ditemukan' });
      }
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error validating item' });
  }
};

const validateRequestExists = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (requestId) {
      const [rows] = await pool.query('SELECT id FROM `request` WHERE id = ?', [requestId]);
      if (!rows.length) {
        return res.status(400).json({ message: 'Request tidak ditemukan' });
      }
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error validating request' });
  }
};

module.exports = {
  validateUnitExists,
  validateWarehouseExists,
  validateItemExists,
  validateRequestExists
};