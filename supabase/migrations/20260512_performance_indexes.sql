-- Performance indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_status ON bookings(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_listings_host ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_moderation ON listings(status, moderation_status);
