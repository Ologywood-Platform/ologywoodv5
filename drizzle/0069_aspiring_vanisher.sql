CREATE TABLE `ticket_promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` int NOT NULL,
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`minTickets` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_promo_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketItemId` int NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`toName` varchar(255),
	`status` enum('pending','accepted','cancelled') NOT NULL DEFAULT 'pending',
	`transferCode` varchar(36) NOT NULL,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `ticket_transfers_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticket_transfers_transferCode_unique` UNIQUE(`transferCode`)
);
--> statement-breakpoint
CREATE INDEX `idx_promo_codes_event` ON `ticket_promo_codes` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_promo_codes_code` ON `ticket_promo_codes` (`eventId`,`code`);--> statement-breakpoint
CREATE INDEX `idx_transfers_ticket` ON `ticket_transfers` (`ticketItemId`);--> statement-breakpoint
CREATE INDEX `idx_transfers_to_email` ON `ticket_transfers` (`toEmail`);--> statement-breakpoint
CREATE INDEX `idx_transfers_code` ON `ticket_transfers` (`transferCode`);