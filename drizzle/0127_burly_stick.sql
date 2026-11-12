ALTER TABLE `merch_orders` ADD `expectedFulfillmentDate` varchar(10);--> statement-breakpoint
ALTER TABLE `merch_orders` ADD `preorderDateAcknowledged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `merch_orders` ADD `fulfillmentDateUpdatesOptIn` boolean DEFAULT false NOT NULL;