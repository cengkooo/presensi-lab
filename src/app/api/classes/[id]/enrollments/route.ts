// ======================================================
// GET /api/classes/[id]/enrollments
// List semua mahasiswa yang terdaftar di kelas
// Auth: dosen/asisten kelas
// ======================================================
import { NextRequest } from "next/server"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: class_id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const isDosen = await isDosenOfClass(user.id, class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa melihat daftar mahasiswa.", 403)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id, peran, joined_at,
      profiles ( id, full_name, nim, avatar_url, role )
    `)
    .eq("class_id", class_id)
    .order("joined_at", { ascending: true })

  if (error) {
    console.error("[classes/enrollments GET]", error.message)
    return err(E.INTERNAL_ERROR, "Gagal mengambil daftar mahasiswa.", 500)
  }

  return ok(data ?? [])
}
