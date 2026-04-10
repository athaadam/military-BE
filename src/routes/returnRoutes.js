import express from 'express'
import { createReturn, getAllReturns, getReturnById } from '../controllers/returnController.js'

const router = express.Router()

router.post('/', createReturn)
router.get('/', getAllReturns)
router.get('/:id', getReturnById)

export default router
