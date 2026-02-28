-- ================================================================
-- PRESENSLAB — TEST ACCOUNTS SETUP
-- Jalankan di Supabase SQL Editor (dengan service role)
-- ================================================================

-- ── 0. Perbaiki CHECK constraint profiles agar izinkan 'asisten' ─
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('mahasiswa', 'dosen', 'asisten', 'admin'));


-- ================================================================
-- 1. INSERT AUTH USERS
-- Password semua akun: Testing123!
-- ================================================================

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES
  -- ── 5 Mahasiswa ──
  (
    'aaaaaaaa-0001-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mahasiswa1@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Andi Pratama","nim":"120140001"}',
    now(), now(), '', '', '', ''
  ),
  (
    'aaaaaaaa-0002-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mahasiswa2@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Budi Santoso","nim":"120140002"}',
    now(), now(), '', '', '', ''
  ),
  (
    'aaaaaaaa-0003-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mahasiswa3@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Citra Dewi","nim":"120140003"}',
    now(), now(), '', '', '', ''
  ),
  (
    'aaaaaaaa-0004-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mahasiswa4@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dian Fitriani","nim":"120140004"}',
    now(), now(), '', '', '', ''
  ),
  (
    'aaaaaaaa-0005-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mahasiswa5@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Eko Wahyudi","nim":"120140005"}',
    now(), now(), '', '', '', ''
  ),
  -- ── 2 Asisten ──
  (
    'bbbbbbbb-0001-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'asisten1@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Fajar Nugraha","nim":"119140011"}',
    now(), now(), '', '', '', ''
  ),
  (
    'bbbbbbbb-0002-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'asisten2@student.itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Gita Rahayu","nim":"119140012"}',
    now(), now(), '', '', '', ''
  ),
  -- ── 1 Dosen ──
  (
    'cccccccc-0001-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'dosen@itera.ac.id',
    crypt('Testing123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Hendra Kusuma","nim":"197801012005011001"}',
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 2. INSERT PROFILES
-- ================================================================

INSERT INTO profiles (id, full_name, nim, role)
VALUES
  ('aaaaaaaa-0001-0000-0000-000000000000', 'Andi Pratama',            '120140001',        'mahasiswa'),
  ('aaaaaaaa-0002-0000-0000-000000000000', 'Budi Santoso',            '120140002',        'mahasiswa'),
  ('aaaaaaaa-0003-0000-0000-000000000000', 'Citra Dewi',              '120140003',        'mahasiswa'),
  ('aaaaaaaa-0004-0000-0000-000000000000', 'Dian Fitriani',           '120140004',        'mahasiswa'),
  ('aaaaaaaa-0005-0000-0000-000000000000', 'Eko Wahyudi',             '120140005',        'mahasiswa'),
  ('bbbbbbbb-0001-0000-0000-000000000000', 'Fajar Nugraha',           '119140011',        'asisten'),
  ('bbbbbbbb-0002-0000-0000-000000000000', 'Gita Rahayu',             '119140012',        'asisten'),
  ('cccccccc-0001-0000-0000-000000000000', 'Dr. Hendra Kusuma',       '197801012005011001','dosen')
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      nim       = EXCLUDED.nim,
      role      = EXCLUDED.role;


-- ================================================================
-- 3. SAMPLE CLASS + ENROLLMENTS (opsional, bisa dihapus)
-- ================================================================

INSERT INTO classes (id, code, name, semester, location, min_attendance_pct, total_sessions_planned, created_by)
VALUES (
  'dddddddd-0001-0000-0000-000000000000',
  'IF2210-A',
  'Praktikum Algoritma & Struktur Data',
  'Genap 2025/2026',
  'Lab Komputasi Lt. 2',
  75,
  14,
  'cccccccc-0001-0000-0000-000000000000'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (class_id, user_id, peran)
VALUES
  -- Dosen
  ('dddddddd-0001-0000-0000-000000000000', 'cccccccc-0001-0000-0000-000000000000', 'dosen'),
  -- Asisten
  ('dddddddd-0001-0000-0000-000000000000', 'bbbbbbbb-0001-0000-0000-000000000000', 'asisten'),
  ('dddddddd-0001-0000-0000-000000000000', 'bbbbbbbb-0002-0000-0000-000000000000', 'asisten'),
  -- Mahasiswa
  ('dddddddd-0001-0000-0000-000000000000', 'aaaaaaaa-0001-0000-0000-000000000000', 'mahasiswa'),
  ('dddddddd-0001-0000-0000-000000000000', 'aaaaaaaa-0002-0000-0000-000000000000', 'mahasiswa'),
  ('dddddddd-0001-0000-0000-000000000000', 'aaaaaaaa-0003-0000-0000-000000000000', 'mahasiswa'),
  ('dddddddd-0001-0000-0000-000000000000', 'aaaaaaaa-0004-0000-0000-000000000000', 'mahasiswa'),
  ('dddddddd-0001-0000-0000-000000000000', 'aaaaaaaa-0005-0000-0000-000000000000', 'mahasiswa')
ON CONFLICT (class_id, user_id) DO NOTHING;