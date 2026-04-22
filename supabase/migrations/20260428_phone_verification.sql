-- Phone verification fields on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- OTP codes table (server-side, short-lived)
CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,          -- bcrypt hash of 6-digit code
  attempts INT NOT NULL DEFAULT 0,  -- max 5 attempts
  expires_at TIMESTAMPTZ NOT NULL,  -- created_at + 5 min
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_user ON phone_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON phone_otp_codes(expires_at);

ALTER TABLE phone_otp_codes ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write OTP codes (API routes use service key)
-- No public access at all
CREATE POLICY "No public access to OTP codes"
  ON phone_otp_codes FOR ALL
  USING (false);

-- Cleanup: auto-delete expired codes (run via pg_cron or manual)
-- DELETE FROM phone_otp_codes WHERE expires_at < now() - interval '1 hour';
