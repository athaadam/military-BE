const pool = require('../db');

/**
 * Get all audit logs (SuperAdmin only)
 */
async function getAllAuditLogs(req, res) {
  try {
    const { action, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT l.*, u.name AS userName, u.email FROM `log` l LEFT JOIN `user` u ON l.userId = u.id WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND l.action = ?';
      params.push(action);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM `log` WHERE 1=1';
    const countParams = [];
    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    const [countResult] = await pool.query(countQuery, countParams);

    return res.json({
      message: 'Audit logs retrieved successfully',
      data: logs,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve audit logs' });
  }
}

/**
 * Get user's own audit logs
 */
async function getMyAuditLogs(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const [logs] = await pool.query(
      'SELECT * FROM `log` WHERE userId = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM `log` WHERE userId = ?',
      [userId]
    );

    return res.json({
      message: 'My audit logs retrieved successfully',
      data: logs,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve my audit logs' });
  }
}

/**
 * Get audit logs for a specific user (SuperAdmin only)
 */
async function getUserAuditLogs(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if user exists
    const [userCheck] = await pool.query('SELECT id, name, email FROM `user` WHERE id = ?', [userId]);
    if (!userCheck.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [logs] = await pool.query(
      'SELECT * FROM `log` WHERE userId = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM `log` WHERE userId = ?',
      [userId]
    );

    return res.json({
      message: `Audit logs for user ${userCheck[0].name} retrieved successfully`,
      user: userCheck[0],
      data: logs,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve user audit logs' });
  }
}

/**
 * Clear audit logs (SuperAdmin only) - Use with caution!
 */
async function clearAuditLogs(req, res) {
  try {
    const { daysOld = 30 } = req.body; // Default: clear logs older than 30 days

    const [result] = await pool.query(
      'DELETE FROM `log` WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );

    return res.json({
      message: `Audit logs older than ${daysOld} days cleared successfully`,
      rowsDeleted: result.affectedRows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to clear audit logs' });
  }
}

module.exports = {
  getAllAuditLogs,
  getMyAuditLogs,
  getUserAuditLogs,
  clearAuditLogs
};
