CREATE TABLE `media_upload_chunk_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadId` varchar(36) NOT NULL,
	`chunkIndex` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`byteSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_upload_chunk_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_media_upload_chunk` UNIQUE(`uploadId`,`chunkIndex`)
);
--> statement-breakpoint
CREATE TABLE `media_upload_jobs` (
	`id` varchar(36) NOT NULL,
	`ownerUserId` int NOT NULL,
	`requestId` varchar(36) NOT NULL,
	`fingerprint` varchar(64) NOT NULL,
	`storageNonce` varchar(36) NOT NULL,
	`purpose` enum('content-preview','content-cover','music-audio','music-cover') NOT NULL,
	`releaseId` int,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`chunkBytes` int NOT NULL,
	`chunkCount` int NOT NULL,
	`state` enum('uploading','queued','processing','done','failed') NOT NULL DEFAULT 'uploading',
	`attempts` int NOT NULL DEFAULT 0,
	`leaseToken` varchar(36),
	`leaseExpiresAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`result` json,
	`error` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_upload_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_media_upload_owner_request` UNIQUE(`ownerUserId`,`requestId`)
);
--> statement-breakpoint
CREATE TABLE `media_upload_worker_slots` (
	`id` int NOT NULL,
	`leaseToken` varchar(36),
	`leaseExpiresAt` timestamp,
	CONSTRAINT `media_upload_worker_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_media_upload_chunk_upload` ON `media_upload_chunk_receipts` (`uploadId`);--> statement-breakpoint
CREATE INDEX `idx_media_upload_jobs_owner_state` ON `media_upload_jobs` (`ownerUserId`,`state`);--> statement-breakpoint
CREATE INDEX `idx_media_upload_jobs_lease` ON `media_upload_jobs` (`state`,`leaseExpiresAt`);