CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`artistId` int NOT NULL,
	`venueId` int NOT NULL,
	`contractType` varchar(50) NOT NULL DEFAULT 'ryder',
	`contractTitle` varchar(255) NOT NULL,
	`contractContent` text NOT NULL,
	`contractPdfUrl` text,
	`status` enum('draft','pending_signatures','signed','executed','cancelled') NOT NULL DEFAULT 'draft',
	`artistSignedAt` timestamp,
	`venueSignedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contracts_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`signerId` int NOT NULL,
	`signerRole` varchar(50) NOT NULL,
	`signatureData` text NOT NULL,
	`signatureType` varchar(50) NOT NULL DEFAULT 'canvas',
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`verificationToken` varchar(255),
	`verifiedAt` timestamp,
	CONSTRAINT `signatures_id` PRIMARY KEY(`id`)
);
