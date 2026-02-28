-- ======================================================
-- Migration 003: Row Level Security (RLS)
-- Run SETELAH migration 001 & 002
-- KRITIS — jangan skip ini
-- ======================================================

-- ── Enable RLS pada semua tabel ──────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance  ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- PROFILES
-- ==================================================
-- User bisa baca profil sendiri
CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- User bisa update profil sendiri
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Dosen/admin bisa baca semua profil (untuk keperluan dashboard)
CREATE POLICY "profiles: dosen can read all"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('dosen', 'admin')
    )
  );

-- ==================================================
-- CLASSES
-- ==================================================
-- User yang terdaftar di kelas bisa baca kelas tersebut
CREATE POLICY "classes: enrolled users can read"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = classes.id AND e.user_id = auth.uid()
    )
  );

-- Dosen/admin bisa buat kelas baru
CREATE POLICY "classes: dosen can insert"
  ON classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('dosen', 'admin')
    )
  );

-- Pembuat kelas atau admin bisa update
CREATE POLICY "classes: creator or admin can update"
  ON classes FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Pembuat kelas atau admin bisa delete
CREATE POLICY "classes: creator or admin can delete"
  ON classes FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ==================================================
-- ENROLLMENTS
-- ==================================================
-- User bisa baca enrollment milik sendiri
CREATE POLICY "enrollments: read own"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid());

-- Dosen/asisten kelas bisa baca semua enrollment di kelasnya
CREATE POLICY "enrollments: dosen can read class"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e2
      WHERE e2.class_id = enrollments.class_id
        AND e2.user_id = auth.uid()
        AND e2.peran IN ('dosen', 'asisten')
    )
  );

-- Hanya dosen/admin yang bisa insert/update/delete enrollment
CREATE POLICY "enrollments: dosen can manage"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e2
      WHERE e2.class_id = enrollments.class_id
        AND e2.user_id = auth.uid()
        AND e2.peran = 'dosen'
    ) OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ==================================================
-- SESSIONS
-- ==================================================
-- User terdaftar di kelas bisa baca sesi kelas tersebut
CREATE POLICY "sessions: enrolled users can read"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = sessions.class_id AND e.user_id = auth.uid()
    )
  );

-- Dosen kelas bisa insert sesi baru
CREATE POLICY "sessions: dosen can insert"
  ON sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = sessions.class_id
        AND e.user_id = auth.uid()
        AND e.peran = 'dosen'
    )
  );

-- Dosen kelas bisa update sesi (field non-kritis)
-- is_active, activated_by, dll hanya boleh diubah via service_role (API route server-side)
CREATE POLICY "sessions: dosen can update"
  ON sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = sessions.class_id
        AND e.user_id = auth.uid()
        AND e.peran = 'dosen'
    )
  );

-- ==================================================
-- ATTENDANCE
-- ==================================================
-- User bisa baca rekap absensi milik sendiri
CREATE POLICY "attendance: read own"
  ON attendance FOR SELECT
  USING (user_id = auth.uid());

-- Dosen kelas bisa baca semua attendance di kelasnya
CREATE POLICY "attendance: dosen can read class"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN enrollments e ON e.class_id = s.class_id
      WHERE s.id = attendance.session_id
        AND e.user_id = auth.uid()
        AND e.peran IN ('dosen', 'asisten')
    )
  );

-- Mahasiswa bisa insert attendance milik sendiri
-- (validasi koordinat, duplikat, dll dilakukan di API route — ini hanya gate terakhir)
CREATE POLICY "attendance: user can insert own"
  ON attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Tidak ada UPDATE/DELETE dari client — hanya service_role via API route
-- (ini otomatis jika tidak ada policy untuk UPDATE/DELETE)
