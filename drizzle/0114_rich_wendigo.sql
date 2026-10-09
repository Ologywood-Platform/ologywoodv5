CREATE TABLE `complimentary_access_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`action` enum('grant','revoke') NOT NULL,
	`tier` enum('starter','professional','enterprise') NOT NULL,
	`reason` varchar(500) NOT NULL,
	`expiresAt` timestamp,
	`revision` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complimentary_access_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complimentary_access_grants` (
	`userId` int NOT NULL,
	`tier` enum('starter','professional','enterprise') NOT NULL,
	`status` enum('active','revoked') NOT NULL,
	`expiresAt` timestamp,
	`reason` varchar(500) NOT NULL,
	`grantedByUserId` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revision` int NOT NULL,
	`revokedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complimentary_access_grants_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE INDEX `idx_comp_access_user_history` ON `complimentary_access_events` (`userId`,`id`);