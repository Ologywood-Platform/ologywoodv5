CREATE TABLE `sandbox_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`artistUserId` int NOT NULL,
	`content` text NOT NULL,
	`mediaType` enum('image','video'),
	`mediaUrl` text,
	`mediaKey` text,
	`mediaMimeType` varchar(100),
	`mediaFileName` varchar(255),
	`mediaSizeBytes` int,
	`mediaDurationSeconds` int,
	`mediaThumbnailUrl` text,
	`mediaThumbnailKey` text,
	`status` enum('active','hidden') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sandbox_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_sandbox_posts_profile` UNIQUE(`artistProfileId`),
	CONSTRAINT `uniq_sandbox_posts_owner` UNIQUE(`artistUserId`)
);
--> statement-breakpoint
CREATE INDEX `idx_sandbox_posts_public` ON `sandbox_posts` (`artistProfileId`,`status`);