// ======================================================
// PATCH /api/attendance/override
// Manual override kehadiran oleh dosen/asisten
// Body: { user_id, session_id, status: "hadir"|"telat"|"absen"|"ditolak"|"" }
//   status "" / null → hapus record (jadikan "belum ada data")
//   status lain     → upsert dengan is_manual_override = true
// Auth: dosen/asisten kelas yang memiliki sesi ini
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

// Format-only UUID regex — Zod v4's .uuid() enforces RFC 4122 version/variant
// bits which rejects manually-inserted IDs (e.g. version 0). Use a looser regex
// that only checks the 8-4-4-4-12 hex format.
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const schema = z.object({
  user_id:    z.string().regex(UUID_FORMAT, "Invalid UUID format"),
  session_id: z.string().regex(UUID_FORMAT, "Invalid UUID format"),
  status:     z.enum(["hadir", "telat", "absen", "ditolak", ""]),
})

export async function PATCH(request: NextRequest) {
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path?.length ? `'${issue.path.join(".")}'` : null
    const msg = field ? `${field}: ${issue?.message}` : (issue?.message ?? "Input tidak valid.")
    console.error("[attendance/override] Validation error:", parsed.error.issues)
    return err(E.VALIDATION_ERROR, msg, 400)
  }

  const { user_id, session_id, status } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  // Ambil class_id dari session
  const { data: sess, error: sessErr } = await service
    .from("sessions")
    .select("class_id")
    .eq("id", session_id)
    .single()

  if (sessErr || !sess) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)

  // Cek otoritas: harus dosen atau asisten kelas ini
  const isDosen = await isDosenOfClass(user.id, sess.class_id)
  if (!isDosen) {
    return err(E.FORBIDDEN, "Hanya dosen/asisten kelas ini yang bisa mengubah kehadiran.", 403)
  }

  // status kosong → hapus record (kembalikan ke "belum ada data")
  if (!status) {
    const { error: delErr } = await service
      .from("attendance")
      .delete()
      .eq("user_id", user_id)
      .eq("session_id", session_id)

    if (delErr) {
      console.error("[attendance/override DELETE]", delErr.message)
      return err(E.INTERNAL_ERROR, "Gagal menghapus data kehadiran.", 500)
    }
    return ok({ status: null })
  }

  // status ada → upsert
  const { data, error: upsertErr } = await service
    .from("attendance")
    .upsert(
      {
        user_id,
        session_id,
        status,
        is_manual_override: true,
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" }
    )
    .select("id, status, is_manual_override")
    .single()

  if (upsertErr) {
    console.error("[attendance/override UPSERT]", upsertErr.message)
    return err(E.INTERNAL_ERROR, "Gagal menyimpan kehadiran.", 500)
  }

  return ok({ status: data.status, is_manual_override: data.is_manual_override })
}
