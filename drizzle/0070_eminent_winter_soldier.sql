CREATE TABLE `tour_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT false,
	`targetRegions` json,
	`homeBase` varchar(255),
	`travelRadius` enum('local','regional','national','international') DEFAULT 'regional',
	`tourTypes` json,
	`dateWindows` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tour_availability_id` PRIMARY KEY(`id`),
	CONSTRAINT `tour_availability_artistProfileId_unique` UNIQUE(`artistProfileId`)
);
--> statement-breakpoint
CREATE INDEX `idx_tour_avail_artist` ON `tour_availability` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_tour_avail_available` ON `tour_availability` (`isAvailable`);