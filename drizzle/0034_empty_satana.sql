DROP TABLE `ryder_contract_comments`;--> statement-breakpoint
DROP TABLE `ryder_contract_versions`;--> statement-breakpoint
DROP TABLE `ryder_contracts`;--> statement-breakpoint
DROP TABLE `tax_reports`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP INDEX `venue_profiles_email_unique`;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `tax` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `platformFee` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `verification_badges` MODIFY COLUMN `averageRating` decimal(3,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `rider_templates` ADD `templateData` json;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `website`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `capacity`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `venueType`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `amenities`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `profilePhotoUrl`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `mediaGallery`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `averageRating`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `reviewCount`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `listingViews`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `emailVerificationToken`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `emailVerificationSentAt`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `profileCompletionScore`;--> statement-breakpoint
ALTER TABLE `venue_profiles` DROP COLUMN `profileCompletionUpdatedAt`;