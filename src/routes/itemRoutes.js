const express = require('express');
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemStatus,
  repairItem
} = require('../controllers/itemController');
const { validateWarehouseExists, validateItemInput } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', validateItemInput, validateWarehouseExists, createItem);
router.put('/:id', validateItemInput, validateWarehouseExists, updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/status', updateItemStatus);
router.patch('/:id/repair', repairItem);

module.exports = router;