const express = require('express');
const {
  createRequest,
  getMyRequests,
  getRequestById,
  approveRequest,
  rejectRequest
} = require('../controllers/requestController');
const { adminOnly } = require('../middlewares/auth');
const { validateItemExists } = require('../middlewares/validation');
const router = express.Router();

router.post('/', validateItemExists, createRequest);
router.get('/my', getMyRequests);
router.get('/:id', getRequestById);
router.patch('/:id/approve', adminOnly, approveRequest);
router.patch('/:id/reject', adminOnly, rejectRequest);

module.exports = router;