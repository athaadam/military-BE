-- Create military_db database and tables

USE military_db;

-- Table: unit
CREATE TABLE IF NOT EXISTS `unit` (
  `id` VARCHAR(50) NOT NULL UNIQUE PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'user') NOT NULL DEFAULT 'user',
  `unitId` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: warehouse
CREATE TABLE IF NOT EXISTS `warehouse` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `unitId` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: item
CREATE TABLE IF NOT EXISTS `item` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `category` ENUM('Persenjataan', 'Amunisi', 'Kendaraan Militer') NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `condition` ENUM('Aktif', 'Digunakan', 'Rusak', 'Perbaikan', 'Cadangan', 'Habis') NOT NULL DEFAULT 'Aktif',
  `warehouseId` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: request
CREATE TABLE IF NOT EXISTS `request` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `itemId` INT NOT NULL,
  `quantity` INT NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  `approvedBy` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`approvedBy`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: return
CREATE TABLE IF NOT EXISTS `return` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `requestId` INT NOT NULL,
  `conditionAfter` ENUM('Aktif', 'Rusak', 'Perbaikan') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`requestId`) REFERENCES `request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: repair
CREATE TABLE IF NOT EXISTS `repair` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `itemId` INT NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: log (Audit Logging)
CREATE TABLE IF NOT EXISTS `log` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  `old_value` JSON,
  `new_value` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_request_userId` ON `request`(`userId`);
CREATE INDEX `idx_request_itemId` ON `request`(`itemId`);
CREATE INDEX `idx_request_status` ON `request`(`status`);
CREATE INDEX `idx_user_unitId` ON `user`(`unitId`);
CREATE INDEX `idx_user_role` ON `user`(`role`);
CREATE INDEX `idx_item_warehouseId` ON `item`(`warehouseId`);
CREATE INDEX `idx_item_condition` ON `item`(`condition`);
CREATE INDEX `idx_warehouse_unitId` ON `warehouse`(`unitId`);
CREATE INDEX `idx_log_userId` ON `log`(`userId`);
CREATE INDEX `idx_log_createdAt` ON `log`(`created_at`);

-- ============================================
-- DEFAULT DATA - Initial Setup
-- ============================================

-- Insert default unit (Mabesad Komando)
INSERT INTO `unit` (id, name) VALUES ('MABESAD', 'Markas Besar Angkatan Darat');

-- Insert default superadmin user
-- Password: SuperAdmin123 (hashed with bcrypt salt 10)
-- Hash: $2b$10$DWsh0vIC23yhOca.uCOYK.d6driQ31xThmjqPIT3EfLXtUkVC16N.
-- NOTE: Change this password IMMEDIATELY in production!
INSERT INTO `user` (name, email, password, role, unitId) 
VALUES (
  'MABES TNI',
  'superadmin@military.com',
  '$2b$10$DWsh0vIC23yhOca.uCOYK.d6driQ31xThmjqPIT3EfLXtUkVC16N.',
  'superadmin',
  'MABESAD'
);

