CREATE TABLE `artist_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`status` enum('sending','sent','failed') NOT NULL DEFAULT 'sending',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artist_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_artist_updates_artist` ON `artist_updates` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_artist_updates_sent_at` ON `artist_updates` (`sentAt`);