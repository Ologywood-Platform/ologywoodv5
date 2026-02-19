ALTER TABLE `favorites` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` ADD `favoriteType` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` ADD `favoriteId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` DROP COLUMN `venueId`;--> statement-breakpoint
ALTER TABLE `favorites` DROP COLUMN `artistId`;