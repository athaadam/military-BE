const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const unitRoutes = require('./unitRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const itemRoutes = require('./itemRoutes');
const requestRoutes = require('./requestRoutes');
const returnRoutes = require('./returnRoutes');
const { auth, adminOnly } = require('../middlewares/auth');

router.get('/', (req, res) => {
  res.json({ message: 'API route jalan 🚀' });
});

router.use('/auth', authRoutes);
router.use('/users', auth, adminOnly, userRoutes);
router.use('/units', auth, adminOnly, unitRoutes);
router.use('/warehouses', auth, adminOnly, warehouseRoutes);
router.use('/items', auth, itemRoutes);
router.use('/requests', auth, requestRoutes);
router.use('/returns', auth, returnRoutes);

module.exports = router;