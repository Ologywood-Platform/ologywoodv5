CREATE TABLE `artist_team_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artist_team_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artist_team_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`inviteRole` enum('manager','team_member') NOT NULL DEFAULT 'team_member',
	`token` varchar(64) NOT NULL,
	`inviteStatus` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`invitedByUserId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artist_team_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `artist_team_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `artist_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`userId` int NOT NULL,
	`teamRole` enum('owner','manager','team_member') NOT NULL DEFAULT 'team_member',
	`permissions` json,
	`invitedByUserId` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_team_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_artist_team_member` UNIQUE(`artistProfileId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `idx_team_activity_artist` ON `artist_team_activity_log` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_team_activity_user` ON `artist_team_activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_team_invitations_artist` ON `artist_team_invitations` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_team_invitations_token` ON `artist_team_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `idx_team_invitations_email` ON `artist_team_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `idx_team_members_artist` ON `artist_team_members` (`artistProfileId`);--> statement-breakpoint
CREATE INDEX `idx_team_members_user` ON `artist_team_members` (`userId`);