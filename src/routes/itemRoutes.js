import express from 'express'

import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemStatus
} from '../controllers/itemController.js'


import { repairItem } from "../controllers/repairController.js";

const router = express.Router()

router.get('/', getAllItems)
router.get('/:id', getItemById)
router.post('/', createItem)
router.put('/:id', updateItem)
router.delete('/:id', deleteItem)
router.patch('/:id/status', updateItemStatus)
router.patch("/:id/repair", repairItem)
export default router