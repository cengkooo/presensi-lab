// ======================================================
// POST /api/sessions/extend
// Perpanjang waktu sesi aktif
// Auth: dosen yang mengaktifkan, atau admin
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, getUserRole } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

const schema = z.object({
  session_id:      z.string().uuid("session_id harus berupa UUID"),
  extend_minutes:  z.number().min(1).max(120),
})

export async function POST(request: NextRequest) {
  // 1. Auth check
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  // 2. Validate body
  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Input tidak valid.", 400)
  }

  const { session_id, extend_minutes } = parsed.data

  // 3. Ambil sesi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceClient = createSupabaseServiceClient() as any
  const { data: session, error: sessionErr } = await serviceClient
    .from("sessions")
    .select("id, is_active, expires_at, activated_by")
    .eq("id", session_id)
    .single()

  if (sessionErr || !session) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)
  if (!session.is_active)     return err(E.SESSION_INACTIVE, "Sesi tidak aktif, tidak bisa diperpanjang.", 400)

  // 4. Cek autoritas
  const role = await getUserRole(user.id)
  const isActivator = session.activated_by === user.id
  if (!isActivator && role !== "admin") {
    return err(E.FORBIDDEN, "Hanya yang mengaktifkan sesi atau admin yang bisa memperpanjang.", 403)
  }

  // 5. Hitung expires_at baru (dari expires_at saat ini, bukan dari now())
  const currentExpiry = session.expires_at ? new Date(session.expires_at) : new Date()
  const newExpiry = new Date(currentExpiry.getTime() + extend_minutes * 60 * 1000).toISOString()

  // 6. Update
  const { data, error: updateErr } = await serviceClient
    .from("sessions")
    .update({ expires_at: newExpiry })
    .eq("id", session_id)
    .select()
    .single()

  if (updateErr) {
    console.error("[sessions/extend]", updateErr.message)
    return err(E.INTERNAL_ERROR, "Gagal memperpanjang sesi.", 500)
  }

  return ok({ ...(data as object), extended_by_minutes: extend_minutes })
}
