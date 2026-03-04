ALTER TABLE `messages` ADD `messageType` varchar(50) DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `metadata` json;