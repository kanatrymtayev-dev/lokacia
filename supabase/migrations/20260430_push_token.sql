-- Add push token column for mobile notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
