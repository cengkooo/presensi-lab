// ======================================================
// API Route Helpers
// Konsisten response format untuk semua route handlers
// ======================================================
import { NextResponse } from "next/server"

// ── Response format standar ───────────────────────────
export type ApiSuccess<T = unknown> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: string        // kode error untuk client logic — cth: "OUT_OF_RANGE"
  message: string      // pesan human-readable — cth: "Kamu berada 234m dari titik absen"
  details?: unknown    // data tambahan — cth: { distance_meter, max_radius }
}

// ── Response builders ─────────────────────────────────
export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(
  error: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, message, ...(details !== undefined && { details }) },
    { status }
  )
}

// ── Error code constants ──────────────────────────────
export const E = {
  UNAUTHORIZED:        "UNAUTHORIZED",
  FORBIDDEN:           "FORBIDDEN",
  NOT_FOUND:           "NOT_FOUND",
  SESSION_INACTIVE:    "SESSION_INACTIVE",
  SESSION_EXPIRED:     "SESSION_EXPIRED",
  OUT_OF_RANGE:        "OUT_OF_RANGE",
  ALREADY_CHECKED_IN:  "ALREADY_CHECKED_IN",
  RATE_LIMITED:        "RATE_LIMITED",
  VALIDATION_ERROR:    "VALIDATION_ERROR",
  INTERNAL_ERROR:      "INTERNAL_ERROR",
} as const

// ── Get authenticated user from server client ─────────
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase }
  return { user, supabase }
}

// ── Get user role from profiles table ─────────────────
export async function getUserRole(userId: string): Promise<"mahasiswa" | "dosen" | "admin" | null> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single() as { data: { role: string } | null }
  return (data?.role as "mahasiswa" | "dosen" | "admin") ?? null
}

// ── Check if role is staff (dosen / asisten / admin) ─
export function isStaffRole(role: string | null): boolean {
  return role === "dosen" || role === "asisten" || role === "admin"
}

// ── Is user dosen/admin of a class? ──────────────────
export async function isDosenOfClass(userId: string, classId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("enrollments")
    .select("peran")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .in("peran", ["dosen", "asisten"])
    .single() as { data: { peran: string } | null }
  return !!data
}
