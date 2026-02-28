// ======================================================
// GET /api/classes/[id]
// Detail kelas + sesi + enrollment count
// ======================================================
import { NextRequest } from "next/server"
import { ok, err, E, getAuthUser } from "@/lib/apiHelpers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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
