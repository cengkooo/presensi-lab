-- ======================================================
-- Migration 001: Core Tables
-- PresensLab — Run di Supabase SQL Editor
-- ======================================================

-- ── 1. profiles (extend auth.users) ─────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  nim         text UNIQUE,          -- NIM mahasiswa / NIP dosen
  avatar_url  text,
  role        text NOT NULL DEFAULT 'mahasiswa'
                   CHECK (role IN ('mahasiswa', 'dosen', 'admin')),
  updated_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Extended user data, linked 1:1 with auth.users';

-- ── 2. classes (kelas praktikum) ─────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  text NOT NULL UNIQUE,   -- cth: IF2210-A
  name                  text NOT NULL,          -- cth: Praktikum Alstrukdat
  semester              text,                   -- cth: Genap 2025/2026
  description           text,
  location              text,
  min_attendance_pct    int NOT NULL DEFAULT 75,
  total_sessions_planned int NOT NULL DEFAULT 0,
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now()
);

-- ── 3. enrollments (mahasiswa terdaftar di kelas) ─────
CREATE TABLE IF NOT EXISTS enrollments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peran      text NOT NULL DEFAULT 'mahasiswa'
             CHECK (peran IN ('mahasiswa', 'asisten', 'dosen')),
  joined_at  timestamptz DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- ── 4. sessions (sesi absensi) ───────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title             text NOT NULL,       -- cth: Sesi 3 — Sorting Algorithm
  description       text,
  session_date      date NOT NULL,
  location          text,
  -- Geolocation & activation
  is_active         boolean NOT NULL DEFAULT false,
  lat               float8,
  lng               float8,
  radius_meter      int NOT NULL DEFAULT 100,
  expires_at        timestamptz,
  activated_by      uuid REFERENCES auth.users(id),
  activated_at      timestamptz,
  deactivated_at    timestamptz,
  -- Audit
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── 5. attendance (rekap absensi) ────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Geolocation
  student_lat          float8,
  student_lng          float8,
  distance_meter       float8,
  -- Status
  status               text NOT NULL DEFAULT 'hadir'
                        CHECK (status IN ('hadir', 'telat', 'absen', 'ditolak')),
  rejected_reason      text,
  is_manual_override   boolean NOT NULL DEFAULT false,
  -- Audit
  checked_in_at        timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

COMMENT ON TABLE attendance IS 'One row per student per session. UNIQUE constraint prevents duplicate check-in.';
