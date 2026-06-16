CREATE TABLE `media_kits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`bio` text,
	`pressPhotos` json,
	`socialStats` json,
	`achievements` json,
	`genres` json,
	`monthlyListeners` int,
	`totalStreams` int,
	`averageEventAttendance` int,
	`contactEmail` varchar(320),
	`managementContact` varchar(320),
	`bookingContact` varchar(320),
	`isPublic` boolean NOT NULL DEFAULT false,
	`lastGeneratedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_kits_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_kits_artistId_unique` UNIQUE(`artistId`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sponsorSlotId` int NOT NULL,
	`artistId` int NOT NULL,
	`eventType` enum('impression','click') NOT NULL,
	`eventDate` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(100),
	`viewerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sponsor_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`sponsorName` varchar(200) NOT NULL,
	`sponsorLogoUrl` varchar(512) NOT NULL,
	`sponsorWebsite` varchar(512),
	`sponsorDescription` varchar(500),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_subscriptions` MODIFY COLUMN `tier` enum('free','starter','professional','enterprise') NOT NULL DEFAULT 'free';--> statement-breakpoint
CREATE INDEX `idx_media_kits_artist` ON `media_kits` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_sponsor_analytics_slot` ON `sponsor_analytics` (`sponsorSlotId`);--> statement-breakpoint
CREATE INDEX `idx_sponsor_analytics_artist` ON `sponsor_analytics` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_sponsor_analytics_date` ON `sponsor_analytics` (`eventDate`);--> statement-breakpoint
CREATE INDEX `idx_sponsor_slots_artist` ON `sponsor_slots` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_sponsor_slots_active` ON `sponsor_slots` (`artistId`,`isActive`);