CREATE TABLE `venue_blocked_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venue_blocked_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_venue_blocked_dates_venue_date` ON `venue_blocked_dates` (`venueId`,`date`);