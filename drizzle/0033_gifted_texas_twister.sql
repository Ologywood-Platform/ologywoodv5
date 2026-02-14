ALTER TABLE `bookings` ADD `riderTemplateId` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `riderAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `riderAcknowledgedBy` int;