ALTER TABLE `edu_verification_events` ADD `revision` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `edu_verification_events` ADD `reviewDecision` enum('approve','reject','revoke','renew');--> statement-breakpoint
ALTER TABLE `edu_verification_events` ADD `manualProofConfirmed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `revision` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `evidenceAcknowledged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalVerificationMethod` enum('school_email','school_code','manual');--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalInstitution` varchar(200);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalProgram` varchar(200);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalSchoolEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalSchoolCodeLast4` varchar(4);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalVerificationNote` varchar(1000);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalEvidenceAcknowledged` boolean;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalSubmittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalRejectionReason` varchar(500);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `checkoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `stripeCouponId` varchar(255);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `billingMode` enum('test','live');--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `billingVerificationRevision` int;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `renewalNoticeSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `expiryNoticeSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `discountEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `edu_verifications` ADD `billingReconcileAfter` timestamp;