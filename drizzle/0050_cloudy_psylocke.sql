CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`keyPrefix` varchar(12) NOT NULL,
	`scopes` json NOT NULL,
	`rateLimit` int NOT NULL DEFAULT 100,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`secret` varchar(64) NOT NULL,
	`events` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastDeliveredAt` timestamp,
	`failureCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_api_keys_user` ON `api_keys` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_hash` ON `api_keys` (`keyHash`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_prefix` ON `api_keys` (`keyPrefix`);--> statement-breakpoint
CREATE INDEX `idx_webhook_endpoints_user` ON `webhook_endpoints` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_endpoints_active` ON `webhook_endpoints` (`isActive`);