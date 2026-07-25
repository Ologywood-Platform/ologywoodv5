CREATE TABLE `ology_live_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentId` int NOT NULL,
	`bookingId` int NOT NULL,
	`experienceId` int NOT NULL,
	`grossAmount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`netAmount` decimal(10,2) NOT NULL,
	`nilCategory` varchar(50) NOT NULL DEFAULT 'virtual_appearance',
	`sessionDate` timestamp NOT NULL,
	`sessionDuration` int NOT NULL,
	`platform` varchar(50),
	`payoutStatus` varchar(30) NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`stripeTransferId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ology_live_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`experienceId` int NOT NULL,
	`fanId` int NOT NULL,
	`talentId` int NOT NULL,
	`questionText` text NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`answeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ology_live_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`experienceId` int NOT NULL,
	`talentId` int NOT NULL,
	`fanId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`talentResponse` text,
	`talentRespondedAt` timestamp,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ology_live_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_session_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`experienceId` int NOT NULL,
	`talentId` int NOT NULL,
	`fanId` int NOT NULL,
	`contractContent` json,
	`status` varchar(30) NOT NULL DEFAULT 'generated',
	`talentSignature` text,
	`talentSignedAt` timestamp,
	`fanSignature` text,
	`fanSignedAt` timestamp,
	`compensationAmount` decimal(10,2),
	`mediaRightsGranted` json,
	`ncaaComplianceNote` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ology_live_session_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `artist_profiles` ADD `country` varchar(100) DEFAULT 'US';--> statement-breakpoint
CREATE INDEX `idx_ology_live_earnings_talent` ON `ology_live_earnings` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_earnings_booking` ON `ology_live_earnings` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_earnings_date` ON `ology_live_earnings` (`sessionDate`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_earnings_category` ON `ology_live_earnings` (`nilCategory`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_earnings_payout` ON `ology_live_earnings` (`payoutStatus`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_questions_booking` ON `ology_live_questions` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_questions_experience` ON `ology_live_questions` (`experienceId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_questions_fan` ON `ology_live_questions` (`fanId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_questions_talent` ON `ology_live_questions` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_questions_status` ON `ology_live_questions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_reviews_booking` ON `ology_live_reviews` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_reviews_experience` ON `ology_live_reviews` (`experienceId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_reviews_talent` ON `ology_live_reviews` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_reviews_fan` ON `ology_live_reviews` (`fanId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_reviews_rating` ON `ology_live_reviews` (`rating`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_contracts_booking` ON `ology_live_session_contracts` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_contracts_talent` ON `ology_live_session_contracts` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_contracts_fan` ON `ology_live_session_contracts` (`fanId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_contracts_status` ON `ology_live_session_contracts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_artist_profiles_city` ON `artist_profiles` (`city`);--> statement-breakpoint
CREATE INDEX `idx_artist_profiles_state` ON `artist_profiles` (`state`);