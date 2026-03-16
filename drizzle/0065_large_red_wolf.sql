CREATE TABLE `video_moderation_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`artistUserId` int NOT NULL,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`durationSeconds` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_moderation_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `performanceVideoUrl` text;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `performanceVideoThumbnail` text;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `performanceVideoStatus` enum('pending','approved','rejected');--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `performanceVideoDuration` int;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `performanceVideoUploadedAt` timestamp;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `subscriptionTier` enum('free','pro') DEFAULT 'free' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_video_mod_artist` ON `video_moderation_queue` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_video_mod_status` ON `video_moderation_queue` (`status`);