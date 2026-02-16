CREATE TABLE `event_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int,
	`bookingId` int,
	`artistId` int NOT NULL,
	`venueId` int,
	`eventDate` date NOT NULL,
	`attendeeCount` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventHistoryId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`caption` text,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_recurrence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`frequency` enum('daily','weekly','biweekly','monthly') NOT NULL,
	`daysOfWeek` varchar(50),
	`endDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_recurrence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`eventTitle` varchar(255) NOT NULL,
	`eventType` enum('wedding','corporate','festival','bar_gig','private_party','concert','other') NOT NULL,
	`eventDate` date NOT NULL,
	`eventTime` varchar(5),
	`eventEndTime` varchar(5),
	`location` varchar(255),
	`capacity` int,
	`audienceType` varchar(100),
	`rate` decimal(10,2),
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`status` enum('available','booked','completed','cancelled') NOT NULL DEFAULT 'available',
	`bookingId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `riderTemplateId` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `riderAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `riderAcknowledgedBy` int;--> statement-breakpoint
ALTER TABLE `email_preferences` ADD `unsubscribeToken` varchar(255);--> statement-breakpoint
ALTER TABLE `email_preferences` ADD `unsubscribedAt` timestamp;--> statement-breakpoint
ALTER TABLE `email_preferences` ADD CONSTRAINT `email_preferences_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`);