CREATE TABLE `schedule_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` varchar(40) NOT NULL,
	`startAt` bigint NOT NULL,
	`endAt` bigint NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`allDay` boolean NOT NULL DEFAULT false,
	`date` date NOT NULL,
	`preparationMinutes` int NOT NULL DEFAULT 0,
	`travelMinutes` int NOT NULL DEFAULT 0,
	`location` varchar(500),
	`notes` text,
	`reminderMinutes` int,
	`revision` int NOT NULL DEFAULT 1,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule_reminder_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`source` varchar(20) NOT NULL,
	`sourceId` int NOT NULL,
	`revision` varchar(64) NOT NULL,
	`dueAt` bigint NOT NULL,
	`dedupKey` varchar(190) NOT NULL,
	`notificationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_reminder_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `schedule_reminder_receipts_dedupKey_unique` UNIQUE(`dedupKey`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `scheduleStartAt` bigint;--> statement-breakpoint
ALTER TABLE `bookings` ADD `scheduleEndAt` bigint;--> statement-breakpoint
ALTER TABLE `bookings` ADD `scheduleTimezone` varchar(100);--> statement-breakpoint
ALTER TABLE `bookings` ADD `scheduleAllDay` boolean;--> statement-breakpoint
ALTER TABLE `bookings` ADD `preparationMinutes` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `travelMinutes` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ology_live_time_slots` ADD `scheduleTimezone` varchar(100);--> statement-breakpoint
CREATE INDEX `idx_schedule_appointments_owner_time` ON `schedule_appointments` (`ownerUserId`,`startAt`);--> statement-breakpoint
CREATE INDEX `idx_schedule_appointments_owner_status` ON `schedule_appointments` (`ownerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_schedule_receipts_owner_source` ON `schedule_reminder_receipts` (`ownerUserId`,`source`,`sourceId`);