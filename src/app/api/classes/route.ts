// ======================================================
// GET /api/classes
// Ambil semua kelas yang diikuti user yang sedang login
// POST /api/classes
// Buat kelas baru (dosen only)
// ======================================================
import { ok, err, E, getAuthUser, getUserRole, isStaffRole } from "@/lib/apiHelpers"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"
import { z } from "zod"

const CreateClassSchema = z.object({
  name:                   z.string().min(2),
  code:                   z.string().min(1),
  semester:               z.string().min(2),
  lecturer:               z.string().min(2),
  location:               z.string().min(2),
  total_sessions_planned: z.number().int().min(1).max(100),
  min_attendance_pct:     z.number().int().min(1).max(100),
  description:            z.string().optional(),
})

export async function GET() {
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("enrollments")
    .select(`
      peran,
      joined_at,
      classes (
        id, code, name, semester, description, location,
        min_attendance_pct, total_sessions_planned, created_at
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false }) as { data: Array<{ peran: string; joined_at: string; classes: Record<string, unknown> | null }> | null; error: { message: string } | null }

  if (error) {
    console.error("[classes GET]", error.message)
    return err(E.INTERNAL_ERROR, "Gagal mengambil daftar kelas.", 500)
  }

  // Flatten: { ...class, peran, joined_at }
  const classes = (data ?? []).map((e) => ({
    ...(e.classes as object),
    peran:     e.peran,
    joined_at: e.joined_at,
  }))

  return ok(classes)
}

export async function POST(request: Request) {
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const role = await getUserRole(user.id)
  if (!isStaffRole(role)) {
    return err(E.FORBIDDEN, "Hanya dosen atau asisten yang dapat membuat kelas.", 403)
  }

  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Request body tidak valid.", 400)
  }

  const parsed = CreateClassSchema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, "Data tidak valid.", 400, parsed.error.flatten())
  }
  const { name, code, semester, lecturer, location, total_sessions_planned, min_attendance_pct, description } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  // Insert class
  const { data: kelas, error: insertErr } = await service
    .from("classes")
    .insert({
      name,
      code,
      semester,
      description: description ?? null,
      location,
      total_sessions_planned,
      min_attendance_pct,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertErr) {
    console.error("[classes POST]", insertErr.message)
    return err(E.INTERNAL_ERROR, "Gagal membuat kelas.", 500)
  }

  // Auto-enroll creator as dosen
  try {
    await service
      .from("enrollments")
      .insert({ class_id: kelas.id, user_id: user.id, peran: "dosen" })
  } catch {/* ignore duplicate */}

  return ok({ ...(kelas as object), dosen: lecturer }, 201)
}
