-- Track whether user completed onboarding wizard
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Existing users are considered onboarded
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed = false;
