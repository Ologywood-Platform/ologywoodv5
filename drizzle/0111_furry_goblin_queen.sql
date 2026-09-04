ALTER TABLE `artist_releases` ADD `aiUseDisclosureEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `artist_releases` ADD `aiUseLevel` varchar(40);--> statement-breakpoint
ALTER TABLE `artist_releases` ADD `aiUseComponents` json;--> statement-breakpoint
ALTER TABLE `artist_releases` ADD `aiUseTools` varchar(300);--> statement-breakpoint
ALTER TABLE `artist_releases` ADD `aiUseNotes` varchar(1000);--> statement-breakpoint
ALTER TABLE `releases` ADD `aiUseDisclosureEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `releases` ADD `aiUseLevel` varchar(40);--> statement-breakpoint
ALTER TABLE `releases` ADD `aiUseComponents` json;--> statement-breakpoint
ALTER TABLE `releases` ADD `aiUseTools` varchar(300);--> statement-breakpoint
ALTER TABLE `releases` ADD `aiUseNotes` varchar(1000);