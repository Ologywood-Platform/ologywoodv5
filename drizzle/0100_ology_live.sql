CREATE TABLE `ology_live_experiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`capacityType` enum('one_on_one','small_group','broadcast') NOT NULL,
	`maxAttendees` int DEFAULT 1,
	`platform` varchar(50) NOT NULL,
	`platformLink` varchar(512),
	`linkSentAfterBooking` boolean DEFAULT false,
	`category` varchar(50) NOT NULL,
	`tags` json,
	`coverImageUrl` varchar(512),
	`recurringSchedule` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalBookings` int DEFAULT 0,
	`averageRating` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ology_live_experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experienceId` int NOT NULL,
	`fanId` int NOT NULL,
	`talentId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`duration` int NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2),
	`stripePaymentIntentId` varchar(255),
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`joinLink` varchar(512),
	`platform` varchar(50),
	`cancelledAt` timestamp,
	`cancelledBy` varchar(20),
	`cancellationReason` text,
	`fanRating` int,
	`fanReview` text,
	`reviewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ology_live_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ology_live_time_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experienceId` int NOT NULL,
	`talentId` int NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`spotsTotal` int NOT NULL DEFAULT 1,
	`spotsTaken` int NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ology_live_time_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ology_live_talent` ON `ology_live_experiences` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_category` ON `ology_live_experiences` (`category`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_active` ON `ology_live_experiences` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_capacity` ON `ology_live_experiences` (`capacityType`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_experience` ON `ology_live_bookings` (`experienceId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_fan` ON `ology_live_bookings` (`fanId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_talent` ON `ology_live_bookings` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_status` ON `ology_live_bookings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_bookings_scheduled` ON `ology_live_bookings` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_experience` ON `ology_live_time_slots` (`experienceId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_talent` ON `ology_live_time_slots` (`talentId`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_start` ON `ology_live_time_slots` (`startTime`);--> statement-breakpoint
CREATE INDEX `idx_ology_live_slots_available` ON `ology_live_time_slots` (`isAvailable`);
