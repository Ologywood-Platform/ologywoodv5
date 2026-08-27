ALTER TABLE `merch_items` MODIFY COLUMN `externalUrl` varchar(2048) NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `sellingMethod` enum('ologywood','external') DEFAULT 'external' NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `priceInCents` int NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `variants` json NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `trackInventory` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `inventoryQuantity` int NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `shippingAvailable` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `pickupAvailable` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `shippingAmountCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD COLUMN IF NOT EXISTS `fulfillmentTime` varchar(100) NULL;
