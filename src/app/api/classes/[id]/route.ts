// ======================================================
// GET    /api/classes/[id]  — detail kelas
// PUT    /api/classes/[id]  — update kelas (staff only)
// DELETE /api/classes/[id]  — hapus kelas  (staff only)
// ======================================================
import { NextRequest } from "next/server"
import { ok, err, E, getAuthUser, getUserRole, isStaffRole } from "@/lib/apiHelpers"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"
import { z } from "zod"

const UpdateClassSchema = z.object({
  name:                   z.string().min(2).optional(),
  code:                   z.string().min(1).optional(),
  semester:               z.string().min(2).optional(),
  lecturer:               z.string().min(2).optional(),
  location:               z.string().min(2).optional(),
  total_sessions_planned: z.number().int().min(1).max(100).optional(),
  min_attendance_pct:     z.number().int().min(1).max(100).optional(),
  description:            z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const supabase = await createSupabaseServerClient()

  // Ambil kelas (RLS memastikan user terdaftar)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: kelas, error: kelasErr } = await (supabase as any)
    .from("classes")
    .select("*")
    .eq("id", id)
    .single() as { data: import("@/types/supabase").ClassRow | null; error: unknown }

  if (kelasErr || !kelas) return err(E.NOT_FOUND, "Kelas tidak ditemukan.", 404)

  // Ambil sesi kelas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("*")
    .eq("class_id", id)
    .order("session_date", { ascending: false }) as { data: import("@/types/supabase").SessionRow[] | null }

  // Hitung total enrollment
  const { count: enrollmentCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("class_id", id)

  // Ambil peran user di kelas ini
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myEnrollment } = await (supabase as any)
    .from("enrollments")
    .select("peran")
    .eq("class_id", id)
    .eq("user_id", user.id)
    .single() as { data: { peran: string } | null }

  return ok({
    ...kelas,
    sessions:         sessions ?? [],
    enrollment_count: enrollmentCount ?? 0,
    my_peran:         myEnrollment?.peran ?? null,
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const role = await getUserRole(user.id)
  if (!isStaffRole(role)) {
    return err(E.FORBIDDEN, "Hanya dosen atau asisten yang dapat mengedit kelas.", 403)
  }

  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Request body tidak valid.", 400)
  }

  const parsed = UpdateClassSchema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, "Data tidak valid.", 400, parsed.error.flatten())
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  const { data: updated, error: updateErr } = await service
    .from("classes")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (updateErr) {
    console.error("[classes PUT]", updateErr.message)
    return err(E.INTERNAL_ERROR, "Gagal memperbarui kelas.", 500)
  }

  return ok(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const role = await getUserRole(user.id)
  if (!isStaffRole(role)) {
    return err(E.FORBIDDEN, "Hanya dosen atau asisten yang dapat menghapus kelas.", 403)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  const { error: deleteErr } = await service
    .from("classes")
    .delete()
    .eq("id", id)

  if (deleteErr) {
    console.error("[classes DELETE]", deleteErr.message)
    return err(E.INTERNAL_ERROR, "Gagal menghapus kelas.", 500)
  }

  return ok({ id })
}
