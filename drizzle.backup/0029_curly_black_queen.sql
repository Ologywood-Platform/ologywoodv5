CREATE TABLE `artist_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`bookingId` int NOT NULL,
	`grossAmount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`netAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','paid_out') NOT NULL DEFAULT 'pending',
	`payoutId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_earnings_id` PRIMARY KEY(`id`),
	CONSTRAINT `artist_earnings_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `artist_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`payoutMethod` enum('bank_transfer','stripe_connect','manual') NOT NULL DEFAULT 'bank_transfer',
	`stripeTransferId` varchar(255),
	`bankAccountId` int,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`artistId` int NOT NULL,
	`venueId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) DEFAULT 0,
	`platformFee` decimal(10,2) DEFAULT 0,
	`total` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','viewed','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`pdfUrl` text,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`paidAt` timestamp,
	`dueDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_bookingId_unique` UNIQUE(`bookingId`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `stripe_connect_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`stripeAccountId` varchar(255) NOT NULL,
	`status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
	`chargesEnabled` boolean NOT NULL DEFAULT false,
	`payoutsEnabled` boolean NOT NULL DEFAULT false,
	`bankAccountVerified` boolean NOT NULL DEFAULT false,
	`verificationStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_connect_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_connect_accounts_artistId_unique` UNIQUE(`artistId`),
	CONSTRAINT `stripe_connect_accounts_stripeAccountId_unique` UNIQUE(`stripeAccountId`)
);
