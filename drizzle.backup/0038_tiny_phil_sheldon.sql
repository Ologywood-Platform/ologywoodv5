CREATE TABLE `artist_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`artistId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artist_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favorites` ADD `venueId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` ADD `artistId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `favorites` DROP COLUMN `favoriteType`;--> statement-breakpoint
ALTER TABLE `favorites` DROP COLUMN `favoriteId`;