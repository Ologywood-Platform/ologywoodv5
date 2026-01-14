ALTER TABLE `artist_verification` MODIFY COLUMN `averageRating` decimal(3,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `referrals` MODIFY COLUMN `creditsAwarded` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `user_credits` MODIFY COLUMN `balance` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `user_credits` MODIFY COLUMN `totalEarned` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `user_credits` MODIFY COLUMN `totalSpent` decimal(10,2) DEFAULT '0';