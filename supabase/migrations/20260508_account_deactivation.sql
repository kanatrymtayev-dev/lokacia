-- Account deactivation (soft delete)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivation_reason TEXT DEFAULT NULL;

-- Function to deactivate own account
CREATE OR REPLACE FUNCTION deactivate_account(reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Mark profile as deactivated
  UPDATE profiles
  SET deactivated_at = now(),
      deactivation_reason = reason
  WHERE id = uid;

  -- Deactivate all listings
  UPDATE listings
  SET status = 'inactive'
  WHERE host_id = uid AND status = 'active';

  -- Cancel future pending/confirmed bookings (as renter)
  UPDATE bookings
  SET status = 'cancelled'
  WHERE renter_id = uid
    AND status IN ('pending', 'confirmed')
    AND date > CURRENT_DATE;

  -- Cancel future pending/confirmed bookings (as host)
  UPDATE bookings
  SET status = 'cancelled'
  WHERE listing_id IN (SELECT id FROM listings WHERE host_id = uid)
    AND status IN ('pending', 'confirmed')
    AND date > CURRENT_DATE;
END;
$$;

-- Function to reactivate account (admin use)
CREATE OR REPLACE FUNCTION reactivate_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE profiles
  SET deactivated_at = NULL,
      deactivation_reason = NULL
  WHERE id = target_user_id;

  -- Reactivate listings that were deactivated
  UPDATE listings
  SET status = 'active'
  WHERE host_id = target_user_id AND status = 'inactive';
END;
$$;
