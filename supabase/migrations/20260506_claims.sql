-- Claims portal: host damage claims for security deposit / guarantee fund
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  host_id UUID NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  damage_amount INTEGER NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  resolution TEXT,
  deposit_held BOOLEAN NOT NULL DEFAULT false,
  fund_payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_host ON claims(host_id);
CREATE INDEX IF NOT EXISTS idx_claims_booking ON claims(booking_id);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Host can see own claims
CREATE POLICY "Host can view own claims"
  ON claims FOR SELECT
  USING (auth.uid() = host_id);

-- Host can create claims
CREATE POLICY "Host can create claims"
  ON claims FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Admin full access
CREATE POLICY "Admin full access to claims"
  ON claims FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
