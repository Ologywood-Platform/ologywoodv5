CREATE TABLE `certificate_audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateId` int NOT NULL,
	`contractId` int NOT NULL,
	`action` enum('created','verified','expired','revoked','tamper_detected','reissued','archived') NOT NULL,
	`performedBy` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificate_audit_trail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`recipientId` int NOT NULL,
	`reminderType` enum('signature_pending','signature_request','event_approaching','contract_expiring') NOT NULL,
	`daysBeforeEvent` int,
	`status` enum('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contract_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_signing_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`signerRole` enum('artist','venue') NOT NULL,
	`signerId` int NOT NULL,
	`status` enum('active','completed','expired','cancelled') NOT NULL DEFAULT 'active',
	`signatureData` text,
	`signedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contract_signing_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `contract_signing_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `contract_verification_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateId` int NOT NULL,
	`contractId` int NOT NULL,
	`requestedBy` int,
	`verificationMethod` enum('api','web_interface','email_link','qr_code','manual') NOT NULL,
	`result` enum('valid','invalid','expired','tampered') NOT NULL,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_verification_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signature_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`signatureId` int NOT NULL,
	`signerName` varchar(255) NOT NULL,
	`signerEmail` varchar(320) NOT NULL,
	`signerRole` enum('artist','venue') NOT NULL,
	`certificateNumber` varchar(50) NOT NULL,
	`signatureHash` varchar(64) NOT NULL,
	`verificationHash` varchar(128) NOT NULL,
	`signedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`isValid` boolean NOT NULL DEFAULT true,
	`tamperDetected` boolean NOT NULL DEFAULT false,
	`verificationCount` int NOT NULL DEFAULT 0,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signature_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `signature_certificates_certificateNumber_unique` UNIQUE(`certificateNumber`),
	CONSTRAINT `signature_certificates_contractId_signerRole_unique` UNIQUE(`contractId`,`signerRole`)
);
