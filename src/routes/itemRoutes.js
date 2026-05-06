const express = require('express');
const {
  getItems,
  getItemById,
  getItemDetail,
  createItem,
  updateItem,
  transferItemCondition,
  addStock,
  deleteItem,
  updateItemStatus,
  repairItem
} = require('../controllers/itemController');
const { validateWarehouseExists, validateItemInput } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.get('/:id/detail', getItemDetail);
router.post('/', validateItemInput, validateWarehouseExists, createItem);
router.put('/:id', validateItemInput, validateWarehouseExists, updateItem);
router.patch('/:id/condition-transfer', transferItemCondition);
router.patch('/:id/add-stock', addStock);
router.delete('/:id', deleteItem);
router.patch('/:id/status', updateItemStatus);
router.patch('/:id/repair', repairItem);

module.exports = router;