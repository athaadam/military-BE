const pool = require('../db');

async function getUnits(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name FROM `unit`');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil unit' });
  }
}

async function createUnit(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name dibutuhkan' });
    }
    const [result] = await pool.query('INSERT INTO `unit` (name) VALUES (?)', [name]);
    return res.status(201).json({ id: result.insertId, name });
  } catch (err) {
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