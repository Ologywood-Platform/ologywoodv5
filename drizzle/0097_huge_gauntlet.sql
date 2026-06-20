CREATE TABLE `google_calendar_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`googleEmail` varchar(255),
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`tokenExpiresAt` timestamp,
	`calendarId` varchar(255) DEFAULT 'primary',
	`syncEnabled` boolean DEFAULT true,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_calendar_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_gcal_artist` ON `google_calendar_integrations` (`artistId`);