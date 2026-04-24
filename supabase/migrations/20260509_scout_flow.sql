-- Scout flow: host invites renter to visit location before booking
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS scout_status TEXT DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS scout_date DATE DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS scout_time TEXT DEFAULT NULL;

-- scout_status: null → invited → visited/declined
