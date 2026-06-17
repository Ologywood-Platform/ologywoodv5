CREATE TABLE `venue_active_sponsors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`packageId` int NOT NULL,
	`applicationId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`companyLogoUrl` varchar(512) NOT NULL,
	`companyWebsite` varchar(512),
	`companyDescription` varchar(500),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venue_active_sponsors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venue_sponsor_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`venueId` int NOT NULL,
	`applicantUserId` int,
	`companyName` varchar(200) NOT NULL,
	`contactName` varchar(200) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`companyWebsite` varchar(512),
	`companyLogoUrl` varchar(512),
	`message` text,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`startDate` timestamp,
	`endDate` timestamp,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venue_sponsor_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venue_sponsor_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`packageType` enum('title_sponsor','stage_sponsor','bar_sponsor','digital_signage','event_mention','custom') NOT NULL DEFAULT 'custom',
	`price` decimal(10,2) NOT NULL,
	`duration` enum('per_event','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
	`benefits` json,
	`maxSlots` int NOT NULL DEFAULT 1,
	`filledSlots` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`imageUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venue_sponsor_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_venue_active_sponsors_venue` ON `venue_active_sponsors` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_venue_active_sponsors_active` ON `venue_active_sponsors` (`venueId`,`isActive`);--> statement-breakpoint
CREATE INDEX `idx_venue_active_sponsors_package` ON `venue_active_sponsors` (`packageId`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_apps_package` ON `venue_sponsor_applications` (`packageId`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_apps_venue` ON `venue_sponsor_applications` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_apps_status` ON `venue_sponsor_applications` (`venueId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_apps_applicant` ON `venue_sponsor_applications` (`applicantUserId`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_packages_venue` ON `venue_sponsor_packages` (`venueId`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_packages_active` ON `venue_sponsor_packages` (`venueId`,`isActive`);--> statement-breakpoint
CREATE INDEX `idx_venue_sponsor_packages_type` ON `venue_sponsor_packages` (`packageType`);