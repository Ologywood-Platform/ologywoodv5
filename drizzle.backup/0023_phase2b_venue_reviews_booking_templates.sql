-- Phase 2B Migration: Add venueResponse and respondedAt to venue_reviews table
ALTER TABLE `venue_reviews` ADD COLUMN `venueResponse` text;--> statement-breakpoint
ALTER TABLE `venue_reviews` ADD COLUMN `respondedAt` timestamp;
