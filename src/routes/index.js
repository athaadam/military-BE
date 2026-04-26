const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const unitRoutes = require('./unitRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const itemRoutes = require('./itemRoutes');
const requestRoutes = require('./requestRoutes');
const returnRoutes = require('./returnRoutes');
const auditRoutes = require('./auditRoutes');
const { auth, superAdminOnly, adminOnly } = require('../middlewares/auth');

router.get('/', (req, res) => {
  res.json({ message: 'API route jalan 🚀' });
});

// Auth routes (no protection)
router.use('/auth', authRoutes);

// SuperAdmin only routes - manage users and units
router.use('/users', auth, superAdminOnly, userRoutes);
router.use('/units', auth, superAdminOnly, unitRoutes);

// Admin only routes - manage warehouse, items
router.use('/warehouses', auth, adminOnly, warehouseRoutes);
router.use('/items', auth, adminOnly, itemRoutes);

// User + Admin routes - manage requests and returns
router.use('/requests', auth, requestRoutes);
router.use('/returns', auth, returnRoutes);

// Audit logs
router.use('/audit', auth, superAdminOnly, auditRoutes);

module.exports = router;