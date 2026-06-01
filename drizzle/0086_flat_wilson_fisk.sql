CREATE TABLE `project_preview_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`trackNumber` int NOT NULL,
	`audioUrl` text,
	`durationSeconds` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_preview_tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_previews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`releaseType` varchar(50) NOT NULL DEFAULT 'album',
	`coverArtUrl` text,
	`releaseDate` date,
	`externalLink` text,
	`description` text,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_previews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_project_preview_tracks_project` ON `project_preview_tracks` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_project_preview_tracks_order` ON `project_preview_tracks` (`projectId`,`trackNumber`);--> statement-breakpoint
CREATE INDEX `idx_project_previews_user` ON `project_previews` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_project_previews_status` ON `project_previews` (`userId`,`status`);