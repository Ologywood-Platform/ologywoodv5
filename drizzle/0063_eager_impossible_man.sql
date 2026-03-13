CREATE TABLE `role_change_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetUserId` int NOT NULL,
	`targetEmail` varchar(320),
	`targetName` text,
	`previousRole` varchar(32) NOT NULL,
	`newRole` varchar(32) NOT NULL,
	`changedById` int NOT NULL,
	`changedByEmail` varchar(320),
	`changedByName` text,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_change_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_audit_target_user` ON `role_change_audit_log` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `idx_audit_changed_by` ON `role_change_audit_log` (`changedById`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `role_change_audit_log` (`createdAt`);