// ======================================================
// GET /api/admin/users
// Daftar semua pengguna (profiles + email dari auth.users)
// Auth: dosen only
// Features:
//   - Menggabungkan profiles dengan email dari auth.users
//     (anon key tidak bisa baca auth.users, butuh service role)
//   - Auto-ekstrak NIM dari email Itera (@student.itera.ac.id)
//     Format: [nama].[NIM]@student.itera.ac.id
//     Jika profiles.nim null, simpan NIM yang diekstrak ke DB
// ======================================================
import { ok, err, E, getAuthUser, getUserRole } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

/** Ekstrak NIM dari email Itera. Contoh: andryano.123140205@student.itera.ac.id → "123140205" */
function extractNimFromEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const m = email.match(/\.(\d{6,12})@student\.itera\.ac\.id$/i)
  return m ? m[1] : null
}

export async function GET() {
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  const role = await getUserRole(user.id)
  if (role !== "dosen" && role !== "admin") {
    return err(E.FORBIDDEN, "Hanya dosen yang dapat mengakses daftar pengguna.", 403)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  // 1. Fetch semua profiles (mahasiswa + dosen)
  const { data: profileData, error: profErr } = await service
    .from("profiles")
    .select("id, full_name, nim, avatar_url, role")
    .in("role", ["mahasiswa", "dosen", "asisten"])
    .order("full_name", { ascending: true })

  if (profErr) {
    console.error("[admin/users] profiles query:", profErr.message)
    return err(E.INTERNAL_ERROR, "Gagal mengambil data pengguna.", 500)
  }

  const rows = (profileData ?? []) as {
    id: string
    full_name: string | null
    nim: string | null
    avatar_url: string | null
    role: string
  }[]

  if (rows.length === 0) return ok([])

  // 2. Fetch emails dari auth.users via admin API
  //    listUsers() max 1000 per page — iterate if needed
  let authUsers: { id: string; email?: string }[] = []
  let page = 1
  while (true) {
    const { data: { users }, error: authErr } = await service.auth.admin.listUsers({
      page, perPage: 1000,
    })
    if (authErr) {
      console.error("[admin/users] auth.admin.listUsers:", authErr.message)
      break
    }
    authUsers = authUsers.concat(users ?? [])
    if ((users ?? []).length < 1000) break
    page++
  }

  const emailMap = new Map<string, string>(
    authUsers
      .filter((u) => u.email)
      .map((u) => [u.id, u.email!])
  )

  // 3. Merge + auto-extract NIM from Itera email
  //    Collect IDs that need nim update
  const nimUpdates: { id: string; nim: string }[] = []

  const result = rows.map((p) => {
    const email = emailMap.get(p.id) ?? null
    let nim = p.nim

    // Auto-extract NIM if not set and email matches student pattern
    if (!nim && email) {
      const extracted = extractNimFromEmail(email)
      if (extracted) {
        nim = extracted
        nimUpdates.push({ id: p.id, nim: extracted })
      }
    }

    return { ...p, nim, email }
  })

  // 4. Persist extracted NIMs (fire-and-forget, don't block response)
  if (nimUpdates.length > 0) {
    Promise.all(
      nimUpdates.map(({ id, nim }) =>
        service.from("profiles").update({ nim }).eq("id", id)
      )
    ).catch((e: unknown) =>
      console.error("[admin/users] nim backfill:", e)
    )
  }

  return ok(result)
}
