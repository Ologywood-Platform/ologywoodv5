ALTER TABLE `venue_profiles` MODIFY COLUMN `operatingHours` json;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `country` varchar(100) DEFAULT 'US';