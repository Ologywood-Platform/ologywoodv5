ALTER TABLE `bookings` ADD `stripeDepositPaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `stripeFinalPaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `finalPaidAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `cancelledBy` varchar(20);--> statement-breakpoint
ALTER TABLE `bookings` ADD `cancellationReason` text;