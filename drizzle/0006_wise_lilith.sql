CREATE TABLE `booking_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`venueName` varchar(255),
	`venueAddress` text,
	`venueCapacity` int,
	`eventType` varchar(255),
	`budgetMin` int,
	`budgetMax` int,
	`standardRequirements` text,
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_templates_id` PRIMARY KEY(`id`)
);
