-- Host discounts on specific dates
CREATE TABLE IF NOT EXISTS listing_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 5 AND discount_percent <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, start_date, end_date)
);

CREATE INDEX IF NOT EXISTS idx_listing_discounts_listing ON listing_discounts(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_discounts_dates ON listing_discounts(start_date, end_date);

ALTER TABLE listing_discounts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read discounts (for catalog/booking)
CREATE POLICY "Anyone can read listing discounts"
  ON listing_discounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Host can manage own listing discounts
CREATE POLICY "Host can insert own listing discounts"
  ON listing_discounts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = auth.uid())
  );

CREATE POLICY "Host can delete own listing discounts"
  ON listing_discounts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = auth.uid())
  );
