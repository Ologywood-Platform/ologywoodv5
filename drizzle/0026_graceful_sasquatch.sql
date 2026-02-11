CREATE TABLE `email_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`frequency` enum('daily','weekly','never') NOT NULL DEFAULT 'weekly',
	`bookingUpdates` boolean NOT NULL DEFAULT true,
	`newOpportunities` boolean NOT NULL DEFAULT true,
	`platformNews` boolean NOT NULL DEFAULT false,
	`weeklyDigest` boolean NOT NULL DEFAULT true,
	`reminders` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_preferences_userId_unique` UNIQUE(`userId`)
);
