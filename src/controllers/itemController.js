const pool = require('../db');

async function getItemWithWarehouse(itemId) {
  const [rows] = await pool.query(
    'SELECT i.id, i.name, i.category, i.stock, i.`condition`, i.warehouseId, i.imageUrl, w.name AS warehouseName, w.unitId FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id WHERE i.id = ?',
    [itemId]
  );

  return rows[0] || null;
}

async function canAdminAccessWarehouse(user, warehouseId) {
  const [rows] = await pool.query('SELECT id, unitId FROM `warehouse` WHERE id = ?', [warehouseId]);
  if (!rows.length) {
    return { allowed: false, status: 404, message: 'Warehouse tidak ditemukan' };
  }

  if (user.role === 'admin' && rows[0].unitId !== user.unitId) {
    return { allowed: false, status: 403, message: 'Admin hanya dapat mengelola item di unit mereka sendiri' };
  }

  return { allowed: true, warehouse: rows[0] };
}

async function getItems(req, res) {
  try {
    let query = 'SELECT i.id, i.name, i.category, i.stock, i.`condition`, i.warehouseId, i.imageUrl, w.name AS warehouseName, w.unitId FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id';
    const params = [];

    if (req.user.role === 'admin') {
      query += ' WHERE w.unitId = ?';
      params.push(req.user.unitId);
    }

    const [rows] = await pool.query(query, params);
    return res.json({ message: 'Data item berhasil diambil', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil items' });
  }
}

async function getItemById(req, res) {
  try {
    const { id } = req.params;
    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat melihat item di unit mereka sendiri' });
    }

    return res.json({ message: 'Item berhasil diambil', data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil item' });
  }
}

async function createItem(req, res) {
  try {
    const { name, category, stock = 0, condition = 'Aktif', warehouseId, imageUrl } = req.body;
    if (!name || !category || warehouseId === undefined || !imageUrl) {
      return res.status(400).json({ message: 'Name, category, warehouseId, dan imageUrl dibutuhkan' });
    }

    const accessCheck = await canAdminAccessWarehouse(req.user, warehouseId);
    if (!accessCheck.allowed) {
      return res.status(accessCheck.status).json({ message: accessCheck.message });
    }

    const [result] = await pool.query(
      'INSERT INTO `item` (name, category, stock, `condition`, warehouseId, imageUrl) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, stock, condition, warehouseId, imageUrl]
    );

    const createdItem = await getItemWithWarehouse(result.insertId);
    return res.status(201).json({ message: 'Item berhasil dibuat', data: createdItem });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat item' });
  }
}

async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const { name, category, stock, condition, warehouseId, imageUrl } = req.body;
    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat mengedit item di unit mereka sendiri' });
    }

    if (warehouseId !== undefined) {
      const accessCheck = await canAdminAccessWarehouse(req.user, warehouseId);
      if (!accessCheck.allowed) {
        return res.status(accessCheck.status).json({ message: accessCheck.message });
      }
    }

    if (imageUrl !== undefined && !imageUrl) {
      return res.status(400).json({ message: 'Image tidak valid' });
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
      fields.push('`condition` = ?');
      values.push(condition);
    }
    if (warehouseId !== undefined) {
      fields.push('warehouseId = ?');
      values.push(warehouseId);
    }
    if (imageUrl !== undefined) {
      fields.push('imageUrl = ?');
      values.push(imageUrl);
    }
    if (!fields.length) {
      return res.status(400).json({ message: 'Tidak ada field yang diupdate' });
    }
    values.push(id);
    await pool.query(`UPDATE \`item\` SET ${fields.join(', ')} WHERE id = ?`, values);

    const updatedItem = await getItemWithWarehouse(id);
    return res.json({ message: 'Item berhasil diupdate', data: updatedItem });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal update item' });
  }
}

async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat menghapus item di unit mereka sendiri' });
    }

    await pool.query('DELETE FROM `item` WHERE id = ?', [id]);
    return res.json({ message: 'Item berhasil dihapus', data: { id: Number(id) } });
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
    if (!['Aktif', 'Digunakan', 'Rusak', 'Perbaikan', 'Cadangan', 'Habis'].includes(status)) {
      return res.status(400).json({ message: 'Status item tidak valid' });
    }
    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat mengubah status item di unit mereka sendiri' });
    }
    await pool.query('UPDATE `item` SET `condition` = ? WHERE id = ?', [status, id]);
    const updatedItem = await getItemWithWarehouse(id);
    return res.json({ message: 'Status item berhasil diperbarui', data: updatedItem });
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
    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat mengajukan repair untuk item di unit mereka sendiri' });
    }
    await pool.query('INSERT INTO `repair` (itemId, description, status) VALUES (?, ?, ?)', [id, description, 'pending']);
    await pool.query('UPDATE `item` SET `condition` = ? WHERE id = ?', ['Perbaikan', id]);
    const updatedItem = await getItemWithWarehouse(id);
    return res.status(201).json({ message: 'Permintaan perbaikan berhasil dibuat', data: updatedItem });
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