CREATE TABLE `tax_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`year` int NOT NULL,
	`totalEarnings` decimal(10,2) NOT NULL DEFAULT '0',
	`totalPayouts` decimal(10,2) NOT NULL DEFAULT '0',
	`platformFees` decimal(10,2) NOT NULL DEFAULT '0',
	`netIncome` decimal(10,2) NOT NULL DEFAULT '0',
	`bookingCount` int DEFAULT 0,
	`form1099Issued` boolean DEFAULT false,
	`form1099Url` text,
	`generatedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_reports_id` PRIMARY KEY(`id`)
);
