// ======================================================
// GET /api/auth/profile
// Ambil profil user dengan Redis cache layer.
// Cache TTL: 5 menit. Hit: ~5ms. Miss: ~150-300ms (Supabase query).
// ======================================================
import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/supabase"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CACHE_TTL = 300 // 5 menit (detik)
const cacheKey = (userId: string) => `presenslab:profile:${userId}`

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  const key = cacheKey(user.id)

  // ── Cache HIT ──────────────────────────────────────────
  const cached = await redis.get<Profile>(key)
  if (cached) {
    return NextResponse.json({ success: true, data: cached, source: "cache" })
  }

  // ── Cache MISS — query Supabase DB ─────────────────────
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ success: false, error: "PROFILE_NOT_FOUND" }, { status: 404 })
  }

  // Simpan ke Redis dengan TTL
  await redis.set(key, profile, { ex: CACHE_TTL })

  return NextResponse.json({ success: true, data: profile, source: "db" })
}

/**
 * POST /api/auth/profile/invalidate — panggil setelah update profil
 * agar cache dihapus dan profile terbaru di-fetch ulang.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false }, { status: 401 })

  await redis.del(cacheKey(user.id))
  return NextResponse.json({ success: true, message: "Cache cleared" })
}
