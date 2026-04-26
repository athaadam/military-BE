const pool = require('../db');
const { logAction } = require('../middlewares/auditLog');

async function createRequest(req, res) {
  try {
    const userId = req.user.id;
    const { itemId, quantity, reason } = req.body;

    // Validation
    if (!itemId || !quantity || !reason) {
      return res.status(400).json({ message: 'itemId, quantity, and reason are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if item exists and has available stock
    const [itemRows] = await pool.query(
      'SELECT id, stock, condition FROM `item` WHERE id = ?',
      [itemId]
    );
    if (!itemRows.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (itemRows[0].stock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: itemRows[0].stock,
        requested: quantity
      });
    }

    if (itemRows[0].condition !== 'Aktif') {
      return res.status(400).json({ message: 'Item is not available for request' });
    }

    const [result] = await pool.query(
      'INSERT INTO `request` (userId, itemId, quantity, reason, status) VALUES (?, ?, ?, ?, ?)',
      [userId, itemId, quantity, reason, 'pending']
    );

    return res.status(201).json({ 
      message: 'Request created successfully',
      data: { id: result.insertId, userId, itemId, quantity, reason, status: 'pending' } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create request' });
  }
}

async function getMyRequests(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, r.created_at, ' +
      'u.name AS userName, it.name AS itemName, it.category AS itemCategory, it.warehouseId, ' +
      'ap.name AS approvedByName ' +
      'FROM `request` r ' +
      'LEFT JOIN `user` u ON r.userId = u.id ' +
      'LEFT JOIN `item` it ON r.itemId = it.id ' +
      'LEFT JOIN `user` ap ON r.approvedBy = ap.id ' +
      'WHERE r.userId = ? ' +
      'ORDER BY r.created_at DESC',
      [userId]
    );
    return res.json({ message: 'My requests retrieved successfully', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve my requests' });
  }
}

async function getPendingRequests(req, res) {
  try {
    const adminUnitId = req.user.unitId;
    const [rows] = await pool.query(
      'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, r.created_at, ' +
      'u.name AS userName, u.email AS userEmail, it.name AS itemName, it.category AS itemCategory, w.name AS warehouseName, ' +
      'ap.name AS approvedByName ' +
      'FROM `request` r ' +
      'JOIN `user` u ON r.userId = u.id ' +
      'JOIN `item` it ON r.itemId = it.id ' +
      'JOIN `warehouse` w ON it.warehouseId = w.id ' +
      'LEFT JOIN `user` ap ON r.approvedBy = ap.id ' +
      'WHERE w.unitId = ? AND r.status = "pending" ' +
      'ORDER BY r.created_at ASC',
      [adminUnitId]
    );
    return res.json({ message: 'Pending requests retrieved successfully', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve pending requests' });
  }
}

async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, r.created_at, ' +
      'u.name AS userName, it.name AS itemName, it.category AS itemCategory, it.warehouseId, ' +
      'ap.name AS approvedByName ' +
      'FROM `request` r ' +
      'LEFT JOIN `user` u ON r.userId = u.id ' +
      'LEFT JOIN `item` it ON r.itemId = it.id ' +
      'LEFT JOIN `user` ap ON r.approvedBy = ap.id ' +
      'WHERE r.id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Request not found' });
    }
    return res.json({ message: 'Request retrieved successfully', data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve request' });
  }
}

async function approveRequest(req, res) {
  try {
    const { id } = req.params;
    const approverId = req.user.id;

    // Get request details
    const [requestRows] = await pool.query(
      'SELECT id, itemId, quantity, status FROM `request` WHERE id = ?',
      [id]
    );
    if (!requestRows.length) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = requestRows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    await pool.query(
      'UPDATE `request` SET status = ?, approvedBy = ? WHERE id = ?',
      ['approved', approverId, id]
    );

    // Update item stock and condition
    await pool.query(
      'UPDATE `item` SET stock = stock - ?, condition = ? WHERE id = ?',
      [request.quantity, 'Digunakan', request.itemId]
    );

    // Log action
    await logAction(
      req.user.id,
      'APPROVE_REQUEST',
      `Approved request #${id}: ${request.quantity} items of item #${request.itemId}`,
      { status: 'pending', stock: '-' },
      { status: 'approved', stock: 'updated' }
    );

    return res.json({ message: 'Request approved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to approve request' });
  }
}

async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, status FROM `request` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }
    await pool.query('UPDATE `request` SET status = ? WHERE id = ?', ['rejected', id]);

    // Log action
    await logAction(
      req.user.id,
      'REJECT_REQUEST',
      `Rejected request #${id}`,
      { status: 'pending' },
      { status: 'rejected' }
    );

    return res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to reject request' });
  }
}

module.exports = { 
  createRequest, 
  getMyRequests, 
  getPendingRequests,
  getRequestById, 
  approveRequest, 
  rejectRequest 
};