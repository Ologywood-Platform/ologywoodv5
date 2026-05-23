ALTER TABLE `events` ADD `venueId` int;--> statement-breakpoint
CREATE INDEX `idx_events_venue` ON `events` (`venueId`);