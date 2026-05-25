CREATE TABLE `venue_recurring_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`reason` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venue_recurring_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_venue_recurring_blocks_venue` ON `venue_recurring_blocks` (`venueId`);