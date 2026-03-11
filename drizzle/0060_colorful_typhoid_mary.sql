CREATE TABLE `booking_disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`reporterId` int NOT NULL,
	`respondentId` int NOT NULL,
	`type` enum('payment_issue','no_show','contract_violation','quality_issue','cancellation_dispute','harassment','other') NOT NULL,
	`description` text NOT NULL,
	`evidenceUrls` text,
	`status` enum('open','under_review','resolved','dismissed') NOT NULL DEFAULT 'open',
	`resolution` text,
	`adminNotes` text,
	`resolvedById` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_disputes_booking` ON `booking_disputes` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_disputes_reporter` ON `booking_disputes` (`reporterId`);--> statement-breakpoint
CREATE INDEX `idx_disputes_status` ON `booking_disputes` (`status`);