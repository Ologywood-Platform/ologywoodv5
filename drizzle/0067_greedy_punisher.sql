ALTER TABLE `events` ADD `coverImageUrl` text;--> statement-breakpoint
ALTER TABLE `events` ADD `ticketLink` text;--> statement-breakpoint
ALTER TABLE `events` ADD `eventSource` enum('artist_post','venue_booking') DEFAULT 'venue_booking' NOT NULL;