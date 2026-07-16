CREATE TABLE `fan_club_post_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fan_club_post_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fan_club_post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fan_club_post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experienceId` int NOT NULL,
	`fanId` int NOT NULL,
	`talentId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`duration` int NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2),
	`stripePaymentIntentId` varchar(255),
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`joinLink` varchar(512),
	`platform` varchar(50),
	`cancelledAt` timestamp,
	`cancelledBy` varchar(20),
	`cancellationReason` text,
	`fanRating` int,
	`fanReview` text,
	`reviewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ology_live_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_experiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`capacityType` enum('one_on_one','small_group','broadcast') NOT NULL,
	`maxAttendees` int DEFAULT 1,
	`platform` varchar(50) NOT NULL,
	`platformLink` varchar(512),
	`linkSentAfterBooking` boolean DEFAULT false,
	`category` varchar(50) NOT NULL,
	`tags` json,
	`coverImageUrl` varchar(512),
	`recurringSchedule` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalBookings` int DEFAULT 0,
	`averageRating` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ology_live_experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_time_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experienceId` int NOT NULL,
	`talentId` int NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`spotsTotal` int NOT NULL DEFAULT 1,
	`spotsTaken` int NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ology_live_time_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistUserId` int NOT NULL,
	`type` enum('event','release','profile') NOT NULL,
	`targetId` int,
	`targetName` varchar(255) NOT NULL,
	`budget` int NOT NULL,
	`goals` text NOT NULL,
	`targetAudience` text,
	`platforms` json,
	`timeline` varchar(100),
	`additionalNotes` text,
	`status` enum('submitted','in_review','in_progress','completed','cancelled') NOT NULL DEFAULT 'submitted',
	`adminNotes` text,
	`reportUrl` text,
	`stripePaymentIntentId` varchar(255),
	`paidAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_portfolio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`category` varchar(50) NOT NULL,
	`duration` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('active','processing','removed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_portfolio_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP INDEX `idx_artist_profiles_talent_type` ON `artist_profiles`;--> statement-breakpoint
ALTER TABLE `artist_profiles` MODIFY COLUMN `talentType` varchar(20) DEFAULT 'artist';--> statement-breakpoint
ALTER TABLE `artist_profiles` MODIFY COLUMN `sportCategory` varchar(100);--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `sportPosition` varchar(100);--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `sportTeam` varchar(255);--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `athleteStats` json;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `athleteAchievements` json;--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `nilDeals` json;--> statement-breakpoint
ALTER TABLE `bookings` ADD `bookingType` varchar(50);--> statement-breakpoint
ALTER TABLE `bookings` ADD `counterOfferAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `bookings` ADD `counterOfferMessage` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `counterOfferAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `counterOfferBy` varchar(20);--> statement-breakpoint
ALTER TABLE `fan_club_memberships` ADD `artistUserId` int;--> statement-breakpoint
ALTER TABLE `fan_club_posts` ADD `artistUserId` int;--> statement-breakpoint
ALTER TABLE `fan_club_posts` ADD `contentCategory` varchar(50);--> statement-breakpoint
ALTER TABLE `fan_club_tiers` ADD `artistUserId` int;--> statement-breakpoint
ALTER TABLE `fan_club_tiers` ADD `priceCents` int DEFAULT 0;--> statement-breakpoint
CREATE INDEX `idx_fc_comments_post` ON `fan_club_post_comments` (`postId`);--> statement-breakpoint
CREATE INDEX `idx_fc_likes_post_user` ON `fan_club_post_likes` (`postId`,`userId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_experience` ON `ology_live_bookings` (`experienceId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_fan` ON `ology_live_bookings` (`fanId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_talent` ON `ology_live_bookings` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_status` ON `ology_live_bookings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_scheduled` ON `ology_live_bookings` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_talent` ON `ology_live_experiences` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_category` ON `ology_live_experiences` (`category`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_active` ON `ology_live_experiences` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_capacity` ON `ology_live_experiences` (`capacityType`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_experience` ON `ology_live_time_slots` (`experienceId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_talent` ON `ology_live_time_slots` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_start` ON `ology_live_time_slots` (`startTime`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_available` ON `ology_live_time_slots` (`isAvailable`);--> statement-breakpoint
CREATE INDEX `idx_promo_requests_artist` ON `promotion_requests` (`artistUserId`);--> statement-breakpoint
CREATE INDEX `idx_promo_requests_status` ON `promotion_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_promo_requests_type` ON `promotion_requests` (`type`);--> statement-breakpoint
CREATE INDEX `idx_video_portfolio_artist` ON `video_portfolio` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_video_portfolio_category` ON `video_portfolio` (`category`);