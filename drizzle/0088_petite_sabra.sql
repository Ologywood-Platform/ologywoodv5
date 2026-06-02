ALTER TABLE `users` ADD `oauthProvider` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `oauthProviderId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(512);