CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`excerpt` varchar(1000) NOT NULL,
	`content` text NOT NULL,
	`coverImageUrl` varchar(1000),
	`authorId` int NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`category` enum('announcement','guide','news','update','tutorial') NOT NULL DEFAULT 'announcement',
	`tags` json DEFAULT ('[]'),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `idx_blog_slug` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_blog_status` ON `blog_posts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_blog_published_at` ON `blog_posts` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `idx_blog_category` ON `blog_posts` (`category`);--> statement-breakpoint
CREATE INDEX `idx_blog_author` ON `blog_posts` (`authorId`);