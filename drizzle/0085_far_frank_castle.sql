CREATE TABLE `merch_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userType` enum('artist','venue') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`priceDisplay` varchar(50) NOT NULL,
	`externalUrl` varchar(2048) NOT NULL,
	`imageUrls` json DEFAULT ('[]'),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merch_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_merch_items_user` ON `merch_items` (`userId`,`userType`);--> statement-breakpoint
CREATE INDEX `idx_merch_items_active` ON `merch_items` (`userId`,`isActive`);