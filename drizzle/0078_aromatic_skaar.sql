CREATE TABLE `saved_artists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`artistId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_artists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_saved_artists_venue` ON `saved_artists` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_saved_artists_artist` ON `saved_artists` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_saved_artists_unique` ON `saved_artists` (`venueId`,`artistId`);