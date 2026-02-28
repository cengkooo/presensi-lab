-- ================================================================
-- Migration 008: Add FK enrollments.user_id → profiles.id
-- Diperlukan agar PostgREST bisa join enrollments → profiles
-- (sebelumnya hanya attendance yang punya FK ke profiles)
--
-- Jalankan di Supabase SQL Editor
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'enrollments'
      AND constraint_name = 'enrollments_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE enrollments
      ADD CONSTRAINT enrollments_user_id_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;
