-- Promo codes for renter discounts
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL, -- 50 = 50% or 5000 = 5000 tg
  max_uses INTEGER, -- NULL = unlimited
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can check a promo code
CREATE POLICY "Authenticated can read promo codes"
  ON promo_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can create/update/delete
CREATE POLICY "Admin can manage promo codes"
  ON promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Track promo code usage in bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
