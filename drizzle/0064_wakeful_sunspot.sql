CREATE TABLE `admin_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_id` int NOT NULL,
	`admin_email` varchar(320) NOT NULL,
	`admin_name` varchar(255),
	`action` varchar(100) NOT NULL,
	`category` enum('users','bookings','payouts','blog','disputes','releases','settings') NOT NULL,
	`target_type` varchar(50),
	`target_id` varchar(100),
	`target_label` varchar(255),
	`details` text,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_admin_activity_admin` ON `admin_activity_log` (`admin_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_activity_category` ON `admin_activity_log` (`category`);--> statement-breakpoint
CREATE INDEX `idx_admin_activity_action` ON `admin_activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_admin_activity_created` ON `admin_activity_log` (`created_at`);