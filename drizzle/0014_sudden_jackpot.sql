ALTER TABLE `rider_templates` MODIFY COLUMN `technicalRequirements` json NOT NULL DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `rider_templates` MODIFY COLUMN `hospitalityRequirements` json NOT NULL DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `rider_templates` MODIFY COLUMN `financialTerms` json NOT NULL DEFAULT ('{}');