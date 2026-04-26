const express = require('express');
const { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');
const { validateUnitExists } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getWarehouses);
router.post('/', validateUnitExists, createWarehouse);
router.put('/:id', validateUnitExists, updateWarehouse);
router.delete('/:id', deleteWarehouse);

module.exports = router;