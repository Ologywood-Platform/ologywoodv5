CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`subject` varchar(255) NOT NULL,
	`emailType` varchar(64) NOT NULL,
	`bookingId` int,
	`userId` int,
	`status` enum('sent','failed','bounced','opened','clicked') NOT NULL DEFAULT 'sent',
	`messageId` varchar(255),
	`failureReason` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
