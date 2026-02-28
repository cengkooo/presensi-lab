// ======================================================
// POST /api/sessions/create
// Buat sesi praktikum baru
// Auth: dosen/admin, terdaftar di kelas tersebut
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const schema = z.object({
  class_id:     z.string().uuid("class_id harus berupa UUID"),
  title:        z.string().min(3, "Judul minimal 3 karakter"),
  description:  z.string().optional(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  location:     z.string().optional(),
})

export async function POST(request: NextRequest) {
  // 1. Auth check
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  // 2. Parse & validate body
  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Input tidak valid.", 400, parsed.error.issues)
  }

  const { class_id, title, description, session_date, location } = parsed.data

  // 3. Cek user adalah dosen di kelas ini
  const isDosen = await isDosenOfClass(user.id, class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa membuat sesi.", 403)

  // 4. Insert
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("sessions")
    .insert({
      class_id, title, description, session_date, location,
      created_by: user.id,
    })
    .select()
    .single() as { data: import("@/types/supabase").SessionRow | null; error: { message: string } | null }

  if (error) {
    console.error("[sessions/create]", error.message)
    return err(E.INTERNAL_ERROR, "Gagal membuat sesi.", 500)
  }

  return ok(data, 201)
}
