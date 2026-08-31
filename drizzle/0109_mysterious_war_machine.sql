ALTER TABLE `book_download_access` ADD COLUMN IF NOT EXISTS `status` enum('active','refunded','revoked') NOT NULL DEFAULT 'active' AFTER `buyerEmail`;
