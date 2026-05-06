const pool = require('../db');

const ITEM_CONDITIONS = ['Aktif', 'Digunakan', 'Rusak', 'Perbaikan', 'Cadangan', 'Habis'];

function createEmptyConditionStock() {
  return ITEM_CONDITIONS.reduce((accumulator, condition) => {
    accumulator[condition] = 0;
    return accumulator;
  }, {});
}

function normalizeConditionStock(rows) {
  const conditionStock = createEmptyConditionStock();

  rows.forEach((row) => {
    conditionStock[row.condition] = Number(row.quantity) || 0;
  });

  const totalStock = ITEM_CONDITIONS.reduce((sum, condition) => sum + conditionStock[condition], 0);
  const availableStock = conditionStock.Aktif + conditionStock.Cadangan;
  const unavailableStock = totalStock - availableStock;
  const primaryCondition = [...ITEM_CONDITIONS].sort((left, right) => conditionStock[right] - conditionStock[left])[0] || 'Aktif';

  return { conditionStock, totalStock, availableStock, unavailableStock, primaryCondition };
}

async function getConditionRows(itemId, db = pool) {
  const [rows] = await db.query(
    'SELECT `condition`, quantity FROM `item_condition_stock` WHERE itemId = ?',
    [itemId],
  );

  return rows;
}

async function syncLegacyItemStock(itemId, db = pool) {
  const conditionRows = await getConditionRows(itemId, db);
  const { totalStock, primaryCondition } = normalizeConditionStock(conditionRows);

  await db.query('UPDATE `item` SET stock = ?, `condition` = ? WHERE id = ?', [totalStock, primaryCondition, itemId]);
}

async function attachConditionSummary(items, db = pool) {
  if (!items.length) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const placeholders = itemIds.map(() => '?').join(', ');
  const [rows] = await db.query(
    `SELECT itemId, \`condition\`, quantity FROM \`item_condition_stock\` WHERE itemId IN (${placeholders})`,
    itemIds,
  );

  const grouped = rows.reduce((accumulator, row) => {
    if (!accumulator[row.itemId]) {
      accumulator[row.itemId] = [];
    }
    accumulator[row.itemId].push(row);
    return accumulator;
  }, {});

  return items.map((item) => {
    const { conditionStock, totalStock, availableStock, unavailableStock, primaryCondition } = normalizeConditionStock(grouped[item.id] || []);
    return {
      ...item,
      stock: totalStock,
      availableStock,
      unavailableStock,
      condition: primaryCondition,
      conditionStock,
    };
  });
}

async function getItemWithWarehouse(itemId, db = pool) {
  const [rows] = await db.query(
    'SELECT i.id, i.name, i.category, i.stock, i.`condition`, i.warehouseId, i.imageUrl, w.name AS warehouseName, w.unitId FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id WHERE i.id = ?',
    [itemId],
  );

  if (!rows.length) {
    return null;
  }

  const [item] = await attachConditionSummary(rows, db);
  return item;
}

async function canAdminAccessWarehouse(user, warehouseId, db = pool) {
  const [rows] = await db.query('SELECT id, unitId FROM `warehouse` WHERE id = ?', [warehouseId]);
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
    } else if (req.user.role === 'superadmin' && req.query.unitId) {
      query += ' WHERE w.unitId = ?';
      params.push(req.query.unitId);
    }

    const [rows] = await pool.query(query, params);
    const data = await attachConditionSummary(rows, pool);
    return res.json({ message: 'Data item berhasil diambil', data });
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

