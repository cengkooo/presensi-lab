-- ================================================================
-- Migration 005: RLS Recursion Fix + Schema Corrections
-- Jalankan di Supabase SQL Editor (dengan service role)
--
-- Masalah yang diperbaiki:
-- 1. RLS infinite recursion: enrollments/profiles policy baca tabel diri sendiri
-- 2. profiles CHECK constraint belum include 'asisten'
-- 3. sessions insert/update policy tidak include 'asisten'
-- 4. Tambah foreign key profiles ← attendance.user_id untuk PostgREST join
-- ================================================================


-- ================================================================
-- BAGIAN 1: HELPER FUNCTIONS (Security Definer)
-- Fungsi-fungsi ini berjalan sebagai postgres (bypass RLS),
-- sehingga tidak memicu recursive policy evaluation
-- ================================================================

-- Cek apakah user yang sedang login adalah staff (dosen/asisten/admin)
CREATE OR REPLACE FUNCTION auth_user_is_staff()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('dosen', 'asisten', 'admin')
  );
$$;

-- Cek apakah user yang sedang login adalah staff di kelas tertentu
CREATE OR REPLACE FUNCTION is_class_staff(p_class_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE class_id = p_class_id
      AND user_id = auth.uid()
      AND peran IN ('dosen', 'asisten')
  );
$$;

-- Cek apakah user yang sedang login terdaftar di kelas tertentu
CREATE OR REPLACE FUNCTION is_enrolled_in_class(p_class_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE class_id = p_class_id
      AND user_id = auth.uid()
  );
$$;


-- ================================================================
-- BAGIAN 2: FIX profiles CHECK CONSTRAINT (tambah 'asisten')
-- ================================================================
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('mahasiswa', 'dosen', 'asisten', 'admin'));


-- ================================================================
-- BAGIAN 3: FIX RLS POLICIES — PROFILES
-- Ganti policy yang baca profiles dari dalam profiles (recursion)
-- ================================================================
DROP POLICY IF EXISTS "profiles: dosen can read all" ON profiles;

CREATE POLICY "profiles: staff can read all"
  ON profiles FOR SELECT
  USING (auth_user_is_staff());


-- ================================================================
-- BAGIAN 4: FIX RLS POLICIES — ENROLLMENTS
-- Ganti policy yang baca enrollments dari dalam enrollments (recursion)
-- ================================================================
DROP POLICY IF EXISTS "enrollments: dosen can read class" ON enrollments;

CREATE POLICY "enrollments: staff can read class"
  ON enrollments FOR SELECT
  USING (is_class_staff(class_id));


-- ================================================================
-- BAGIAN 5: FIX RLS POLICIES — SESSIONS (tambah asisten)
-- ================================================================
DROP POLICY IF EXISTS "sessions: dosen can insert" ON sessions;
DROP POLICY IF EXISTS "sessions: dosen can update" ON sessions;

CREATE POLICY "sessions: staff can insert"
  ON sessions FOR INSERT
  WITH CHECK (is_class_staff(class_id));

CREATE POLICY "sessions: staff can update"
  ON sessions FOR UPDATE
  USING (is_class_staff(class_id));


-- ================================================================
-- BAGIAN 6: FK attendance → profiles
-- Tambah FK agar PostgREST bisa join attendance → profiles(full_name, nim)
-- (saat ini hanya ada FK attendance.user_id → auth.users.id)
-- ================================================================

-- Cek apakah FK sudah ada, baru tambahkan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'attendance'
      AND constraint_name = 'attendance_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE attendance
      ADD CONSTRAINT attendance_user_id_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;


-- ================================================================
-- VERIFIKASI (opsional — jalankan untuk cek)
-- ================================================================
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
-- AND routine_name IN ('auth_user_is_staff', 'is_class_staff', 'is_enrolled_in_class');
