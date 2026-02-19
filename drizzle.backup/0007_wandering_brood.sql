CREATE TABLE `profile_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`viewerUserId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `profile_views_id` PRIMARY KEY(`id`)
);
