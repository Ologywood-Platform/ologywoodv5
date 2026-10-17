CREATE TABLE `fan_email_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerUserId` int NOT NULL,
	`creatorUserId` int NOT NULL,
	`optIn` boolean NOT NULL DEFAULT false,
	`revision` int NOT NULL DEFAULT 0,
	`consentedAt` timestamp,
	`revokedAt` timestamp,
	`consentVersion` varchar(64) NOT NULL,
	`emailHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fan_email_consents_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_fan_email_consent_scope` UNIQUE(`followerUserId`,`creatorUserId`)
);
--> statement-breakpoint
ALTER TABLE `email_preferences` ADD `fanUpdates` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_fan_email_consent_creator_optin` ON `fan_email_consents` (`creatorUserId`,`optIn`);