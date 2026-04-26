const express = require('express');
const { getAllAuditLogs, getMyAuditLogs, getUserAuditLogs, clearAuditLogs } = require('../controllers/auditController');
const router = express.Router();

// Get all audit logs (SuperAdmin only)
router.get('/', getAllAuditLogs);

// Get my own audit logs (all users)
router.get('/my', getMyAuditLogs);

// Get audit logs for specific user (SuperAdmin only)
router.get('/user/:userId', getUserAuditLogs);

// Clear old audit logs (SuperAdmin only)
router.delete('/clear', clearAuditLogs);

module.exports = router;
