CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`categoryId` int NOT NULL,
	`order` int DEFAULT 0,
	`views` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`categoryId` int NOT NULL,
	`tags` json,
	`views` int DEFAULT 0,
	`helpfulVotes` int DEFAULT 0,
	`unhelpfulVotes` int DEFAULT 0,
	`author` varchar(255),
	`isPublished` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `knowledge_base_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `support_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`order` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `support_sla_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionTier` varchar(50) NOT NULL,
	`responseTimeHours` int NOT NULL,
	`resolutionTimeHours` int NOT NULL,
	`maxOpenTickets` int DEFAULT 10,
	`prioritySupport` boolean DEFAULT false,
	`liveChat` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_sla_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_sla_settings_subscriptionTier_unique` UNIQUE(`subscriptionTier`)
);
--> statement-breakpoint
CREATE TABLE `support_ticket_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`isStaffResponse` boolean DEFAULT false,
	`attachmentUrls` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_ticket_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','waiting_user','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedToId` int,
	`attachmentUrls` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
