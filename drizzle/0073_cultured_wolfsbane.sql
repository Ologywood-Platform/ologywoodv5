ALTER TABLE `user_subscriptions` MODIFY COLUMN `status` enum('active','cancelled','past_due','trialing','paused') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `pausedAt` timestamp;--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `pauseExpiresAt` timestamp;