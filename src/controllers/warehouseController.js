const pool = require('../db');

async function getWarehouses(req, res) {
  try {
    let query = 'SELECT w.id, w.name, w.unitId, u.name AS unitName FROM `warehouse` w LEFT JOIN `unit` u ON w.unitId = u.id';
    const params = [];

    // Admin only sees warehouses in their unit
    if (req.user.role === 'admin') {
      query += ' WHERE w.unitId = ?';
      params.push(req.user.unitId);
    } else if (req.user.role === 'superadmin' && req.query.unitId) {
      query += ' WHERE w.unitId = ?';
      params.push(req.query.unitId);
    }

    const [rows] = await pool.query(query, params);
    return res.json({ message: 'Data warehouse berhasil diambil', data: rows });
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

    // Admin can only create warehouses in their own unit
    if (req.user.role === 'admin' && req.user.unitId !== unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat membuat warehouse di unit mereka sendiri' });
    }

    const [result] = await pool.query('INSERT INTO `warehouse` (name, unitId) VALUES (?, ?)', [name, unitId]);
    return res.status(201).json({ message: 'Warehouse berhasil dibuat', data: { id: result.insertId, name, unitId } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat warehouse' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const id = req.params.id;
    const { name, unitId } = req.body;
    const [rows] = await pool.query('SELECT id, unitId FROM `warehouse` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Warehouse tidak ditemukan' });
    }

    const warehouse = rows[0];

    // Admin can only update warehouses in their unit
    if (req.user.role === 'admin' && req.user.unitId !== warehouse.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat mengedit warehouse di unit mereka sendiri' });
    }

    // If updating unitId, admin can only move to their own unit
    if (unitId && req.user.role === 'admin' && req.user.unitId !== unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat memindahkan warehouse ke unit mereka sendiri' });
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
    
    // Fetch updated data
    const [updatedRows] = await pool.query('SELECT w.id, w.name, w.unitId, u.name AS unitName FROM `warehouse` w LEFT JOIN `unit` u ON w.unitId = u.id WHERE w.id = ?', [id]);
    return res.json({ message: 'Warehouse berhasil diupdate', data: updatedRows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update warehouse' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT id, unitId FROM `warehouse` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Warehouse tidak ditemukan' });
    }

    const warehouse = rows[0];

    // Admin can only delete warehouses in their unit
    if (req.user.role === 'admin' && req.user.unitId !== warehouse.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat menghapus warehouse di unit mereka sendiri' });
    }

    await pool.query('DELETE FROM `warehouse` WHERE id = ?', [id]);
    return res.json({ message: 'Warehouse berhasil dihapus', data: { id } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal hapus warehouse' });
  }
}

module.exports = { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse };