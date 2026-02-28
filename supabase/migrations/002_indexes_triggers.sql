-- ======================================================
-- Migration 002: Indexes & Triggers
-- Run SETELAH migration 001
-- ======================================================

-- ── Indexes untuk query yang sering dipakai ───────────
CREATE INDEX IF NOT EXISTS idx_attendance_session_id   ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id      ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id       ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active      ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at     ON sessions(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id    ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id     ON enrollments(user_id);

-- ── Auto-update updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Auto-create profile saat user baru signup ─────────
-- Dipanggil via Supabase hook: Auth → Hooks → After user is created
-- Atau via trigger langsung pada auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ⚠️ Catatan: trigger pada auth.users hanya bisa dibuat oleh superuser.
-- Di Supabase, gunakan: Dashboard → Authentication → Hooks
-- Pilih "After user creation" → jalankan function `handle_new_user`
-- ATAU jalankan SQL berikut jika akun punya akses:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
