CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookingInApp` boolean DEFAULT true,
	`bookingEmail` boolean DEFAULT true,
	`bookingPush` boolean DEFAULT true,
	`messageInApp` boolean DEFAULT true,
	`messageEmail` boolean DEFAULT true,
	`messagePush` boolean DEFAULT true,
	`contractInApp` boolean DEFAULT true,
	`contractEmail` boolean DEFAULT true,
	`contractPush` boolean DEFAULT false,
	`paymentInApp` boolean DEFAULT true,
	`paymentEmail` boolean DEFAULT true,
	`paymentPush` boolean DEFAULT true,
	`reviewInApp` boolean DEFAULT true,
	`reviewEmail` boolean DEFAULT false,
	`reviewPush` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('booking','message','payment','contract','review') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`actionUrl` text,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
