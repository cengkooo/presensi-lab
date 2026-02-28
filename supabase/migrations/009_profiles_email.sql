-- ======================================================
-- Migration 009: Add email column to profiles
-- Syncs email from auth.users via trigger so it can be
-- read from the public.profiles table (no RLS bypass needed).
-- ======================================================

-- 1. Add the column (nullable to handle existing rows)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill from auth.users for all existing rows
UPDATE profiles p
SET    email = u.email
FROM   auth.users u
WHERE  p.id = u.id
  AND  p.email IS NULL;

-- 3. Trigger function: keep profiles.email in sync when auth.users changes
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET    email = NEW.email
  WHERE  id = NEW.id;
  RETURN NEW;
END;
$$;

-- 4. Attach trigger to auth.users (INSERT + UPDATE of email)
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_email();
