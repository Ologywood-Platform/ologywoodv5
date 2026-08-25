CREATE TABLE `content_release_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`releaseId` int NOT NULL,
	`userId` int NOT NULL,
	`amountPaid` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`accessGrantedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_release_purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_content_release_purchase` UNIQUE(`releaseId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`releaseType` varchar(50) NOT NULL,
	`genre` varchar(100),
	`duration` varchar(50),
	`thumbnailUrl` text,
	`trailerUrl` text,
	`hostingPlatform` varchar(50) NOT NULL,
	`contentUrl` text NOT NULL,
	`accessModel` varchar(50) NOT NULL DEFAULT 'free',
	`price` decimal(10,2),
	`minPrice` decimal(10,2),
	`premiereDate` timestamp,
	`isPublished` boolean NOT NULL DEFAULT false,
	`includesLiveQA` boolean NOT NULL DEFAULT false,
	`includesBonusContent` boolean NOT NULL DEFAULT false,
	`bonusContentDescription` text,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`viewCount` int NOT NULL DEFAULT 0,
	`purchaseCount` int NOT NULL DEFAULT 0,
	`revenue` decimal(10,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `releases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merch_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`merchItemId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`imageUrl` varchar(2048),
	`selectedVariants` json DEFAULT ('{}'),
	`quantity` int NOT NULL,
	`unitPriceCents` int NOT NULL,
	`lineTotalCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merch_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merch_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(24) NOT NULL,
	`sellerUserId` int NOT NULL,
	`sellerType` enum('artist','venue') NOT NULL,
	`buyerUserId` int,
	`buyerEmail` varchar(320) NOT NULL,
	`buyerName` varchar(255) NOT NULL,
	`buyerPhone` varchar(30),
	`fulfillmentMethod` enum('shipping','pickup') NOT NULL,
	`shippingAddress` json,
	`status` enum('new','confirmed','preparing','shipped','ready_for_pickup','completed','cancelled','refunded') NOT NULL DEFAULT 'new',
	`subtotalCents` int NOT NULL,
	`shippingCents` int NOT NULL DEFAULT 0,
	`totalCents` int NOT NULL,
	`platformFeeCents` int NOT NULL,
	`sellerNetCents` int NOT NULL,
	`stripeCheckoutSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`trackingNumber` varchar(255),
	`trackingCarrier` varchar(100),
	`trackingUrl` varchar(2048),
	`pickupNotes` text,
	`fulfillmentNotes` text,
	`customerNote` text,
	`paidAt` timestamp,
	`fulfilledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merch_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `merch_orders_orderNumber_unique` UNIQUE(`orderNumber`),
	CONSTRAINT `merch_orders_stripeCheckoutSessionId_unique` UNIQUE(`stripeCheckoutSessionId`)
);
--> statement-breakpoint
ALTER TABLE `merch_items` MODIFY COLUMN `externalUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `merch_items` ADD `sellingMethod` enum('ologywood','external') DEFAULT 'external' NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `priceInCents` int;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `variants` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `merch_items` ADD `trackInventory` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `inventoryQuantity` int;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `shippingAvailable` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `pickupAvailable` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `shippingAmountCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_items` ADD `fulfillmentTime` varchar(100);--> statement-breakpoint
CREATE INDEX `idx_content_purchases_release` ON `content_release_purchases` (`releaseId`);--> statement-breakpoint
CREATE INDEX `idx_content_purchases_user` ON `content_release_purchases` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_content_releases_artist` ON `releases` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_content_releases_user` ON `releases` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_content_releases_type` ON `releases` (`releaseType`);--> statement-breakpoint
CREATE INDEX `idx_content_releases_published` ON `releases` (`isPublished`);--> statement-breakpoint
CREATE INDEX `idx_merch_order_items_order` ON `merch_order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_merch_order_items_item` ON `merch_order_items` (`merchItemId`);--> statement-breakpoint
CREATE INDEX `idx_merch_orders_seller` ON `merch_orders` (`sellerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_merch_orders_buyer` ON `merch_orders` (`buyerUserId`);--> statement-breakpoint
CREATE INDEX `idx_merch_orders_buyer_email` ON `merch_orders` (`buyerEmail`);--> statement-breakpoint
CREATE INDEX `idx_merch_orders_status` ON `merch_orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_merch_orders_stripe_session` ON `merch_orders` (`stripeCheckoutSessionId`);--> statement-breakpoint
CREATE INDEX `idx_merch_orders_number` ON `merch_orders` (`orderNumber`);