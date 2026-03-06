CREATE TABLE `track_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`releaseId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` varchar(280),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `track_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_release_review` UNIQUE(`userId`,`releaseId`)
);
--> statement-breakpoint
CREATE INDEX `idx_track_reviews_release` ON `track_reviews` (`releaseId`);--> statement-breakpoint
CREATE INDEX `idx_track_reviews_user` ON `track_reviews` (`userId`);