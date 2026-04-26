<<<<<<< HEAD
import { prisma } from '../prisma.js'

// GET /api/items
export const getAllItems = async (req, res) => {
  const items = await prisma.item.findMany({
    include: { warehouse: true }
  })
  res.json(items)
}

// GET /api/items/:id
export const getItemById = async (req, res) => {
  const { id } = req.params

  const item = await prisma.item.findUnique({
    where: { id: Number(id) }
  })

  if (!item) return res.status(404).json({ message: 'Item not found' })

  res.json(item)
}

// POST /api/items
export const createItem = async (req, res) => {
  const { name, category, stock, condition, warehouseId } = req.body

  const item = await prisma.item.create({
    data: { name, category, stock, condition, warehouseId }
  })

  res.json(item)
}

// PUT /api/items/:id
export const updateItem = async (req, res) => {
  const { id } = req.params

  const item = await prisma.item.update({
    where: { id: Number(id) },
    data: req.body
  })

  res.json(item)
}

// DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  const { id } = req.params

  await prisma.item.delete({
    where: { id: Number(id) }
  })

  res.json({ message: 'Item deleted' })
}

// PATCH /api/items/:id/status
export const updateItemStatus = async (req, res) => {
  const { id } = req.params
  const { condition } = req.body

  const item = await prisma.item.update({
    where: { id: Number(id) },
    data: { condition }
  })

  res.json(item)
}
=======
const pool = require('../db');

async function getItems(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT i.id, i.name, i.category, i.stock, i.condition, i.warehouseId, w.name AS warehouseName FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id'
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil items' });
  }
}

async function getItemById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT i.id, i.name, i.category, i.stock, i.condition, i.warehouseId, w.name AS warehouseName FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id WHERE i.id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil item' });
  }
}

async function createItem(req, res) {
  try {
    const { name, category, stock = 0, condition = 'baik', warehouseId } = req.body;
    if (!name || !category || warehouseId === undefined) {
      return res.status(400).json({ message: 'Name, category, dan warehouseId dibutuhkan' });
    }
    const [result] = await pool.query(
      'INSERT INTO `item` (name, category, stock, condition, warehouseId) VALUES (?, ?, ?, ?, ?)',
      [name, category, stock, condition, warehouseId]
    );
    return res.status(201).json({ id: result.insertId, name, category, stock, condition, warehouseId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat item' });
  }
}

async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const { name, category, stock, condition, warehouseId } = req.body;
    const [rows] = await pool.query('SELECT id FROM `item` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    const fields = [];
    const values = [];
    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      values.push(category);
    }
    if (stock !== undefined) {
      fields.push('stock = ?');
      values.push(stock);
    }
    if (condition !== undefined) {
      fields.push('condition = ?');
      values.push(condition);
    }
    if (warehouseId !== undefined) {
      fields.push('warehouseId = ?');
      values.push(warehouseId);
    }
    if (!fields.length) {
      return res.status(400).json({ message: 'Tidak ada field yang diupdate' });
    }
    values.push(id);
    await pool.query(`UPDATE \`item\` SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'Item berhasil diupdate' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update item' });
  }
}

async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM `item` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    await pool.query('DELETE FROM `item` WHERE id = ?', [id]);
    return res.json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal hapus item' });
  }
}

async function updateItemStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status dibutuhkan' });
    }
    const [rows] = await pool.query('SELECT id FROM `item` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    await pool.query('UPDATE `item` SET condition = ? WHERE id = ?', [status, id]);
    return res.json({ message: 'Status item berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update status item' });
  }
}

async function repairItem(req, res) {
  try {
    const { id } = req.params;
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: 'Description dibutuhkan' });
    }
    const [rows] = await pool.query('SELECT id FROM `item` WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    await pool.query('INSERT INTO `repair` (itemId, description, status) VALUES (?, ?, ?)', [id, description, 'pending']);
    await pool.query('UPDATE `item` SET condition = ? WHERE id = ?', ['repair', id]);
    return res.status(201).json({ message: 'Permintaan perbaikan berhasil dibuat' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat permintaan perbaikan' });
  }
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemStatus,
  repairItem
};
>>>>>>> 8da931236db4aa5c4387a28a13fc4a3bdba18b30
