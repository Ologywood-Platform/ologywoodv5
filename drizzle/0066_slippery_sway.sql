CREATE TABLE `video_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`flaggedByUserId` int NOT NULL,
	`reason` enum('inappropriate','copyright','spam','other') NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artist_profiles` MODIFY COLUMN `performanceVideoStatus` enum('pending','approved','rejected','flagged','taken_down');--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `performanceVideoFlagCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_video_flags_artist` ON `video_flags` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_video_flags_user` ON `video_flags` (`flaggedByUserId`);--> statement-breakpoint
CREATE INDEX `idx_video_flags_unique` ON `video_flags` (`artistProfileId`,`flaggedByUserId`);