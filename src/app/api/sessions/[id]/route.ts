// ======================================================
// PATCH /api/sessions/[id] — Edit detail sesi
// DELETE /api/sessions/[id] — Hapus sesi (hanya jika tidak aktif)
// Auth: dosen/asisten kelas
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

// ── PATCH ──────────────────────────────────────────────
const patchSchema = z.object({
  title:        z.string().min(1, "Judul tidak boleh kosong.").optional(),
  description:  z.string().nullable().optional(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD").optional(),
  location:     z.string().nullable().optional(),
  radius_meter: z.number().int().min(10).max(5000).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: session_id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Input tidak valid.", 400)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  // Ambil session untuk cek class_id
  const { data: sess, error: fetchErr } = await service
    .from("sessions")
    .select("id, class_id")
    .eq("id", session_id)
    .single()

  if (fetchErr || !sess) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)

  const isDosen = await isDosenOfClass(user.id, sess.class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa mengedit sesi.", 403)

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }

  const { data, error: updateErr } = await service
    .from("sessions")
    .update(updates)
    .eq("id", session_id)
    .select()
    .single()

  if (updateErr) {
    console.error("[sessions PATCH]", updateErr.message)
    return err(E.INTERNAL_ERROR, "Gagal memperbarui sesi.", 500)
  }

  return ok(data)
}

// ── DELETE ─────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: session_id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  // Ambil session untuk cek class_id dan status
  const { data: sess, error: fetchErr } = await service
    .from("sessions")
    .select("id, class_id, is_active, title")
    .eq("id", session_id)
    .single()

  if (fetchErr || !sess) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)

  if (sess.is_active) {
    return err(E.FORBIDDEN, "Sesi masih aktif. Nonaktifkan terlebih dahulu sebelum menghapus.", 400)
  }

  const isDosen = await isDosenOfClass(user.id, sess.class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa menghapus sesi.", 403)

  const { error: deleteErr } = await service
    .from("sessions")
    .delete()
    .eq("id", session_id)

  if (deleteErr) {
    console.error("[sessions DELETE]", deleteErr.message)
    return err(E.INTERNAL_ERROR, "Gagal menghapus sesi.", 500)
  }

  return ok({ deleted: true, session_id })
}
