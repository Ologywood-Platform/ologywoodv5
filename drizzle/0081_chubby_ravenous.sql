CREATE TABLE `artist_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`venueId` int NOT NULL,
	`artistId` int NOT NULL,
	`rating` int NOT NULL,
	`reliabilityRating` int,
	`stagePresenceRating` int,
	`crowdEngagementRating` int,
	`professionalismRating` int,
	`comment` text,
	`artistResponse` text,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `artist_reviews_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE INDEX `idx_artist_reviews_venue` ON `artist_reviews` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_artist_reviews_artist` ON `artist_reviews` (`artistId`);