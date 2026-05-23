ALTER TABLE `bookings` ADD `paymentTermsType` enum('flat_guarantee','door_split','guarantee_vs_percentage') DEFAULT 'flat_guarantee';--> statement-breakpoint
ALTER TABLE `bookings` ADD `doorSplitArtistPercent` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `guaranteeAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `bookings` ADD `doorRevenue` decimal(10,2);--> statement-breakpoint
ALTER TABLE `bookings` ADD `attendance` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `settlementAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `bookings` ADD `settlementNotes` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `settledAt` timestamp;