CREATE TABLE `ticket_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`tierId` int NOT NULL,
	`eventId` int NOT NULL,
	`ticketCode` varchar(36) NOT NULL,
	`attendeeName` varchar(255),
	`attendeeEmail` varchar(320),
	`status` enum('valid','used','cancelled','refunded') NOT NULL DEFAULT 'valid',
	`checkedInAt` timestamp,
	`checkedInBy` int,
	`price` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticket_items_ticketCode_unique` UNIQUE(`ticketCode`)
);
--> statement-breakpoint
CREATE TABLE `ticket_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`buyerUserId` int,
	`buyerEmail` varchar(320) NOT NULL,
	`buyerName` varchar(255),
	`buyerPhone` varchar(20),
	`status` enum('pending','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`totalAmount` int NOT NULL,
	`platformFee` int NOT NULL,
	`stripeCheckoutSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`orderNumber` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticket_orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `ticket_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`quantity` int NOT NULL,
	`quantitySold` int NOT NULL DEFAULT 0,
	`maxPerOrder` int NOT NULL DEFAULT 10,
	`salesStartDate` timestamp,
	`salesEndDate` timestamp,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ticket_items_order` ON `ticket_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_items_tier` ON `ticket_items` (`tierId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_items_event` ON `ticket_items` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_items_code` ON `ticket_items` (`ticketCode`);--> statement-breakpoint
CREATE INDEX `idx_ticket_items_status` ON `ticket_items` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ticket_orders_event` ON `ticket_orders` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_orders_buyer` ON `ticket_orders` (`buyerUserId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_orders_status` ON `ticket_orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ticket_orders_stripe` ON `ticket_orders` (`stripeCheckoutSessionId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_orders_number` ON `ticket_orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `idx_ticket_tiers_event` ON `ticket_tiers` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_ticket_tiers_active` ON `ticket_tiers` (`eventId`,`isActive`);