const express = require('express');
const {
  createRequest,
  getMyRequests,
  getPendingRequests,
  getRequestById,
  approveRequest,
  rejectRequest
} = require('../controllers/requestController');
const { adminOnly } = require('../middlewares/auth');
const { validateItemExists, validateRequestInput } = require('../middlewares/validation');
const router = express.Router();

// User routes
router.post('/', validateRequestInput, validateItemExists, createRequest);
router.get('/my', getMyRequests);
router.get('/:id', getRequestById);

// Admin routes
router.get('/pending/list', adminOnly, getPendingRequests);
router.patch('/:id/approve', adminOnly, approveRequest);
router.patch('/:id/reject', adminOnly, rejectRequest);

module.exports = router;