ALTER TABLE `reviews` MODIFY COLUMN `venueId` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `reviewerUserId` int;--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewer_user` ON `reviews` (`reviewerUserId`);