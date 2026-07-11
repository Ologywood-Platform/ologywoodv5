CREATE TABLE `fan_club_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fanUserId` int NOT NULL,
	`talentUserId` int NOT NULL,
	`tierId` int NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`status` enum('active','cancelled','past_due','incomplete') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`cancelledAt` timestamp,
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fan_club_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fan_club_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`mediaUrl` text,
	`mediaType` enum('image','video','audio','none') NOT NULL DEFAULT 'none',
	`visibility` enum('public','members_only','tier_specific') NOT NULL DEFAULT 'members_only',
	`requiredTierId` int,
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fan_club_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fan_club_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentUserId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`priceMonthly` int NOT NULL,
	`description` text,
	`perks` json,
	`stripePriceId` varchar(255),
	`stripeProductId` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fan_club_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `talentType` enum('artist','athlete','creator') DEFAULT 'artist' NOT NULL;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `sportCategory` varchar(255);--> statement-breakpoint
CREATE INDEX `idx_fan_club_memberships_fan` ON `fan_club_memberships` (`fanUserId`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_memberships_talent` ON `fan_club_memberships` (`talentUserId`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_memberships_tier` ON `fan_club_memberships` (`tierId`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_unique_membership` ON `fan_club_memberships` (`fanUserId`,`talentUserId`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_posts_talent` ON `fan_club_posts` (`talentUserId`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_posts_visibility` ON `fan_club_posts` (`visibility`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_posts_created` ON `fan_club_posts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_fan_club_tiers_talent` ON `fan_club_tiers` (`talentUserId`);--> statement-breakpoint
CREATE INDEX `idx_artist_profiles_talent_type` ON `artist_profiles` (`talentType`);