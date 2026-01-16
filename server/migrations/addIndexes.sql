-- Database Performance Optimization: Add Indexes for Frequently Queried Columns

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_artistId ON bookings(artistId);
CREATE INDEX IF NOT EXISTS idx_bookings_venueId ON bookings(venueId);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_createdAt ON bookings(createdAt);
CREATE INDEX IF NOT EXISTS idx_bookings_artistId_status ON bookings(artistId, status);
CREATE INDEX IF NOT EXISTS idx_bookings_venueId_status ON bookings(venueId, status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_bookingId ON messages(bookingId);
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_recipientId ON messages(recipientId);
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt);
CREATE INDEX IF NOT EXISTS idx_messages_bookingId_createdAt ON messages(bookingId, createdAt);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_artistId ON reviews(artistId);
CREATE INDEX IF NOT EXISTS idx_reviews_venueId ON reviews(venueId);
CREATE INDEX IF NOT EXISTS idx_reviews_bookingId ON reviews(bookingId);
CREATE INDEX IF NOT EXISTS idx_reviews_createdAt ON reviews(createdAt);
CREATE INDEX IF NOT EXISTS idx_reviews_artistId_createdAt ON reviews(artistId, createdAt);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripeCustomerId ON subscriptions(stripeCustomerId);

-- Availability table indexes
CREATE INDEX IF NOT EXISTS idx_availability_artistId ON availability(artistId);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability(date);
CREATE INDEX IF NOT EXISTS idx_availability_artistId_date ON availability(artistId, date);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_artist_profiles_userId ON artist_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_venue_profiles_userId ON venue_profiles(userId);

-- Profile views table indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_artistId ON profile_views(artistId);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewerId ON profile_views(viewerId);
CREATE INDEX IF NOT EXISTS idx_profile_views_createdAt ON profile_views(createdAt);

-- Favorites table indexes
CREATE INDEX IF NOT EXISTS idx_favorites_userId ON favorites(userId);
CREATE INDEX IF NOT EXISTS idx_favorites_artistId ON favorites(artistId);
CREATE INDEX IF NOT EXISTS idx_favorites_userId_artistId ON favorites(userId, artistId);

-- Booking reminders table indexes
CREATE INDEX IF NOT EXISTS idx_booking_reminders_bookingId ON booking_reminders(bookingId);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_reminderDate ON booking_reminders(reminderDate);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent ON booking_reminders(sent);

-- Rider templates table indexes
CREATE INDEX IF NOT EXISTS idx_rider_templates_artistId ON rider_templates(artistId);
CREATE INDEX IF NOT EXISTS idx_rider_templates_createdAt ON rider_templates(createdAt);

-- Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_bookingId ON contracts(bookingId);
CREATE INDEX IF NOT EXISTS idx_contracts_artistId ON contracts(artistId);
CREATE INDEX IF NOT EXISTS idx_contracts_venueId ON contracts(venueId);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- Signatures table indexes
CREATE INDEX IF NOT EXISTS idx_signatures_contractId ON signatures(contractId);
CREATE INDEX IF NOT EXISTS idx_signatures_userId ON signatures(userId);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt);

-- Support tickets table indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_userId ON support_tickets(userId);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_createdAt ON support_tickets(createdAt);

-- Referral program indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrerId ON referrals(referrerId);
CREATE INDEX IF NOT EXISTS idx_referrals_refereeId ON referrals(refereeId);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Verification badges indexes
CREATE INDEX IF NOT EXISTS idx_verification_badges_userId ON verification_badges(userId);
CREATE INDEX IF NOT EXISTS idx_verification_badges_badgeType ON verification_badges(badgeType);

-- Booking templates indexes
CREATE INDEX IF NOT EXISTS idx_booking_templates_venueId ON booking_templates(venueId);
CREATE INDEX IF NOT EXISTS idx_booking_templates_createdAt ON booking_templates(createdAt);
