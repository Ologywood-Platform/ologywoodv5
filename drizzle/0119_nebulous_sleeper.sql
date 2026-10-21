CREATE TABLE `booking_rider_document_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int NOT NULL,
	`titleSnapshot` varchar(255) NOT NULL,
	`attachedByUserId` int NOT NULL,
	`attachedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_rider_document_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_booking_rider_document_link_version` UNIQUE(`bookingId`,`versionId`)
);
--> statement-breakpoint
CREATE TABLE `rider_document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`byteSize` int NOT NULL,
	`pageCount` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rider_document_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_rider_document_versions_document_number` UNIQUE(`documentId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `rider_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`currentVersionId` int,
	`revision` int NOT NULL DEFAULT 1,
	`isDefault` boolean NOT NULL DEFAULT false,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rider_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_booking_rider_document_links_booking` ON `booking_rider_document_links` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_booking_rider_document_links_version` ON `booking_rider_document_links` (`versionId`);--> statement-breakpoint
CREATE INDEX `idx_rider_document_versions_document` ON `rider_document_versions` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_rider_document_versions_owner` ON `rider_document_versions` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `idx_rider_documents_owner_available` ON `rider_documents` (`ownerUserId`,`archivedAt`,`isDefault`);