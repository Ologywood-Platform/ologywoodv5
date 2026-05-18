ALTER TABLE `referral_credits` MODIFY COLUMN `type` enum('earned','redeemed','expired') NOT NULL;--> statement-breakpoint
ALTER TABLE `referral_credits` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `referral_credits` ADD `expirationWarned` boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX `idx_referral_credits_expires` ON `referral_credits` (`expiresAt`);