CREATE TABLE `booking_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`reminderType` varchar(50) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_reminders_id` PRIMARY KEY(`id`)
);
