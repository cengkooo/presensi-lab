-- ================================================================
-- Migration 007: Fix enrollments RLS infinite-recursion (FOR ALL)
-- Jalankan di Supabase SQL Editor (dengan service role)
--
-- Masalah:
--   Policy "enrollments: dosen can manage" menggunakan FOR ALL dengan
--   USING clause yang query ke tabel enrollments itu sendiri:
--     EXISTS (SELECT 1 FROM enrollments e2 WHERE ...)
--   Karena FOR ALL juga berlaku untuk SELECT, evaluasi policy ini
--   memicu RLS enrollments lagi → infinite recursion → 500 di semua tabel
--   yang join/subquery ke enrollments (sessions, classes, attendance, dll).
--
-- Fix:
--   Ganti satu policy FOR ALL dengan tiga policy SECURITY DEFINER
--   untuk INSERT, UPDATE, DELETE secara terpisah menggunakan
--   fungsi is_class_staff() yang sudah ada dari migration 005.
-- ================================================================


-- ── Hapus policy lama yang FOR ALL (penyebab recursion) ──────────
DROP POLICY IF EXISTS "enrollments: dosen can manage" ON enrollments;


-- ── Buat policy terpisah per operasi (tidak recursive) ───────────

-- Staff kelas (dosen/asisten) bisa menambah enrollment di kelasnya
-- Pakai is_class_staff() SECURITY DEFINER agar tidak ada recursion
CREATE POLICY "enrollments: staff can insert"
  ON enrollments FOR INSERT
  WITH CHECK (
    is_class_staff(class_id) OR
    auth_user_is_staff()
  );

-- Staff kelas bisa update enrollment
CREATE POLICY "enrollments: staff can update"
  ON enrollments FOR UPDATE
  USING (is_class_staff(class_id))
  WITH CHECK (is_class_staff(class_id));

-- Staff kelas bisa delete enrollment
CREATE POLICY "enrollments: staff can delete"
  ON enrollments FOR DELETE
  USING (is_class_staff(class_id));


-- ── Verifikasi: list semua policy yang aktif di enrollments ──────
-- (opsional, jalankan untuk cek)
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'enrollments'
-- ORDER BY policyname;
