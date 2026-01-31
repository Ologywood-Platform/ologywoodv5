-- Add email verification and profile completion fields to venue_profiles
ALTER TABLE `venue_profiles` 
ADD COLUMN `emailVerified` boolean NOT NULL DEFAULT false AFTER `listingViews`,
ADD COLUMN `emailVerificationToken` varchar(255) AFTER `emailVerified`,
ADD COLUMN `emailVerificationSentAt` timestamp AFTER `emailVerificationToken`,
ADD COLUMN `profileCompletionScore` int NOT NULL DEFAULT 0 AFTER `emailVerificationSentAt`,
ADD COLUMN `profileCompletionUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `profileCompletionScore`;
