-- Listing moderation: new listings require admin approval before appearing in catalog

ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('pending_review', 'approved', 'rejected'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_note TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Existing listings are already approved (they were published without moderation)
-- New listings will be created with moderation_status = 'pending_review' by application code

CREATE INDEX IF NOT EXISTS idx_listings_moderation ON listings(moderation_status);
