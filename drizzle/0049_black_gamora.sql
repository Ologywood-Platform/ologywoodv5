CREATE INDEX `idx_booking_usage_user_month` ON `booking_usage` (`userId`,`month`);--> statement-breakpoint
CREATE INDEX `idx_event_history_artist` ON `event_history` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_event_history_date` ON `event_history` (`eventDate`);--> statement-breakpoint
CREATE INDEX `idx_event_photos_history` ON `event_photos` (`eventHistoryId`);--> statement-breakpoint
CREATE INDEX `idx_event_recurrence_event` ON `event_recurrence` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_saved_events_user_event` ON `saved_events` (`userId`,`eventId`);