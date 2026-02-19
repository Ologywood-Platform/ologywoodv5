CREATE TABLE `booking_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`bookingCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','starter','professional') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`status` enum('active','cancelled','past_due','trialing') NOT NULL DEFAULT 'active',
	`trialEndsAt` timestamp,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP INDEX `venue_profiles_email_unique`;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `tax` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `platformFee` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `verification_badges` MODIFY COLUMN `averageRating` decimal(3,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `rider_templates` ADD `templateData` json;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `website`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `capacity`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `venueType`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `amenities`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `profilePhotoUrl`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `mediaGallery`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `averageRating`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `reviewCount`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `listingViews`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `emailVerificationToken`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `emailVerificationSentAt`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `profileCompletionScore`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `profileCompletionUpdatedAt`;