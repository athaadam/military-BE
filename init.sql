-- Create military_db database and tables

USE military_db;

-- Table: unit
CREATE TABLE IF NOT EXISTS `unit` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'user',
  `unitId` INT NOT NULL,
  FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: warehouse
CREATE TABLE IF NOT EXISTS `warehouse` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `unitId` INT NOT NULL,
  FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: item
CREATE TABLE IF NOT EXISTS `item` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `condition` VARCHAR(191) NOT NULL,
  `warehouseId` INT NOT NULL,
  FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: request
CREATE TABLE IF NOT EXISTS `request` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `itemId` INT NOT NULL,
  `quantity` INT NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `approvedBy` INT,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`approvedBy`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: return
CREATE TABLE IF NOT EXISTS `return` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `requestId` INT NOT NULL,
  `conditionAfter` VARCHAR(191) NOT NULL,
  FOREIGN KEY (`requestId`) REFERENCES `request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: repair
CREATE TABLE IF NOT EXISTS `repair` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `itemId` INT NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: log
CREATE TABLE IF NOT EXISTS `log` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_request_userId` ON `request`(`userId`);
CREATE INDEX `idx_request_itemId` ON `request`(`itemId`);
CREATE INDEX `idx_user_unitId` ON `user`(`unitId`);
CREATE INDEX `idx_item_warehouseId` ON `item`(`warehouseId`);
CREATE INDEX `idx_warehouse_unitId` ON `warehouse`(`unitId`);
CREATE INDEX `idx_log_userId` ON `log`(`userId`);
