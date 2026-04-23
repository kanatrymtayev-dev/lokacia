-- Security deposit for listings (host sets amount, 0 = no deposit)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS security_deposit INTEGER NOT NULL DEFAULT 0;
