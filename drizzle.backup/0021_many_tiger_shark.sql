CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`followingType` enum('artist','venue') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredId` int,
	`referralCode` varchar(20) NOT NULL,
	`status` enum('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
	`rewardAmount` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `verification_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`completedBookings` int DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT 0,
	`hasProfilePhoto` boolean DEFAULT false,
	`hasBio` boolean DEFAULT false,
	`hasRiderTemplate` boolean DEFAULT false,
	`verificationStatus` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_badges_artistId_unique` UNIQUE(`artistId`)
);
--> statement-breakpoint
CREATE TABLE `help_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`category` enum('getting-started','contracts','bookings','payments','signatures','account','technical') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
	`keywords` json DEFAULT ('[]'),
	`relatedArticles` json DEFAULT ('[]'),
	`views` int NOT NULL DEFAULT 0,
	`helpful` int NOT NULL DEFAULT 0,
	`unhelpful` int NOT NULL DEFAULT 0,
	`averageRating` int,
	`estimatedReadTime` int,
	`lastUpdatedBy` int,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `help_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `help_articles_articleId_unique` UNIQUE(`articleId`)
);
--> statement-breakpoint
CREATE TABLE `support_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalTickets` int NOT NULL DEFAULT 0,
	`openTickets` int NOT NULL DEFAULT 0,
	`resolvedTickets` int NOT NULL DEFAULT 0,
	`closedTickets` int NOT NULL DEFAULT 0,
	`averageResponseTime` int,
	`averageResolutionTime` int,
	`slaComplianceRate` int,
	`slaBreachCount` int NOT NULL DEFAULT 0,
	`categoryBreakdown` json DEFAULT ('{}'),
	`priorityBreakdown` json DEFAULT ('{}'),
	`teamMetrics` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`assignedTo` int NOT NULL,
	`assignedBy` int NOT NULL,
	`team` varchar(100) NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userRole` enum('customer','support','admin') NOT NULL,
	`message` text NOT NULL,
	`attachments` json DEFAULT ('[]'),
	`isInternal` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `faqs`;--> statement-breakpoint
DROP TABLE `knowledge_base_articles`;--> statement-breakpoint
DROP TABLE `notification_preferences`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `rider_acknowledgments`;--> statement-breakpoint
DROP TABLE `rider_modification_history`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
DROP TABLE `support_categories`;--> statement-breakpoint
DROP TABLE `support_ticket_responses`;--> statement-breakpoint
ALTER TABLE `availability` DROP INDEX `availability_artistId_date_unique`;--> statement-breakpoint
ALTER TABLE `availability` MODIFY COLUMN `date` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_reminders` MODIFY COLUMN `reminderType` enum('7_days','3_days','1_day') NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `eventDate` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `eventTime` varchar(5);--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `paymentStatus` enum('unpaid','deposit_paid','fully_paid','refunded') NOT NULL DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `contracts` MODIFY COLUMN `status` enum('pending','signed_by_artist','signed_by_venue','fully_signed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `favorites` MODIFY COLUMN `artistId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` MODIFY COLUMN `venueId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `isRead` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `profile_views` MODIFY COLUMN `artistId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `bookingId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `artistId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `venueId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `rating` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `signatures` MODIFY COLUMN `signatureData` text NOT NULL;--> statement-breakpoint
ALTER TABLE `signatures` MODIFY COLUMN `signedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `support_tickets` MODIFY COLUMN `category` enum('contracts','billing','technical','account','general') NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` MODIFY COLUMN `priority` enum('low','medium','high','urgent') NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` MODIFY COLUMN `status` enum('open','in-progress','waiting-customer','resolved','closed') NOT NULL DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `venue_profiles` MODIFY COLUMN `contactName` varchar(255);--> statement-breakpoint
ALTER TABLE `booking_reminders` ADD `sentAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_templates` ADD `eventDetails` text;--> statement-breakpoint
ALTER TABLE `booking_templates` ADD `totalFee` decimal(10,2);--> statement-breakpoint
ALTER TABLE `booking_templates` ADD `depositAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `bookings` ADD `fullPaymentAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD `pdfUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `readAt` timestamp;--> statement-breakpoint
ALTER TABLE `messages` ADD `lastReadAt` timestamp;--> statement-breakpoint
ALTER TABLE `profile_views` ADD `viewedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `artistResponse` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `respondedAt` timestamp;--> statement-breakpoint
ALTER TABLE `signatures` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `ticketNumber` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `userEmail` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `userName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `userRole` enum('artist','venue','admin') NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `assignedTeam` varchar(100);--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `assignedTo` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `tags` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `attachments` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `responseTimeMinutes` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `resolutionTimeMinutes` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `firstResponseAt` timestamp;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `resolvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `slaStatus` enum('on-track','at-risk','breached') DEFAULT 'on-track' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `slaBreachedAt` timestamp;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `relatedBookingId` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `relatedContractId` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `internalNotes` text;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `closedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `isListed` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `website` text;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `capacity` int;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `venueType` varchar(100);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `amenities` json;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `averageRating` decimal(3,2) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `reviewCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `listingViews` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `emailVerificationSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `profileCompletionScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `profileCompletionUpdatedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `venue_reviews` ADD `venueResponse` text;--> statement-breakpoint
ALTER TABLE `venue_reviews` ADD `respondedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_bookingId_unique` UNIQUE(`bookingId`);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_bookingId_unique` UNIQUE(`bookingId`);--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_ticketNumber_unique` UNIQUE(`ticketNumber`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD CONSTRAINT `venue_profiles_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `venue_reviews` ADD CONSTRAINT `venue_reviews_bookingId_unique` UNIQUE(`bookingId`);--> statement-breakpoint
ALTER TABLE `availability` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `booking_reminders` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `booking_reminders` DROP COLUMN `reminderDate`;--> statement-breakpoint
ALTER TABLE `booking_reminders` DROP COLUMN `sent`;--> statement-breakpoint
ALTER TABLE `booking_reminders` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `booking_reminders` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `venueName`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `venueAddress`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `riderTemplateId`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `riderData`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `fullPaymentPaidAt`;--> statement-breakpoint
ALTER TABLE `favorites` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `attachmentUrl`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `signerId`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `support_tickets` DROP COLUMN `subject`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `websiteUrl`;