-- Create rider acknowledgments table
CREATE TABLE `rider_acknowledgments` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `bookingId` int NOT NULL,
  `riderTemplateId` int NOT NULL,
  `artistId` int NOT NULL,
  `venueId` int NOT NULL,
  `status` enum('pending', 'acknowledged', 'accepted', 'modifications_proposed', 'rejected') NOT NULL DEFAULT 'pending',
  `acknowledgedAt` timestamp NULL,
  `acknowledgedByUserId` int NULL,
  `proposedModifications` json NULL,
  `modificationsProposedAt` timestamp NULL,
  `artistResponse` enum('approved', 'rejected', 'counter_proposal') NOT NULL DEFAULT 'approved',
  `artistResponseAt` timestamp NULL,
  `artistResponseNotes` text NULL,
  `finalizedAt` timestamp NULL,
  `finalizedByUserId` int NULL,
  `notes` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_bookingId` (`bookingId`),
  INDEX `idx_riderTemplateId` (`riderTemplateId`),
  INDEX `idx_artistId` (`artistId`),
  INDEX `idx_venueId` (`venueId`),
  INDEX `idx_status` (`status`)
);

-- Create rider modification history table
CREATE TABLE `rider_modification_history` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `riderAcknowledgmentId` int NOT NULL,
  `modificationNumber` int NOT NULL,
  `fieldName` varchar(255) NOT NULL,
  `originalValue` text NULL,
  `newValue` text NULL,
  `reason` text NULL,
  `changedByUserId` int NOT NULL,
  `changedByRole` enum('artist', 'venue') NOT NULL,
  `status` enum('proposed', 'approved', 'rejected') NOT NULL DEFAULT 'proposed',
  `statusChangedAt` timestamp NULL,
  `statusChangedByUserId` int NULL,
  `statusChangeNotes` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_riderAcknowledgmentId` (`riderAcknowledgmentId`),
  INDEX `idx_changedByUserId` (`changedByUserId`),
  INDEX `idx_status` (`status`)
);
