-- Extend host_verifications to support all users (renters too) and companies
-- We add new columns rather than renaming host_id to avoid breaking existing data

-- Add user_id as alias column (same as host_id, for new code)
-- We'll keep host_id for backwards compat and add user_id as a generated column
ALTER TABLE host_verifications ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'individual'
  CHECK (entity_type IN ('individual', 'company'));

ALTER TABLE host_verifications ADD COLUMN IF NOT EXISTS iin TEXT;
ALTER TABLE host_verifications ADD COLUMN IF NOT EXISTS company_bin TEXT;
ALTER TABLE host_verifications ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE host_verifications ADD COLUMN IF NOT EXISTS company_doc_url TEXT; -- свидетельство о регистрации
ALTER TABLE host_verifications ADD COLUMN IF NOT EXISTS user_role TEXT; -- 'host' or 'renter' at time of submission

-- Update RLS policies to allow renters too (not just hosts)
-- Drop old policies and recreate with auth.uid() = host_id (host_id IS the user_id)
DROP POLICY IF EXISTS hv_select_own_or_admin ON host_verifications;
CREATE POLICY hv_select_own_or_admin ON host_verifications
  FOR SELECT USING (
    auth.uid() = host_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS hv_insert_own ON host_verifications;
CREATE POLICY hv_insert_own ON host_verifications
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS hv_update_own_or_admin ON host_verifications;
CREATE POLICY hv_update_own_or_admin ON host_verifications
  FOR UPDATE USING (
    auth.uid() = host_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Update trigger to also sync iin/company_bin to profiles when verified
CREATE OR REPLACE FUNCTION public.sync_id_verified()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
     SET id_verified = (new.status = 'verified'),
         iin = CASE WHEN new.status = 'verified' AND new.entity_type = 'individual' THEN new.iin ELSE profiles.iin END,
         company_bin = CASE WHEN new.status = 'verified' AND new.entity_type = 'company' THEN new.company_bin ELSE profiles.company_bin END,
         company_name = CASE WHEN new.status = 'verified' AND new.entity_type = 'company' THEN new.company_name ELSE profiles.company_name END
   WHERE id = new.host_id;
  RETURN new;
END $$ LANGUAGE plpgsql SECURITY DEFINER;
