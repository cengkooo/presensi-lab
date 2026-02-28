// ======================================================
// PATCH /api/classes/[id]/enrollments/[userId]
// Update peran mahasiswa di kelas (mahasiswa → asisten, dll)
// Auth: dosen kelas
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const schema = z.object({
  peran: z.enum(["mahasiswa", "asisten", "dosen"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: class_id, userId: target_user_id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const isDosen = await isDosenOfClass(user.id, class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa mengubah peran.", 403)

  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Input tidak valid.", 400)
  }

  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("enrollments")
    .update({ peran: parsed.data.peran })
    .eq("class_id", class_id)
    .eq("user_id", target_user_id)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") return err(E.NOT_FOUND, "Enrollment tidak ditemukan.", 404)
    console.error("[classes/enrollments PATCH]", error.message)
    return err(E.INTERNAL_ERROR, "Gagal mengubah peran.", 500)
  }

  return ok(data)
}
