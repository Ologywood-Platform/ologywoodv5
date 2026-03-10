ALTER TABLE `bookings` ADD `eventType` varchar(50);--> statement-breakpoint
ALTER TABLE `bookings` ADD `bookingSource` varchar(30) DEFAULT 'venue_dashboard';--> statement-breakpoint
ALTER TABLE `bookings` ADD `venueName` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `venueAddress` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `clientName` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `clientEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `bookings` ADD `clientPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `release_purchases` ADD `purchasedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `release_purchases` DROP COLUMN `createdAt`;