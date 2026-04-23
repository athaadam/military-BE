const pool = require('../db');

async function createRequest(req, res) {
  try {
    const userId = req.user.id;
    const { itemId, quantity, reason } = req.body;
    if (!itemId || !quantity || !reason) {
      return res.status(400).json({ message: 'itemId, quantity, dan reason dibutuhkan' });
    }

    const [itemRows] = await pool.query('SELECT id, stock FROM `item` WHERE id = ?', [itemId]);
    if (!itemRows.length) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    const [result] = await pool.query(
      'INSERT INTO `request` (userId, itemId, quantity, reason, status) VALUES (?, ?, ?, ?, ?)',
      [userId, itemId, quantity, reason, 'pending']
    );
    return res.status(201).json({ id: result.insertId, userId, itemId, quantity, reason, status: 'pending' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat request' });
  }
}

async function getMyRequests(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, ' +
      'u.name AS userName, it.name AS itemName, it.category AS itemCategory, it.warehouseId, ' +
      'ap.name AS approvedByName ' +
      'FROM `request` r ' +
      'LEFT JOIN `user` u ON r.userId = u.id ' +
      'LEFT JOIN `item` it ON r.itemId = it.id ' +
      'LEFT JOIN `user` ap ON r.approvedBy = ap.id ' +
      'WHERE r.userId = ?',
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil request saya' });
  }
}

async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT r.id, r.userId, r.itemId, r.quantity, r.reason, r.status, r.approvedBy, ' +
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
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil request' });
  }
}

async function approveRequest(req, res) {
  try {
    const { id } = req.params;
    const approverId = req.user.id;
    const [rows] = await pool.query('SELECT id, status FROM `request` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Request sudah diproses' });
    }
    await pool.query('UPDATE `request` SET status = ?, approvedBy = ? WHERE id = ?', ['approved', approverId, id]);
    return res.json({ message: 'Request berhasil disetujui' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal approve request' });
  }
}

async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, status FROM `request` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Request sudah diproses' });
    }
    await pool.query('UPDATE `request` SET status = ? WHERE id = ?', ['rejected', id]);
    return res.json({ message: 'Request berhasil ditolak' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal reject request' });
  }
}

module.exports = { createRequest, getMyRequests, getRequestById, approveRequest, rejectRequest };