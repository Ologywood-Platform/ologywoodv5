CREATE TABLE `artist_verification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`isVerified` boolean DEFAULT false,
	`verificationBadge` varchar(50),
	`completedBookings` int DEFAULT 0,
	`backgroundCheckPassed` boolean DEFAULT false,
	`backgroundCheckDate` timestamp,
	`averageRating` decimal(3,2) DEFAULT 0,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_verification_id` PRIMARY KEY(`id`),
	CONSTRAINT `artist_verification_artistId_unique` UNIQUE(`artistId`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`creditsAwarded` decimal(10,2) DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `system_booking_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`description` text,
	`suggestedFeeMin` int,
	`suggestedFeeMax` int,
	`typicalDuration` varchar(50),
	`riderTemplate` json,
	`commonRequirements` json,
	`setupTime` varchar(50),
	`soundCheckTime` varchar(50),
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_booking_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(10,2) DEFAULT 0,
	`totalEarned` decimal(10,2) DEFAULT 0,
	`totalSpent` decimal(10,2) DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_credits_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_template_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`isDefault` boolean DEFAULT false,
	`customizations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_template_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_template_preferences_userId_templateId_unique` UNIQUE(`userId`,`templateId`)
);
