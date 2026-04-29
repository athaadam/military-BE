const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'military_db';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

async function ensureItemImageColumn() {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
    [DB_NAME, 'item', 'imageUrl']
  );

  if (rows[0]?.total === 0) {
    await pool.query('ALTER TABLE `item` ADD COLUMN `imageUrl` LONGTEXT NULL AFTER `warehouseId`');
    console.log('✅ Added item.imageUrl column');
  }
}

async function ensureIndex(tableName, indexName, createSql) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
    [DB_NAME, tableName, indexName]
  );

  if (rows[0]?.total === 0) {
    await pool.query(createSql);
  }
}

async function ensureItemConditionStockTable() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS `item_condition_stock` (' +
      '`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
      '`itemId` INT NOT NULL,' +
      '`condition` ENUM(\'Aktif\', \'Digunakan\', \'Rusak\', \'Perbaikan\', \'Cadangan\', \'Habis\') NOT NULL,' +
      '`quantity` INT NOT NULL DEFAULT 0,' +
      '`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,' +
      '`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,' +
      'UNIQUE KEY `uniq_item_condition_stock_item_condition` (`itemId`, `condition`),' +
      'FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
  );

  await ensureIndex('item_condition_stock', 'idx_item_condition_stock_itemId', 'CREATE INDEX `idx_item_condition_stock_itemId` ON `item_condition_stock`(`itemId`)');
  await ensureIndex('item_condition_stock', 'idx_item_condition_stock_condition', 'CREATE INDEX `idx_item_condition_stock_condition` ON `item_condition_stock`(`condition`)');

  await pool.query(
    'INSERT INTO `item_condition_stock` (`itemId`, `condition`, `quantity`) ' +
    'SELECT i.id, i.`condition`, i.stock ' +
    'FROM `item` i ' +
    'LEFT JOIN `item_condition_stock` s ON s.itemId = i.id AND s.`condition` = i.`condition` ' +
    'WHERE s.id IS NULL'
  );

  console.log('✅ Ensured item_condition_stock table and seed data');
}

async function ensureItemConditionMutationLogTable() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS `item_condition_mutation_log` (' +
      '`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
      '`itemId` INT NOT NULL,' +
      '`fromCondition` ENUM(\'Aktif\', \'Digunakan\', \'Rusak\', \'Perbaikan\', \'Cadangan\', \'Habis\') NOT NULL,' +
      '`toCondition` ENUM(\'Aktif\', \'Digunakan\', \'Rusak\', \'Perbaikan\', \'Cadangan\', \'Habis\') NOT NULL,' +
      '`quantity` INT NOT NULL,' +
      '`note` VARCHAR(255) NULL,' +
      '`userId` INT NULL,' +
      '`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,' +
      'FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,' +
      'FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
  );

  await ensureIndex('item_condition_mutation_log', 'idx_item_mutation_itemId', 'CREATE INDEX `idx_item_mutation_itemId` ON `item_condition_mutation_log`(`itemId`)');
  await ensureIndex('item_condition_mutation_log', 'idx_item_mutation_userId', 'CREATE INDEX `idx_item_mutation_userId` ON `item_condition_mutation_log`(`userId`)');
  await ensureIndex('item_condition_mutation_log', 'idx_item_mutation_createdAt', 'CREATE INDEX `idx_item_mutation_createdAt` ON `item_condition_mutation_log`(`created_at`)');

  console.log('✅ Ensured item_condition_mutation_log table');
}

async function runRuntimeMigrations() {
  try {
    await ensureItemImageColumn();
    await ensureItemConditionStockTable();
    await ensureItemConditionMutationLogTable();
  } catch (err) {
    console.error('❌ Failed runtime migrations:', err.message);
  }
}

runRuntimeMigrations();

module.exports = pool;
