-- Add email_notifications preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;
