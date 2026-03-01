CREATE TABLE `artist_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`genre` varchar(100),
	`audioFileKey` varchar(512) NOT NULL,
	`previewFileKey` varchar(512),
	`coverArtKey` varchar(512) NOT NULL,
	`durationSeconds` int NOT NULL,
	`fileFormat` varchar(10) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`priceInCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`allowPayWhatYouWant` boolean NOT NULL DEFAULT false,
	`status` enum('draft','published','taken_down','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`rightsCertified` boolean NOT NULL DEFAULT false,
	`rightsCertifiedAt` timestamp,
	`totalSales` int NOT NULL DEFAULT 0,
	`totalRevenueCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_releases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `release_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`releaseId` int NOT NULL,
	`buyerEmail` varchar(320) NOT NULL,
	`buyerName` varchar(255),
	`buyerUserId` int,
	`stripeCheckoutSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amountPaidCents` int NOT NULL,
	`platformFeeCents` int NOT NULL,
	`artistNetCents` int NOT NULL,
	`downloadCount` int NOT NULL DEFAULT 0,
	`maxDownloads` int NOT NULL DEFAULT 5,
	`lastDownloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `release_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_releases_artist` ON `artist_releases` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_releases_status` ON `artist_releases` (`status`);--> statement-breakpoint
CREATE INDEX `idx_releases_published` ON `artist_releases` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `idx_releases_artist_status` ON `artist_releases` (`artistId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_purchases_release` ON `release_purchases` (`releaseId`);--> statement-breakpoint
CREATE INDEX `idx_purchases_buyer_email` ON `release_purchases` (`buyerEmail`);--> statement-breakpoint
CREATE INDEX `idx_purchases_buyer_user` ON `release_purchases` (`buyerUserId`);--> statement-breakpoint
CREATE INDEX `idx_purchases_session` ON `release_purchases` (`stripeCheckoutSessionId`);