-- Dispute / complaint system
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reporter_role TEXT NOT NULL CHECK (reporter_role IN ('host', 'renter')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Reporter can see own disputes
CREATE POLICY "Reporter can view own disputes"
  ON disputes FOR SELECT
  USING (auth.uid() = reporter_id);

-- Reporter can create disputes
CREATE POLICY "Authenticated can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admin can see and update all
CREATE POLICY "Admin full access to disputes"
  ON disputes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Allow admin to read any conversation messages (for dispute resolution)
-- Add policy to messages table
CREATE POLICY "Admin can read all messages"
  ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
