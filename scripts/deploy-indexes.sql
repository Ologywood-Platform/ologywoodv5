-- Database Index Deployment Script
-- Run these statements to optimize query performance

-- Users table indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Contracts table indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_id ON contracts(id);
CREATE INDEX IF NOT EXISTS idx_contracts_artist_id ON contracts(artist_id);
CREATE INDEX IF NOT EXISTS idx_contracts_venue_id ON contracts(venue_id);
CREATE INDEX IF NOT EXISTS idx_contracts_booking_id ON contracts(booking_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_at ON contracts(signed_at);

-- Bookings table indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_id ON bookings(id);
CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Signatures table indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_signatures_id ON signatures(id);
CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_signatures_certificate ON signatures(certificate_number);
CREATE INDEX IF NOT EXISTS idx_signatures_signed_at ON signatures(signed_at);

-- Support tickets table indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_id ON support_tickets(id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_updated_at ON support_tickets(updated_at);

-- Help articles table indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_help_articles_id ON help_articles(id);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_created_at ON help_articles(created_at);

-- Payments table indexes (if exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_id ON payments(id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contracts_artist_status ON contracts(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_venue_status ON contracts(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_artist_date ON bookings(artist_id, event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_date ON bookings(venue_id, event_date);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created ON support_tickets(user_id, created_at);

-- Verify indexes were created
SELECT 
  table_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY table_name, indexname;
