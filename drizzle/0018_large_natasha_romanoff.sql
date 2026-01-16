CREATE TABLE `rider_acknowledgments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`riderTemplateId` int NOT NULL,
	`venueId` int NOT NULL,
	`artistId` int NOT NULL,
	`status` enum('pending','acknowledged','modifications_proposed','approved','rejected') NOT NULL DEFAULT 'pending',
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rider_acknowledgments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rider_modification_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`acknowledgmentId` int NOT NULL,
	`proposedBy` int NOT NULL,
	`proposedModifications` json,
	`reason` text,
	`status` enum('pending','approved','rejected','counter_proposed') NOT NULL DEFAULT 'pending',
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rider_modification_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venue_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`venueId` int NOT NULL,
	`artistId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venue_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `artist_verification`;--> statement-breakpoint
DROP TABLE `referrals`;--> statement-breakpoint
DROP TABLE `support_sla_settings`;--> statement-breakpoint
DROP TABLE `system_booking_templates`;--> statement-breakpoint
DROP TABLE `user_credits`;--> statement-breakpoint
DROP TABLE `user_template_preferences`;--> statement-breakpoint
DROP TABLE `venueReviews`;--> statement-breakpoint
ALTER TABLE `contracts` DROP INDEX `contracts_bookingId_unique`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP INDEX `knowledge_base_articles_slug_unique`;--> statement-breakpoint
ALTER TABLE `booking_reminders` MODIFY COLUMN `reminderType` enum('upcoming','deposit_due','final_payment_due') NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` MODIFY COLUMN `status` enum('draft','sent','signed','executed','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `favorites` MODIFY COLUMN `artistId` int;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `profile_views` MODIFY COLUMN `artistId` int;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `bookingId` int;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `artistId` int;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `venueId` int;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `rating` int;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `rider_templates` MODIFY COLUMN `artistId` int;--> statement-breakpoint
ALTER TABLE `rider_templates` MODIFY COLUMN `templateName` varchar(255);--> statement-breakpoint
ALTER TABLE `rider_templates` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rider_templates` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `signatures` MODIFY COLUMN `signatureData` text;--> statement-breakpoint
ALTER TABLE `signatures` MODIFY COLUMN `signedAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `status` enum('active','cancelled','past_due') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `booking_reminders` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_reminders` ADD `reminderDate` date NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_reminders` ADD `sent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `booking_reminders` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_reminders` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `booking_templates` ADD `venueId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_templates` ADD `templateData` json;--> statement-breakpoint
ALTER TABLE `bookings` ADD `riderTemplateId` int;--> statement-breakpoint
ALTER TABLE `contracts` ADD `contractData` json;--> statement-breakpoint
ALTER TABLE `faqs` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `favorites` ADD `venueId` int;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` ADD `helpful` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` ADD `notHelpful` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `recipientId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `content` text NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `isRead` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `messages` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `emailNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `pushNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `bookingNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `messageNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `reviewNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `riderNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `reminderNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `notifications` ADD `message` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `relatedId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `relatedType` varchar(50);--> statement-breakpoint
ALTER TABLE `reviews` ADD `comment` text;--> statement-breakpoint
ALTER TABLE `rider_templates` ADD `templateData` json;--> statement-breakpoint
ALTER TABLE `signatures` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `signatures` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `tier` enum('free','basic','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `currentPeriodStart` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` ADD `responderId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` ADD `response` text NOT NULL;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `booking_reminders` DROP COLUMN `sentAt`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `venueName`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `venueAddress`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `venueCapacity`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `eventType`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `budgetMin`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `budgetMax`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `standardRequirements`;--> statement-breakpoint
ALTER TABLE `booking_templates` DROP COLUMN `additionalNotes`;--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `contractType`;--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `contractTitle`;--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `contractContent`;--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `contractPdfUrl`;--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `artistSignedAt`;--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `venueSignedAt`;--> statement-breakpoint
ALTER TABLE `faqs` DROP COLUMN `categoryId`;--> statement-breakpoint
ALTER TABLE `faqs` DROP COLUMN `views`;--> statement-breakpoint
ALTER TABLE `faqs` DROP COLUMN `isActive`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP COLUMN `categoryId`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP COLUMN `helpfulVotes`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP COLUMN `unhelpfulVotes`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP COLUMN `author`;--> statement-breakpoint
ALTER TABLE `knowledge_base_articles` DROP COLUMN `isPublished`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `receiverId`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `messageText`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `sentAt`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `readAt`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `bookingInApp`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `bookingEmail`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `bookingPush`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `messageInApp`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `messageEmail`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `messagePush`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `contractInApp`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `contractEmail`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `contractPush`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `paymentInApp`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `paymentEmail`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `paymentPush`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `reviewInApp`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `reviewEmail`;--> statement-breakpoint
ALTER TABLE `notification_preferences` DROP COLUMN `reviewPush`;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `profile_views` DROP COLUMN `viewerUserId`;--> statement-breakpoint
ALTER TABLE `profile_views` DROP COLUMN `viewedAt`;--> statement-breakpoint
ALTER TABLE `profile_views` DROP COLUMN `ipAddress`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `reviewText`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `artistResponse`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `respondedAt`;--> statement-breakpoint
ALTER TABLE `rider_templates` DROP COLUMN `technicalRequirements`;--> statement-breakpoint
ALTER TABLE `rider_templates` DROP COLUMN `hospitalityRequirements`;--> statement-breakpoint
ALTER TABLE `rider_templates` DROP COLUMN `financialTerms`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `signerRole`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `signatureType`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `ipAddress`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `userAgent`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `verificationToken`;--> statement-breakpoint
ALTER TABLE `signatures` DROP COLUMN `verifiedAt`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `planType`;--> statement-breakpoint
ALTER TABLE `support_categories` DROP COLUMN `icon`;--> statement-breakpoint
ALTER TABLE `support_categories` DROP COLUMN `order`;--> statement-breakpoint
ALTER TABLE `support_categories` DROP COLUMN `isActive`;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` DROP COLUMN `message`;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` DROP COLUMN `isStaffResponse`;--> statement-breakpoint
ALTER TABLE `support_ticket_responses` DROP COLUMN `attachmentUrls`;--> statement-breakpoint
ALTER TABLE `support_tickets` DROP COLUMN `categoryId`;--> statement-breakpoint
ALTER TABLE `support_tickets` DROP COLUMN `assignedToId`;--> statement-breakpoint
ALTER TABLE `support_tickets` DROP COLUMN `attachmentUrls`;--> statement-breakpoint
ALTER TABLE `support_tickets` DROP COLUMN `resolvedAt`;