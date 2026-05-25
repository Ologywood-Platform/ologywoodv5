CREATE TABLE `venue_profile_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venue_profile_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_venue_profile_views_venue` ON `venue_profile_views` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_venue_profile_views_date` ON `venue_profile_views` (`viewedAt`);