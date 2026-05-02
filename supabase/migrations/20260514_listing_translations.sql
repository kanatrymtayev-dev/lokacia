-- Add translation columns to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_kz TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_kz TEXT,
  ADD COLUMN IF NOT EXISTS amenities_en TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities_kz TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules_en TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules_kz TEXT[] DEFAULT '{}';
