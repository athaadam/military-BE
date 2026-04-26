<<<<<<< HEAD
import express from 'express'
import {
  getAllItems,
=======
const express = require('express');
const {
  getItems,
>>>>>>> 8da931236db4aa5c4387a28a13fc4a3bdba18b30
  getItemById,
  createItem,
  updateItem,
  deleteItem,
<<<<<<< HEAD
  updateItemStatus
} from '../controllers/itemController.js'

const router = express.Router()

router.get('/', getAllItems)
router.get('/:id', getItemById)
router.post('/', createItem)
router.put('/:id', updateItem)
router.delete('/:id', deleteItem)
router.patch('/:id/status', updateItemStatus)

export default router
=======
  updateItemStatus,
  repairItem
} = require('../controllers/itemController');
const { validateWarehouseExists } = require('../middlewares/validation');
const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', validateWarehouseExists, createItem);
router.put('/:id', validateWarehouseExists, updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/status', updateItemStatus);
router.patch('/:id/repair', repairItem);

module.exports = router;
>>>>>>> 8da931236db4aa5c4387a28a13fc4a3bdba18b30
