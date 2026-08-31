CREATE TABLE IF NOT EXISTS `book_download_access` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `orderItemId` int NOT NULL,
  `merchItemId` int NOT NULL,
  `buyerUserId` int,
  `buyerEmail` varchar(320) NOT NULL,
  `status` enum('active','refunded','revoked') NOT NULL DEFAULT 'active',
  `downloadCount` int NOT NULL DEFAULT 0,
  `maxDownloads` int NOT NULL DEFAULT 5,
  `lastDownloadedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `book_download_access_id` PRIMARY KEY(`id`),
  CONSTRAINT `book_download_access_orderItemId_unique` UNIQUE(`orderItemId`),
  KEY `idx_book_download_order` (`orderId`),
  KEY `idx_book_download_item` (`merchItemId`),
  KEY `idx_book_download_buyer` (`buyerUserId`),
  KEY `idx_book_download_email` (`buyerEmail`)
);--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `productCategory` enum('merch','book') DEFAULT 'merch' NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `bookFormat` enum('paperback','hardcover','ebook') NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `isbn` varchar(32) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `publisher` varchar(255) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `publicationDate` date NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `edition` varchar(100) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `pageCount` int NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `language` varchar(100) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `isSigned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookFileKey` varchar(1024) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookFileName` varchar(255) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookFileSize` int NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookMimeType` varchar(100) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookFileFormat` enum('pdf','epub') NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookRightsConfirmed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `ebookRightsConfirmedAt` timestamp NULL;--> statement-breakpoint
ALTER TABLE `book_download_access` ADD COLUMN IF NOT EXISTS `status` enum('active','refunded','revoked') NOT NULL DEFAULT 'active' AFTER `buyerEmail`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_merch_items_category` ON `merch_items` (`productCategory`,`bookFormat`,`isActive`);
