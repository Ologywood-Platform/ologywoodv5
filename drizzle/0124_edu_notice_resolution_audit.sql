CREATE TABLE `edu_billing_notice_resolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noticeKey` varchar(191) NOT NULL,
	`actorUserId` int NOT NULL,
	`decision` varchar(32) NOT NULL,
	`providerEvidence` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edu_billing_notice_resolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_edu_billing_resolution_notice` ON `edu_billing_notice_resolutions` (`noticeKey`);