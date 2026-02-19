ALTER TABLE `venue_profiles` ADD `city` varchar(255);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `capacity` int;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `profilePhotoUrl` text;--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `venue_profiles` ADD `emailVerificationSentAt` timestamp;