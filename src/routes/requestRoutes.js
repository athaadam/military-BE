import express from 'express'
import {
  createRequest,
  getMyRequests,
  getRequestById,
  approveRequest,
  rejectRequest
} from '../controllers/requestController.js'

const router = express.Router()

router.post('/', createRequest)
router.get('/my', getMyRequests)
router.get('/:id', getRequestById)
router.patch('/:id/approve', approveRequest)
router.patch('/:id/reject', rejectRequest)

export default router