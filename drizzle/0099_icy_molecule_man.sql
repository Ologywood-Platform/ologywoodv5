CREATE TABLE `promotion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistUserId` int NOT NULL,
	`type` enum('event','release','profile') NOT NULL,
	`targetId` int,
	`targetName` varchar(255) NOT NULL,
	`budget` int NOT NULL,
	`goals` text NOT NULL,
	`targetAudience` text,
	`platforms` json,
	`timeline` varchar(100),
	`additionalNotes` text,
	`status` enum('submitted','in_review','in_progress','completed','cancelled') NOT NULL DEFAULT 'submitted',
	`adminNotes` text,
	`reportUrl` text,
	`stripePaymentIntentId` varchar(255),
	`paidAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_promo_requests_artist` ON `promotion_requests` (`artistUserId`);--> statement-breakpoint
CREATE INDEX `idx_promo_requests_status` ON `promotion_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_promo_requests_type` ON `promotion_requests` (`type`);