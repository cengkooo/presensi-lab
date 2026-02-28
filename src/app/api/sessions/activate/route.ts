// ======================================================
// POST /api/sessions/activate
// Aktifkan absensi untuk sesi tertentu
// Auth: dosen/asisten kelas tersebut
// Gunakan service_role untuk bypass RLS pada is_active
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

const schema = z.object({
  session_id:       z.string().uuid("session_id harus berupa UUID"),
  lat:              z.number({ error: "lat wajib diisi" }),
  lng:              z.number({ error: "lng wajib diisi" }),
  radius_meter:     z.number().min(10).max(1000).default(100),
  duration_minutes: z.number().min(5).max(480).default(30),
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

  const { session_id, lat, lng, radius_meter, duration_minutes } = parsed.data

  // 3. Ambil sesi — pastikan ada dan ambil class_id-nya
  const serviceClient = createSupabaseServiceClient()
  const { data: session, error: sessionErr } = await serviceClient
    .from("sessions")
    .select("id, class_id, is_active")
    .eq("id", session_id)
    .single()

  if (sessionErr || !session) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)

  // 4. Cek user adalah dosen/asisten di kelas ini
  const isDosen = await isDosenOfClass(user.id, session.class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa mengaktifkan absensi.", 403)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + duration_minutes * 60 * 1000).toISOString()

  // 5. Nonaktifkan semua sesi aktif lain di kelas yang sama (service role)
  await serviceClient
    .from("sessions")
    .update({ is_active: false, deactivated_at: now.toISOString() })
    .eq("class_id", session.class_id)
    .eq("is_active", true)
    .neq("id", session_id)

  // 6. Aktifkan sesi ini
  const { data, error: updateErr } = await serviceClient
    .from("sessions")
    .update({
      is_active:     true,
      lat,
      lng,
      radius_meter,
      expires_at:    expiresAt,
      activated_by:  user.id,
      activated_at:  now.toISOString(),
      deactivated_at: null,
    })
    .eq("id", session_id)
    .select()
    .single()

  if (updateErr) {
    console.error("[sessions/activate]", updateErr.message)
    return err(E.INTERNAL_ERROR, "Gagal mengaktifkan sesi.", 500)
  }

  return ok(data)
}
