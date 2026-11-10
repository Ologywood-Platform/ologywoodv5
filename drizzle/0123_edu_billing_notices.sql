CREATE TABLE `edu_billing_notices` (
	`noticeKey` varchar(191) NOT NULL,
	`userId` int NOT NULL,
	`verificationId` int NOT NULL,
	`revision` int NOT NULL,
	`kind` varchar(32) NOT NULL,
	`deadline` timestamp NOT NULL,
	`state` varchar(16) NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edu_billing_notices_noticeKey` PRIMARY KEY(`noticeKey`)
);
--> statement-breakpoint
CREATE INDEX `idx_edu_billing_notice_verification` ON `edu_billing_notices` (`verificationId`,`revision`);