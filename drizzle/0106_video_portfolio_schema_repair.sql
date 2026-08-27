ALTER TABLE `video_portfolio` ADD COLUMN IF NOT EXISTS `videoUrl` text NULL;--> statement-breakpoint
ALTER TABLE `video_portfolio` ADD COLUMN IF NOT EXISTS `status` enum('active','processing','removed') NOT NULL DEFAULT 'active';
