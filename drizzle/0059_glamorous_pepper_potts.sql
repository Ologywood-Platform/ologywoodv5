CREATE TABLE `unsubscribe_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`reason` varchar(100) NOT NULL,
	`comment` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unsubscribe_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_unsub_feedback_user` ON `unsubscribe_feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_unsub_feedback_reason` ON `unsubscribe_feedback` (`reason`);