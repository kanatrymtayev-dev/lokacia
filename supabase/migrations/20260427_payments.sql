-- Payments table for Kaspi Pay integration
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount INTEGER NOT NULL, -- in KZT tenge
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  provider TEXT NOT NULL DEFAULT 'kaspi',
  kaspi_order_id TEXT,
  kaspi_payment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Renter can see own payments (through bookings)
CREATE POLICY "Renter can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id AND bookings.renter_id = auth.uid())
  );

-- Host can see payments for their listings
CREATE POLICY "Host can view payments for own listings"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN listings ON listings.id = bookings.listing_id
      WHERE bookings.id = payments.booking_id AND listings.host_id = auth.uid()
    )
  );

-- Admin can see all
CREATE POLICY "Admin full access to payments"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service can insert/update (for API routes)
CREATE POLICY "Authenticated users can create payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update payments"
  ON payments FOR UPDATE
  USING (true);
