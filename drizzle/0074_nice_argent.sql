CREATE TABLE `referral_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` enum('earned','redeemed') NOT NULL,
	`referralId` int,
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `referrals` MODIFY COLUMN `referralCode` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `referrals` ADD `convertedAt` timestamp;--> statement-breakpoint
CREATE INDEX `idx_referral_credits_user` ON `referral_credits` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_referrals_referrer` ON `referrals` (`referrerId`);--> statement-breakpoint
CREATE INDEX `idx_referrals_referred` ON `referrals` (`referredId`);