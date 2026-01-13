CREATE TABLE `venueReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`artistId` int NOT NULL,
	`venueId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`venueResponse` text,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venueReviews_id` PRIMARY KEY(`id`)
);
