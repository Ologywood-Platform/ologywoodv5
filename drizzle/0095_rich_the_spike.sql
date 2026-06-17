CREATE TABLE `venue_sponsor_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`senderRole` enum('venue','sponsor') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venue_sponsor_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `venue_sponsor_packages` ADD `tier` enum('bronze','silver','gold','platinum','custom') DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE `venue_sponsor_packages` ADD `category` varchar(100);--> statement-breakpoint
CREATE INDEX `idx_sponsor_messages_application` ON `venue_sponsor_messages` (`applicationId`);--> statement-breakpoint
CREATE INDEX `idx_sponsor_messages_sender` ON `venue_sponsor_messages` (`senderUserId`);