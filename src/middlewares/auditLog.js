const pool = require('../db');

/**
 * Log user action to audit log table
 * @param {number} userId - User ID performing the action
 * @param {string} action - Action type (CREATE, READ, UPDATE, DELETE, APPROVE, REJECT)
 * @param {string} description - Description of the action
 * @param {object} oldValue - Previous value (for updates)
 * @param {object} newValue - New value (for updates/creates)
 */
const logAction = async (userId, action, description, oldValue = null, newValue = null) => {
  try {
    await pool.query(
      'INSERT INTO `log` (userId, action, description, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
      [userId, action, description, JSON.stringify(oldValue), JSON.stringify(newValue)]
    );
  } catch (err) {
    console.error('Error logging action:', err);
    // Don't throw - logging should not break the main operation
  }
};

/**
 * Get audit logs with filters
 * @param {number} userId - Optional user ID to filter logs
 * @param {string} action - Optional action to filter logs
 * @param {number} limit - Number of records to return
 * @param {number} offset - Pagination offset
 */
const getAuditLogs = async (userId = null, action = null, limit = 100, offset = 0) => {
  try {
    let query = 'SELECT * FROM `log` WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [logs] = await pool.query(query, params);
    return logs;
  } catch (err) {
    console.error('Error retrieving audit logs:', err);
    return [];
  }
};

module.exports = {
  logAction,
  getAuditLogs
};
