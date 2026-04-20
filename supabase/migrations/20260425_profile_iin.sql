-- Add IIN field for individual hosts/renters
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS iin TEXT;
