ALTER TABLE `bookings` ADD `paymentStatus` enum('unpaid','deposit_paid','full_paid','refunded') DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `bookings` ADD `depositPaidAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `fullPaymentPaidAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `stripeRefundId` varchar(255);