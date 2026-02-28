// ======================================================
// POST /api/attendance/checkin
// Check-in absensi mahasiswa
// Validation chain lengkap — semua validasi server-side
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser } from "@/lib/apiHelpers"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"
import { checkInRange } from "@/lib/haversine"
import { checkRateLimit } from "@/lib/rateLimit"

const schema = z.object({
  session_id: z.string().uuid("session_id harus berupa UUID"),
  lat: z.number({ error: "Koordinat lat wajib diisi" }).min(-90).max(90),
  lng: z.number({ error: "Koordinat lng wajib diisi" }).min(-180).max(180),
})

export async function POST(request: NextRequest) {
  // ── STEP 1: Auth check ────────────────────────────────
  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login untuk absen.", 401)

  // ── STEP 2: Rate limit ────────────────────────────────
  const { allowed, remaining, resetAt } = await checkRateLimit(user.id)
  if (!allowed) {
    const waitSeconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000)
    return err(
      E.RATE_LIMITED,
      `Terlalu banyak percobaan. Coba lagi dalam ${waitSeconds} detik.`,
      429,
      { retry_after_seconds: waitSeconds, remaining }
    )
  }

  // ── STEP 3: Validate body ─────────────────────────────
  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Input tidak valid.", 400, parsed.error.issues)
  }

  const { session_id, lat, lng } = parsed.data

  // ── STEP 4: Fetch session ─────────────────────────────
  // Gunakan server client (RLS: user harus terdaftar di kelas)
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionErr } = await (supabase as any)
    .from("sessions")
    .select("id, class_id, is_active, expires_at, lat, lng, radius_meter")
    .eq("id", session_id)
    .single() as { data: import("@/types/supabase").SessionRow | null; error: unknown }

  if (sessionErr || !session) return err(E.NOT_FOUND, "Sesi tidak ditemukan.", 404)

  // ── STEP 5: Cek is_active ─────────────────────────────
  if (!session.is_active) {
    return err(E.SESSION_INACTIVE, "Absensi belum dibuka. Hubungi dosen kamu.", 403)
  }

  // ── STEP 6: Cek expires_at ────────────────────────────
  if (session.expires_at && new Date(session.expires_at) <= new Date()) {
    return err(E.SESSION_EXPIRED, "Waktu absensi sudah habis. Hubungi dosen untuk override.", 403)
  }

  // ── STEP 7: Hitung jarak ──────────────────────────────
  if (session.lat == null || session.lng == null) {
    return err(E.INTERNAL_ERROR, "Sesi belum memiliki koordinat lokasi.", 500)
  }

  const { inRange, distance } = checkInRange(lat, lng, session.lat, session.lng, session.radius_meter)
  const distanceRounded = Math.round(distance)

  // ── STEP 8: Cek dalam radius ──────────────────────────
  if (!inRange) {
    return err(
      E.OUT_OF_RANGE,
      `Kamu berada ${distanceRounded}m dari titik absen. Maksimal ${session.radius_meter}m.`,
      403,
      { distance_meter: distanceRounded, max_radius: session.radius_meter }
    )
  }

  // ── STEP 9: Insert attendance ─────────────────────────
  // Gunakan service role agar bisa insert tanpa terganjal RLS insert policy edge case
  const serviceClient = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attendance, error: insertErr } = await (serviceClient as any)
    .from("attendance")
    .insert({
      session_id,
      user_id:       user.id,
      student_lat:   lat,
      student_lng:   lng,
      distance_meter: distanceRounded,
      status:        "hadir",
    })
    .select()
    .single() as { data: import("@/types/supabase").AttendanceRow | null; error: { code: string; message: string } | null }

  if (insertErr) {
    // STEP 9b: Handle duplicate check-in (UNIQUE constraint violation)
    if (insertErr.code === "23505") {
      // Ambil data check-in sebelumnya
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (serviceClient as any)
        .from("attendance")
        .select("checked_in_at, status, distance_meter")
        .eq("session_id", session_id)
        .eq("user_id", user.id)
        .single() as { data: { checked_in_at: string; status: string } | null }

      return err(
        E.ALREADY_CHECKED_IN,
        `Kamu sudah absen pada sesi ini pada ${existing?.checked_in_at ? new Date(existing.checked_in_at).toLocaleTimeString("id-ID") : "sebelumnya"}.`,
        409,
        { previous_checkin: existing }
      )
    }

    console.error("[attendance/checkin]", insertErr.message)
    return err(E.INTERNAL_ERROR, "Gagal menyimpan absensi. Coba lagi.", 500)
  }

  // ── STEP 10: Return success ───────────────────────────
  return ok({
    message:         "Absensi berhasil dicatat! ✅",
    distance_meter:  distanceRounded,
    max_radius:      session.radius_meter,
    checked_in_at:   attendance?.checked_in_at ?? null,
    status:          attendance?.status ?? "hadir",
  })
}
