CREATE TABLE `edu_verification_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationId` int NOT NULL,
	`userId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`action` enum('submitted','approved','rejected','revoked') NOT NULL,
	`note` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edu_verification_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edu_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','approved','rejected','revoked') NOT NULL DEFAULT 'pending',
	`verificationMethod` enum('school_email','school_code','manual') NOT NULL,
	`institution` varchar(200) NOT NULL,
	`program` varchar(200),
	`schoolEmail` varchar(320),
	`schoolCodeLast4` varchar(4),
	`verificationNote` varchar(1000),
	`verifiedUntil` timestamp,
	`graceUntil` timestamp,
	`reviewedAt` timestamp,
	`reviewedByUserId` int,
	`rejectionReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `edu_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `edu_verifications_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `idx_edu_verification_events_history` ON `edu_verification_events` (`verificationId`,`id`);--> statement-breakpoint
CREATE INDEX `idx_edu_verifications_status` ON `edu_verifications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_edu_verifications_verified_until` ON `edu_verifications` (`verifiedUntil`);