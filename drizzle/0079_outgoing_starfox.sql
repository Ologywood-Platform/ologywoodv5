CREATE TABLE `rider_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`contractId` int NOT NULL,
	`proposedByUserId` int NOT NULL,
	`proposedByRole` varchar(20) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`changes` json NOT NULL,
	`rejectionReason` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rider_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_rider_revisions_booking` ON `rider_revisions` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_rider_revisions_contract` ON `rider_revisions` (`contractId`);--> statement-breakpoint
CREATE INDEX `idx_rider_revisions_status` ON `rider_revisions` (`status`);