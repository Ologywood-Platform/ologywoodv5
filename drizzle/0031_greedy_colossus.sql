CREATE TABLE `ryder_contract_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`section` varchar(100),
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ryder_contract_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ryder_contract_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`changes` json,
	`changedBy` int,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ryder_contract_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ryder_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`bookingId` int,
	`templateName` varchar(255) NOT NULL,
	`status` enum('draft','pending_approval','approved','signed','rejected','archived') NOT NULL DEFAULT 'draft',
	`artistName` varchar(255) NOT NULL,
	`artistEmail` varchar(255) NOT NULL,
	`artistPhone` varchar(20),
	`eventDate` timestamp,
	`eventVenue` varchar(255),
	`eventCity` varchar(255),
	`eventTime` varchar(5),
	`eventDuration` int,
	`performanceFee` decimal(10,2),
	`depositRequired` decimal(10,2),
	`depositDueDate` timestamp,
	`paymentMethod` varchar(50),
	`technicalRequirements` json,
	`hospitalityRequirements` json,
	`travelRequirements` json,
	`equipmentRequirements` json,
	`cancellationPolicy` text,
	`refundPolicy` text,
	`additionalTerms` text,
	`artistSignedAt` timestamp,
	`venueSignedAt` timestamp,
	`artistSignatureUrl` text,
	`venueSignatureUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp,
	CONSTRAINT `ryder_contracts_id` PRIMARY KEY(`id`)
);
