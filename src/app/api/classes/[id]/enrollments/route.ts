// ======================================================
// GET /api/classes/[id]/enrollments
// List semua mahasiswa yang terdaftar di kelas
// Auth: dosen/asisten kelas
// ======================================================
import { NextRequest } from "next/server"
import { ok, err, E, getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: class_id } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const isDosen = await isDosenOfClass(user.id, class_id)
  if (!isDosen) return err(E.FORBIDDEN, "Hanya dosen kelas ini yang bisa melihat daftar mahasiswa.", 403)

  // Service role — bypass RLS; dua query terpisah agar tidak butuh FK ke profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseServiceClient() as any

  // 1. Ambil semua enrollment di kelas ini
  const { data: enrollData, error: enrollError } = await supabase
    .from("enrollments")
    .select("id, user_id, peran, joined_at")
    .eq("class_id", class_id)
    .order("joined_at", { ascending: true })

  if (enrollError) {
    console.error("[classes/enrollments GET] enrollments query:", enrollError.message)
    return err(E.INTERNAL_ERROR, "Gagal mengambil daftar mahasiswa.", 500)
  }

  const rows = (enrollData ?? []) as { id: string; user_id: string; peran: string; joined_at: string }[]
  if (rows.length === 0) return ok([])

  // 2. Ambil profil untuk user_id yang terdaftar
  const userIds = rows.map((r) => r.user_id)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, nim, avatar_url, role")
    .in("id", userIds)

  if (profileError) {
    console.error("[classes/enrollments GET] profiles query:", profileError.message)
    return err(E.INTERNAL_ERROR, "Gagal mengambil profil mahasiswa.", 500)
  }

  const profileMap = new Map<string, { id: string; full_name: string | null; nim: string | null; avatar_url: string | null; role: string }>(
    ((profileData ?? []) as { id: string; full_name: string | null; nim: string | null; avatar_url: string | null; role: string }[])
      .map((p) => [p.id, p])
  )

  // 3. Gabungkan enrollment + profil
  const result = rows.map((r) => ({
    id: r.id,
    peran: r.peran,
    joined_at: r.joined_at,
    profiles: profileMap.get(r.user_id) ?? null,
  }))

  return ok(result)
}
