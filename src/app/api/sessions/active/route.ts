// ======================================================
// GET /api/sessions/active
// Ambil sesi aktif yang belum expired
// Auth: semua user yang login (mahasiswa juga bisa)
// ======================================================
import { NextResponse } from "next/server"
import { ok, err, E, getAuthUser } from "@/lib/apiHelpers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  // 1. Auth check
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  // 2. Query sesi aktif yang belum expired
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      classes ( id, code, name, location )
    `)
    .eq("is_active", true)
    .gt("expires_at", now)
    .order("activated_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // No active session — bukan error, return null
    if (error.code === "PGRST116") {
      return ok(null)
    }
    console.error("[sessions/active]", error.message)
    return err(E.INTERNAL_ERROR, "Gagal mengambil sesi aktif.", 500)
  }

  return ok(data)
}
