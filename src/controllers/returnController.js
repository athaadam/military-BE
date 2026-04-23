const pool = require('../db');

async function createReturn(req, res) {
  try {
    const { requestId, conditionAfter } = req.body;
    if (!requestId || !conditionAfter) {
      return res.status(400).json({ message: 'requestId dan conditionAfter dibutuhkan' });
    }

    const [rows] = await pool.query('SELECT id FROM `request` WHERE id = ?', [requestId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    const [result] = await pool.query(
      'INSERT INTO `return` (requestId, conditionAfter) VALUES (?, ?)',
      [requestId, conditionAfter]
    );

    return res.status(201).json({ id: result.insertId, requestId, conditionAfter });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat return' });
  }
}

module.exports = { createReturn };