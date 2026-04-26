const pool = require('../db');

async function getWarehouses(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT w.id, w.name, w.unitId, u.name AS unitName FROM `warehouse` w LEFT JOIN `unit` u ON w.unitId = u.id'
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil data warehouse' });
  }
}

async function createWarehouse(req, res) {
  try {
    const { name, unitId } = req.body;
    if (!name || !unitId) {
      return res.status(400).json({ message: 'Name dan unitId dibutuhkan' });
    }
    const [result] = await pool.query('INSERT INTO `warehouse` (name, unitId) VALUES (?, ?)', [name, unitId]);
    return res.status(201).json({ id: result.insertId, name, unitId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat warehouse' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const id = req.params.id;
    const { name, unitId } = req.body;
    const [rows] = await pool.query('SELECT id FROM `warehouse` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Warehouse tidak ditemukan' });
    }
    const fields = [];
    const values = [];
    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (unitId) {
      fields.push('unitId = ?');
      values.push(unitId);
    }
    if (!fields.length) {
      return res.status(400).json({ message: 'Tidak ada field yang diupdate' });
    }
    values.push(id);
    await pool.query(`UPDATE \`warehouse\` SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'Warehouse berhasil diupdate' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update warehouse' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT id FROM `warehouse` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Warehouse tidak ditemukan' });
    }
    await pool.query('DELETE FROM `warehouse` WHERE id = ?', [id]);
    return res.json({ message: 'Warehouse berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal hapus warehouse' });
  }
}

module.exports = { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse };