// ======================================================
// POST /api/sessions/deactivate
// Nonaktifkan sesi absensi
// Auth: dosen yang mengaktifkan sesi, atau admin
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, getUserRole, isStaffRole } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

const schema = z.object({
  session_id: z.string().uuid("session_id harus berupa UUID"),
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

  const { session_id } = parsed.data

  // 3. Ambil sesi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceClient = createSupabaseServiceClient() as any
  const { data: session, error: sessionErr } = await serviceClient
    .from("sessions")
    .select("id, is_active, activated_by, class_id")
    .eq("id", session_id)
    .single()

  if (sessionErr || !session) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)
  if (!session.is_active)     return err(E.SESSION_INACTIVE, "Sesi sudah tidak aktif.", 400)

  // 4. Cek autoritas: harus staff DAN (yang mengaktifkan atau admin)
  const role = await getUserRole(user.id)
  const isStaff     = isStaffRole(role)
  const isActivator = session.activated_by === user.id
  const isAdmin     = role === "admin"

  if (!isStaff || (!isActivator && !isAdmin)) {
    return err(E.FORBIDDEN, "Hanya yang mengaktifkan sesi atau admin yang bisa menonaktifkan.", 403)
  }

  // 5. Nonaktifkan (service role)
  const { data, error: updateErr } = await serviceClient
    .from("sessions")
    .update({
      is_active:      false,
      deactivated_at: new Date().toISOString(),
    })
    .eq("id", session_id)
    .select()
    .single()

  if (updateErr) {
    console.error("[sessions/deactivate]", updateErr.message)
    return err(E.INTERNAL_ERROR, "Gagal menonaktifkan sesi.", 500)
  }

  return ok(data as object)
}
