-- Host payout details (bank card/account for receiving payments)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_method TEXT; -- 'kaspi', 'halyk', 'freedom', 'bank_transfer'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_details TEXT; -- phone number for Kaspi/Halyk or IBAN
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_holder_name TEXT; -- card/account holder name
