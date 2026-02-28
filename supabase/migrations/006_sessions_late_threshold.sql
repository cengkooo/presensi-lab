-- ================================================================
-- Migration 006: Tambah kolom late_after_minutes di sessions
-- Digunakan untuk menentukan batas waktu "telat" saat check-in.
-- NULL = tidak ada batas telat (semua check-in dianggap "hadir")
-- ================================================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS late_after_minutes INTEGER DEFAULT NULL;

COMMENT ON COLUMN sessions.late_after_minutes IS
  'Menit setelah sesi diaktifkan yang dianggap "telat". NULL = tidak ada batas telat.';
