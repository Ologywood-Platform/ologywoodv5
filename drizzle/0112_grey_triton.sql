CREATE TABLE `nil_athlete_compliance_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistProfileId` int NOT NULL,
	`athleteUserId` int NOT NULL,
	`athleticStatus` enum('prospective_student_athlete','college_student_athlete','professional_athlete','former_athlete','other') NOT NULL,
	`institutionName` varchar(255),
	`institutionState` varchar(100),
	`associationName` varchar(100),
	`divisionLevel` varchar(50),
	`eligibilityEndsAt` timestamp,
	`complianceContactName` varchar(255),
	`complianceContactEmail` varchar(320),
	`complianceContactPhone` varchar(50),
	`isMinor` boolean NOT NULL DEFAULT false,
	`guardianName` varchar(255),
	`guardianEmail` varchar(320),
	`representativeInvolved` boolean NOT NULL DEFAULT false,
	`athleteAttestedAt` timestamp,
	`termsVersion` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nil_athlete_compliance_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `nil_athlete_compliance_profiles_artistProfileId_unique` UNIQUE(`artistProfileId`),
	CONSTRAINT `nil_athlete_compliance_profiles_athleteUserId_unique` UNIQUE(`athleteUserId`)
);
--> statement-breakpoint
CREATE TABLE `nil_compliance_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteProfileId` int NOT NULL,
	`athleteUserId` int NOT NULL,
	`sourceType` enum('manual','booking','ology_live') NOT NULL DEFAULT 'manual',
	`bookingId` int,
	`ologyLiveBookingId` int,
	`sourceName` varchar(255) NOT NULL,
	`sourceKey` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`dealType` enum('brand_endorsement','appearance','autograph_signing','speaking','camp_clinic','ology_live','other') NOT NULL,
	`isNilActivity` boolean NOT NULL DEFAULT true,
	`isEndorsementContract` boolean NOT NULL DEFAULT false,
	`proposedProtectionEnabled` boolean NOT NULL DEFAULT true,
	`divisionOneReportingApplies` boolean NOT NULL DEFAULT false,
	`agreementDate` timestamp NOT NULL,
	`termStartsAt` timestamp,
	`termEndsAt` timestamp,
	`eligibilityEndsAtSnapshot` timestamp,
	`servicesDescription` text NOT NULL,
	`counterpartyName` varchar(255) NOT NULL,
	`counterpartyEmail` varchar(320),
	`grossCompensation` decimal(12,2) NOT NULL,
	`compensationReceivedAmount` decimal(12,2),
	`compensationReceivedAt` timestamp,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`writtenAgreementConfirmed` boolean NOT NULL DEFAULT false,
	`nonperformanceTerminationTerms` text,
	`notConditionedOnEnrollmentOrResidency` boolean NOT NULL DEFAULT false,
	`representativeInvolved` boolean NOT NULL DEFAULT false,
	`representativeName` varchar(255),
	`representativeEmail` varchar(320),
	`representativeRegistrationState` varchar(100),
	`representativeRegistrationNumber` varchar(120),
	`agencyContractConfirmed` boolean NOT NULL DEFAULT false,
	`agentFeePercent` decimal(5,2),
	`agentFeeAmount` decimal(12,2),
	`platformServiceFeeAmount` decimal(12,2),
	`paymentProcessingFeeAmount` decimal(12,2),
	`agreementDisclosureStatus` enum('not_recorded','submitted') NOT NULL DEFAULT 'not_recorded',
	`agreementSubmittedAt` timestamp,
	`agreementSubmissionRecipient` varchar(255),
	`agreementSubmittedBy` enum('athlete','authorized_representative'),
	`compensationDisclosureStatus` enum('not_recorded','submitted') NOT NULL DEFAULT 'not_recorded',
	`compensationSubmittedAt` timestamp,
	`compensationSubmissionRecipient` varchar(255),
	`compensationSubmittedBy` enum('athlete','authorized_representative'),
	`contractTemplateVersion` varchar(32) NOT NULL,
	`nilTermsVersion` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nil_compliance_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nil_compliance_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int,
	`athleteProfileId` int NOT NULL,
	`athleteUserId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` enum('profile_created','profile_updated','deal_created','deal_updated','agreement_submission_recorded','compensation_submission_recorded','evidence_uploaded') NOT NULL,
	`eventData` json,
	`evidenceKey` varchar(512),
	`evidenceUrl` text,
	`evidenceFileName` varchar(255),
	`evidenceMimeType` varchar(100),
	`evidenceSizeBytes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nil_compliance_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `templateVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `contracts` ADD `nilTermsVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `contracts` ADD `complianceSnapshot` json;--> statement-breakpoint
ALTER TABLE `contracts` ADD `contentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `ology_live_session_contracts` ADD `templateVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `ology_live_session_contracts` ADD `nilTermsVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `ology_live_session_contracts` ADD `complianceSnapshot` json;--> statement-breakpoint
ALTER TABLE `ology_live_session_contracts` ADD `contentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `ology_live_session_contracts` ADD `statutoryRightsCarveout` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_nil_athlete_compliance_user` ON `nil_athlete_compliance_profiles` (`athleteUserId`);--> statement-breakpoint
CREATE INDEX `idx_nil_athlete_compliance_status` ON `nil_athlete_compliance_profiles` (`athleticStatus`);--> statement-breakpoint
CREATE INDEX `idx_nil_deals_athlete_created` ON `nil_compliance_deals` (`athleteUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_nil_deals_source_window` ON `nil_compliance_deals` (`athleteProfileId`,`sourceKey`,`agreementDate`);--> statement-breakpoint
CREATE INDEX `idx_nil_deals_booking` ON `nil_compliance_deals` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_nil_deals_live_booking` ON `nil_compliance_deals` (`ologyLiveBookingId`);--> statement-breakpoint
CREATE INDEX `idx_nil_events_athlete_created` ON `nil_compliance_events` (`athleteUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_nil_events_deal_created` ON `nil_compliance_events` (`dealId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_nil_events_type` ON `nil_compliance_events` (`eventType`);