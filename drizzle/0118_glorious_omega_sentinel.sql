CREATE TABLE `profile_release_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`kind` enum('music','content_singles') NOT NULL,
	`orderedIds` json,
	`revision` int NOT NULL DEFAULT 0,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `profile_release_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_profile_release_order_scope` UNIQUE(`profileId`,`kind`)
);
