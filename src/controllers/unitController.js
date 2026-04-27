const pool = require('../db');

async function getUnits(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, created_at, updated_at FROM `unit` ORDER BY created_at DESC');
    return res.json({ message: 'Units retrieved successfully', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil unit' });
  }
}

async function createUnit(req, res) {
  try {
    const rawId = typeof req.body?.id === 'string' ? req.body.id : '';
    const rawName = typeof req.body?.name === 'string' ? req.body.name : '';

    const id = rawId.trim().toUpperCase();
    const name = rawName.trim();

    if (!id || !name) {
      return res.status(400).json({ message: 'ID dan name dibutuhkan' });
    }
    
    // Validate unit code format (alphanumeric, dash, underscore, 3-50 chars)
    if (!/^[A-Z0-9\-_]{3,50}$/.test(id)) {
      return res.status(400).json({ message: 'Unit ID harus uppercase alphanumeric dengan dash/underscore, 3-50 chars (contoh: KODIM-001)' });
    }

    // Check if unit code already exists
    const [existing] = await pool.query('SELECT id FROM `unit` WHERE id = ?', [id]);
    if (existing.length) {
      return res.status(409).json({ message: 'Unit code sudah digunakan' });
    }

    await pool.query('INSERT INTO `unit` (id, name) VALUES (?, ?)', [id, name]);
    return res.status(201).json({ 
      message: 'Unit berhasil dibuat',
      data: { id, name } 
    });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Unit code sudah digunakan' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat unit' });
  }
}

async function updateUnit(req, res) {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name dibutuhkan' });
    }
    const [rows] = await pool.query('SELECT id FROM `unit` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Unit tidak ditemukan' });
    }
    await pool.query('UPDATE `unit` SET name = ? WHERE id = ?', [name, id]);
    return res.json({ message: 'Unit berhasil diupdate' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update unit' });
  }
}

async function deleteUnit(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT id FROM `unit` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Unit tidak ditemukan' });
    }
    await pool.query('DELETE FROM `unit` WHERE id = ?', [id]);
    return res.json({ message: 'Unit berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal hapus unit' });
  }
}

module.exports = { getUnits, createUnit, updateUnit, deleteUnit };