async function getItemDetail(req, res) {
  try {
    const { id } = req.params;
    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat melihat item di unit mereka sendiri' });
    }

    const [historyRows] = await pool.query(
      'SELECT id, itemId, fromCondition, toCondition, quantity, note, userId, created_at FROM `item_condition_mutation_log` WHERE itemId = ? ORDER BY created_at DESC LIMIT 20',
      [id],
    );

    return res.json({
      message: 'Detail item berhasil diambil',
      data: {
        ...item,
        mutationHistory: historyRows,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil detail item' });
  }
}

async function createItem(req, res) {
  const connection = await pool.getConnection();

  try {
    const { name, category, stock = 0, condition = 'Aktif', warehouseId, imageUrl } = req.body;
    if (!name || !category || warehouseId === undefined || !imageUrl) {
      return res.status(400).json({ message: 'Name, category, warehouseId, dan imageUrl dibutuhkan' });
    }

    const accessCheck = await canAdminAccessWarehouse(req.user, warehouseId, connection);
    if (!accessCheck.allowed) {
      return res.status(accessCheck.status).json({ message: accessCheck.message });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO `item` (name, category, stock, `condition`, warehouseId, imageUrl) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, stock, condition, warehouseId, imageUrl],
    );

    await connection.query(
      'INSERT INTO `item_condition_stock` (itemId, `condition`, quantity) VALUES (?, ?, ?)',
      [result.insertId, condition, stock],
    );

    await syncLegacyItemStock(result.insertId, connection);
    await connection.commit();

    const createdItem = await getItemWithWarehouse(result.insertId);
    return res.status(201).json({ message: 'Item berhasil dibuat', data: createdItem });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Gagal membuat item' });
  } finally {
    connection.release();
  }
}

async function updateItem(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { name, category, stock, condition, warehouseId, imageUrl } = req.body;
    const item = await getItemWithWarehouse(id, connection);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat mengedit item di unit mereka sendiri' });
    }

    if (warehouseId !== undefined) {
      const accessCheck = await canAdminAccessWarehouse(req.user, warehouseId, connection);
      if (!accessCheck.allowed) {
        return res.status(accessCheck.status).json({ message: accessCheck.message });
      }
    }

    if (imageUrl !== undefined && !imageUrl) {
      return res.status(400).json({ message: 'Image tidak valid' });
    }

    await connection.beginTransaction();

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
    if (warehouseId !== undefined) {
      fields.push('warehouseId = ?');
      values.push(warehouseId);
    }
    if (imageUrl !== undefined) {
      fields.push('imageUrl = ?');
      values.push(imageUrl);
    }

    const hasLegacyStockUpdate = stock !== undefined || condition !== undefined;
    if (hasLegacyStockUpdate) {
      const nextStock = stock !== undefined ? Number(stock) : item.stock;
      const nextCondition = condition !== undefined ? condition : item.condition;
      await connection.query('DELETE FROM `item_condition_stock` WHERE itemId = ?', [id]);
      await connection.query(
        'INSERT INTO `item_condition_stock` (itemId, `condition`, quantity) VALUES (?, ?, ?)',
        [id, nextCondition, nextStock],
      );
    }

    if (fields.length) {
      values.push(id);
      await connection.query(`UPDATE \`item\` SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (!fields.length && !hasLegacyStockUpdate) {
      await connection.rollback();
      return res.status(400).json({ message: 'Tidak ada field yang diupdate' });
    }

    await syncLegacyItemStock(id, connection);
    await connection.commit();

    const updatedItem = await getItemWithWarehouse(id);
    return res.json({ message: 'Item berhasil diupdate', data: updatedItem });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Gagal update item' });
  } finally {
    connection.release();
  }
}

async function transferItemCondition(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { fromCondition, toCondition, quantity, note } = req.body;

    if (!ITEM_CONDITIONS.includes(fromCondition) || !ITEM_CONDITIONS.includes(toCondition)) {
      return res.status(400).json({ message: 'Kondisi item tidak valid' });
    }

    if (fromCondition === toCondition) {
      return res.status(400).json({ message: 'Kondisi asal dan tujuan tidak boleh sama' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity harus bilangan bulat lebih dari 0' });
    }

    await connection.beginTransaction();

    const [itemRows] = await connection.query(
      'SELECT i.id, w.unitId FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id WHERE i.id = ? FOR UPDATE',
      [id],
    );

    if (!itemRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && itemRows[0].unitId !== req.user.unitId) {
      await connection.rollback();
      return res.status(403).json({ message: 'Admin hanya dapat memutasi item di unit mereka sendiri' });
    }

    const [fromRows] = await connection.query(
      'SELECT quantity FROM `item_condition_stock` WHERE itemId = ? AND `condition` = ? FOR UPDATE',
      [id, fromCondition],
    );

    const available = fromRows[0]?.quantity || 0;
    if (available < qty) {
      await connection.rollback();
      return res.status(400).json({
        message: `Stok kondisi ${fromCondition} tidak mencukupi`,
        available,
        requested: qty,
      });
    }

    await connection.query(
      'UPDATE `item_condition_stock` SET quantity = quantity - ? WHERE itemId = ? AND `condition` = ?',
      [qty, id, fromCondition],
    );

    await connection.query(
      'INSERT INTO `item_condition_stock` (itemId, `condition`, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
      [id, toCondition, qty],
    );

    await connection.query(
      'INSERT INTO `item_condition_mutation_log` (itemId, fromCondition, toCondition, quantity, note, userId) VALUES (?, ?, ?, ?, ?, ?)',
      [id, fromCondition, toCondition, qty, note || null, req.user.id],
    );

    await syncLegacyItemStock(id, connection);
    await connection.commit();

    const updatedItem = await getItemWithWarehouse(id);
    const [historyRows] = await pool.query(
      'SELECT id, itemId, fromCondition, toCondition, quantity, note, userId, created_at FROM `item_condition_mutation_log` WHERE itemId = ? ORDER BY created_at DESC LIMIT 20',
      [id],
    );

    return res.json({
      message: 'Mutasi kondisi item berhasil',
      data: {
        ...updatedItem,
        mutationHistory: historyRows,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Gagal memutasi kondisi item' });
  } finally {
    connection.release();
  }
}

async function addStock(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { quantity, condition = 'Aktif', note } = req.body;

    if (!ITEM_CONDITIONS.includes(condition)) {
      return res.status(400).json({ message: 'Kondisi item tidak valid' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity harus bilangan bulat lebih dari 0' });
    }

    await connection.beginTransaction();

    const [itemRows] = await connection.query(
      'SELECT i.id, w.unitId FROM `item` i LEFT JOIN `warehouse` w ON i.warehouseId = w.id WHERE i.id = ? FOR UPDATE',
      [id],
    );

    if (!itemRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && itemRows[0].unitId !== req.user.unitId) {
      await connection.rollback();
      return res.status(403).json({ message: 'Admin hanya dapat menambah stok item di unit mereka sendiri' });
    }

    await connection.query(
      'INSERT INTO `item_condition_stock` (itemId, `condition`, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
      [id, condition, qty],
    );

    await connection.query(
      'INSERT INTO `item_condition_mutation_log` (itemId, fromCondition, toCondition, quantity, note, userId) VALUES (?, ?, ?, ?, ?, ?)',
      [id, null, condition, qty, note || null, req.user.id],
    );

    await syncLegacyItemStock(id, connection);
    await connection.commit();

    const updatedItem = await getItemWithWarehouse(id);
    const [historyRows] = await pool.query(
      'SELECT id, itemId, fromCondition, toCondition, quantity, note, userId, created_at FROM `item_condition_mutation_log` WHERE itemId = ? ORDER BY created_at DESC LIMIT 20',
      [id],
    );

    return res.json({
      message: 'Stok item berhasil ditambahkan',
      data: {
        ...updatedItem,
        mutationHistory: historyRows,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Gagal menambahkan stok item' });
  } finally {
    connection.release();
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

    if (!ITEM_CONDITIONS.includes(status)) {
      return res.status(400).json({ message: 'Status item tidak valid' });
    }

    const item = await getItemWithWarehouse(id);
    if (!item) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if (req.user.role === 'admin' && item.unitId !== req.user.unitId) {
      return res.status(403).json({ message: 'Admin hanya dapat mengubah status item di unit mereka sendiri' });
    }

    const conditionRows = await getConditionRows(id);
    const currentTotal = normalizeConditionStock(conditionRows).totalStock;

    await pool.query('DELETE FROM `item_condition_stock` WHERE itemId = ?', [id]);
    await pool.query(
      'INSERT INTO `item_condition_stock` (itemId, `condition`, quantity) VALUES (?, ?, ?)',
      [id, status, currentTotal],
    );

    await syncLegacyItemStock(id);
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
  getItemDetail,
  createItem,
  updateItem,
  transferItemCondition,
  addStock,
  deleteItem,
  updateItemStatus,
  repairItem,
};