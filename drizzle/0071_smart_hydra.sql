CREATE TABLE `venue_contract_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueContractId` int NOT NULL,
	`userId` int NOT NULL,
	`signerRole` enum('artist','venue'),
	`signerName` varchar(255),
	`ipAddress` varchar(45),
	`signatureData` text NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venue_contract_signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venue_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`venueId` int NOT NULL,
	`artistId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`contractType` enum('uploaded_pdf','platform_generated') NOT NULL DEFAULT 'platform_generated',
	`fileUrl` text,
	`contractData` json,
	`status` enum('draft','sent','viewed','signed_by_venue','signed_by_artist','fully_signed','declined') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venue_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_venue_contract_sigs_contract` ON `venue_contract_signatures` (`venueContractId`);--> statement-breakpoint
CREATE INDEX `idx_venue_contract_sigs_user` ON `venue_contract_signatures` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_venue_contracts_booking` ON `venue_contracts` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_venue_contracts_venue` ON `venue_contracts` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_venue_contracts_artist` ON `venue_contracts` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_venue_contracts_status` ON `venue_contracts` (`status`);