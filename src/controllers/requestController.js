const pool = require('../db');
const { logAction } = require('../middlewares/auditLog');

async function getItemConditionQuantity(db, itemId, condition) {
  const [rows] = await db.query(
    'SELECT quantity FROM `item_condition_stock` WHERE itemId = ? AND `condition` = ?',
    [itemId, condition]
  );

  return rows[0]?.quantity || 0;
}

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

    // Check if item exists and has available active stock
    const [itemRows] = await pool.query(
      'SELECT i.id, i.name, i.category, i.warehouseId, w.unitId FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id WHERE i.id = ?',
      [itemId]
    );
    if (!itemRows.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const activeStock = await getItemConditionQuantity(pool, itemId, 'Aktif');

    if (activeStock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: activeStock,
        requested: quantity
      });
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
    let unitId;
    
    if (req.user.role === 'admin') {
      unitId = req.user.unitId;
    } else if (req.user.role === 'superadmin' && req.query.unitId) {
      unitId = req.query.unitId;
    }

    let query
    let params = []

    if (unitId) {
      query =
        'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, r.created_at, ' +
        'u.name AS userName, u.email AS userEmail, it.name AS itemName, it.category AS itemCategory, w.name AS warehouseName, ' +
        'ap.name AS approvedByName ' +
        'FROM `request` r ' +
        'JOIN `user` u ON r.userId = u.id ' +
        'JOIN `item` it ON r.itemId = it.id ' +
        'JOIN `warehouse` w ON it.warehouseId = w.id ' +
        'LEFT JOIN `user` ap ON r.approvedBy = ap.id ' +
        'WHERE w.unitId = ? AND r.status = "pending" ' +
        'ORDER BY r.created_at ASC'
      params = [unitId]
    } else {
      // superadmin without unitId: return all pending requests across units
      query =
        'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, r.created_at, ' +
        'u.name AS userName, u.email AS userEmail, it.name AS itemName, it.category AS itemCategory, w.name AS warehouseName, ' +
        'ap.name AS approvedByName ' +
        'FROM `request` r ' +
        'JOIN `user` u ON r.userId = u.id ' +
        'JOIN `item` it ON r.itemId = it.id ' +
        'JOIN `warehouse` w ON it.warehouseId = w.id ' +
        'LEFT JOIN `user` ap ON r.approvedBy = ap.id ' +
        'WHERE r.status = "pending" ' +
        'ORDER BY r.created_at ASC'
      params = []
    }

    const [rows] = await pool.query(query, params)
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
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const approverId = req.user.id;

    await connection.beginTransaction();

    // Get request details
    const [requestRows] = await connection.query(
      'SELECT id, itemId, quantity, status FROM `request` WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!requestRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = requestRows[0];
    if (request.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ message: 'Request already processed' });
    }

    const activeStock = await getItemConditionQuantity(connection, request.itemId, 'Aktif');
    if (activeStock < request.quantity) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Insufficient stock',
        available: activeStock,
        requested: request.quantity,
      });
    }

    // Update request status
    await connection.query(
      'UPDATE `request` SET status = ?, approvedBy = ? WHERE id = ?',
      ['approved', approverId, id]
    );

    // Update item condition stock breakdown
    await connection.query(
      'UPDATE `item_condition_stock` SET quantity = quantity - ? WHERE itemId = ? AND `condition` = ?',
      [request.quantity, request.itemId, 'Aktif']
    );

    await connection.query(
      'INSERT INTO `item_condition_stock` (itemId, `condition`, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
      [request.itemId, 'Digunakan', request.quantity]
    );

    await connection.commit();

    await logAction(
      req.user.id,
      'APPROVE_REQUEST',
      `Approved request #${id}: ${request.quantity} items of item #${request.itemId}`,
      { status: 'pending', stock: '-' },
      { status: 'approved', stock: 'updated' }
    );

    return res.json({ message: 'Request approved successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Failed to approve request' });
  } finally {
    connection.release();
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