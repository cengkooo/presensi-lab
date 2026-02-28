// ======================================================
// API Integration Tests — POST /api/attendance/checkin
// B7.5  Tanpa auth → 401
// B7.6  Koordinat luar radius → 403 OUT_OF_RANGE + detail jarak
// B7.7  Sesi tidak aktif → 403 SESSION_INACTIVE
// B7.8  Sesi expired → 403 SESSION_EXPIRED
// B7.9  Check-in dua kali → 409 ALREADY_CHECKED_IN
// B7.10 > 3 request/menit → 429 RATE_LIMITED
// ======================================================
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Mock semua dependency eksternal (HARUS sebelum import route) ──

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn(), getAll: vi.fn(() => []) })),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient:  vi.fn(),
  createSupabaseServiceClient: vi.fn(),
}))

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}))

// Mock apiHelpers: keep ok/err/E pure, mock getAuthUser
vi.mock("@/lib/apiHelpers", async () => {
  const { NextResponse } = await import("next/server")

  const E = {
    UNAUTHORIZED:       "UNAUTHORIZED",
    FORBIDDEN:          "FORBIDDEN",
    NOT_FOUND:          "NOT_FOUND",
    SESSION_INACTIVE:   "SESSION_INACTIVE",
    SESSION_EXPIRED:    "SESSION_EXPIRED",
    OUT_OF_RANGE:       "OUT_OF_RANGE",
    ALREADY_CHECKED_IN: "ALREADY_CHECKED_IN",
    RATE_LIMITED:       "RATE_LIMITED",
    VALIDATION_ERROR:   "VALIDATION_ERROR",
    INTERNAL_ERROR:     "INTERNAL_ERROR",
  } as const

  return {
    E,
    ok:  (data: unknown, status = 200) =>
           NextResponse.json({ success: true, data }, { status }),
    err: (error: string, message: string, status: number, details?: unknown) =>
           NextResponse.json(
             { success: false, error, message, ...(details !== undefined && { details }) },
             { status }
           ),
    isStaffRole:    (role: string | null) => role === "dosen" || role === "asisten" || role === "admin",
    getAuthUser:    vi.fn(),
    isDosenOfClass: vi.fn(),
    getUserRole:    vi.fn(),
  }
})

// ── Import setelah semua mock terdaftar ────────────────────────────
import { POST } from "@/app/api/attendance/checkin/route"
import { checkRateLimit } from "@/lib/rateLimit"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/apiHelpers"

// ── Helpers ────────────────────────────────────────────────────────

const MOCK_USER = { id: "user-123", email: "mahasiswa1@student.itera.ac.id" }
// UUID v4 yang valid: third group dimulai '4', fourth group dimulai '8/9/a/b'
const SESSION_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"

// Titik tengah sesi (Lab ITERA)
const SESSION_LAT = -5.3600
const SESSION_LNG = 105.3200
const RADIUS = 100

// Koordinat dalam radius (persis di tengah)
const IN_RANGE_BODY  = { session_id: SESSION_UUID, lat: SESSION_LAT, lng: SESSION_LNG }
// Koordinat luar radius (±500m)
const OUT_RANGE_BODY = { session_id: SESSION_UUID, lat: SESSION_LAT + 0.005, lng: SESSION_LNG }

function makeReq(body: object): NextRequest {
  return new Request("http://localhost/api/attendance/checkin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest
}

function mockRateOk() {
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true, remaining: 2, resetAt: new Date(Date.now() + 60_000),
  })
}

function mockSessionQuery(overrides: Partial<{
  is_active: boolean
  expires_at: string | null
  lat: number | null
  lng: number | null
  radius_meter: number
  late_after_minutes: number | null
  activated_at: string | null
}> = {}) {
  const session = {
    id:                 SESSION_UUID,
    class_id:           "class-001",
    is_active:          true,
    expires_at:         new Date(Date.now() + 30 * 60_000).toISOString(),
    lat:                SESSION_LAT,
    lng:                SESSION_LNG,
    radius_meter:       RADIUS,
    late_after_minutes: null,
    activated_at:       new Date().toISOString(),
    ...overrides,
  }
  return session
}

// ── Reset sebelum tiap test ────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────
// B7.5 — Tanpa auth → 401 UNAUTHORIZED
// ──────────────────────────────────────────────────────────────────
describe("B7.5 — Tanpa auth header", () => {
  it("mengembalikan 401 UNAUTHORIZED", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: null, supabase: {} as never })

    const res = await POST(makeReq(IN_RANGE_BODY))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe("UNAUTHORIZED")
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.10 — Rate limit: > 3 request/menit → 429
// ──────────────────────────────────────────────────────────────────
describe("B7.10 — Rate limited", () => {
  it("mengembalikan 429 RATE_LIMITED saat batas terlampaui", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false, remaining: 0, resetAt: new Date(Date.now() + 45_000),
    })

    const res = await POST(makeReq(IN_RANGE_BODY))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe("RATE_LIMITED")
    expect(body.details).toHaveProperty("retry_after_seconds")
    expect(body.details.retry_after_seconds).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.7 — Sesi tidak aktif → 403 SESSION_INACTIVE
// ──────────────────────────────────────────────────────────────────
describe("B7.7 — Sesi tidak aktif", () => {
  it("mengembalikan 403 SESSION_INACTIVE", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    mockRateOk()

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data:  mockSessionQuery({ is_active: false }),
        error: null,
      }),
    }
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from: vi.fn(() => mockQuery) } as never)

    const res = await POST(makeReq(IN_RANGE_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("SESSION_INACTIVE")
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.8 — Sesi expired → 403 SESSION_EXPIRED
// ──────────────────────────────────────────────────────────────────
describe("B7.8 — Sesi expired", () => {
  it("mengembalikan 403 SESSION_EXPIRED", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    mockRateOk()

    const expiredAt = new Date(Date.now() - 10_000).toISOString() // 10 detik lalu
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data:  mockSessionQuery({ expires_at: expiredAt }),
        error: null,
      }),
    }
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from: vi.fn(() => mockQuery) } as never)

    const res = await POST(makeReq(IN_RANGE_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("SESSION_EXPIRED")
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.6 — Koordinat luar radius → 403 OUT_OF_RANGE + detail jarak
// ──────────────────────────────────────────────────────────────────
describe("B7.6 — Koordinat luar radius", () => {
  it("mengembalikan 403 OUT_OF_RANGE dengan distance_meter dan max_radius", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    mockRateOk()

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data:  mockSessionQuery(), // session aktif, tidak expired
        error: null,
      }),
    }
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from: vi.fn(() => mockQuery) } as never)

    const res = await POST(makeReq(OUT_RANGE_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("OUT_OF_RANGE")
    expect(body.details).toHaveProperty("distance_meter")
    expect(body.details).toHaveProperty("max_radius")
    expect(body.details.distance_meter).toBeGreaterThan(RADIUS)
    expect(body.details.max_radius).toBe(RADIUS)
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.9 — Check-in duplikat → 409 ALREADY_CHECKED_IN
// ──────────────────────────────────────────────────────────────────
describe("B7.9 — Check-in duplikat", () => {
  it("mengembalikan 409 ALREADY_CHECKED_IN dengan waktu check-in pertama", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    mockRateOk()

    const firstCheckinAt = "2026-03-01T08:00:00.000Z"

    // Server client: fetch session
    const serverQuery = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data:  mockSessionQuery(),
        error: null,
      }),
    }
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from: vi.fn(() => serverQuery) } as never)

    // Service client: insert fails with UNIQUE violation (code 23505),
    // then fetch existing record
    const existingRecord    = { id: "att-001", checked_in_at: firstCheckinAt, status: "hadir" }
    const dupQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data:  null,
        error: { code: "23505", message: "duplicate key" },
      }),
      eq: vi.fn().mockReturnThis(),
    }
    // second call to .from("attendance") for fetching existing
    const existingQuery = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existingRecord, error: null }),
    }

    let callCount = 0
    vi.mocked(createSupabaseServiceClient).mockReturnValue({
      from: vi.fn(() => {
        callCount++
        return callCount === 1 ? dupQuery : existingQuery
      }),
    } as never)

    const res = await POST(makeReq(IN_RANGE_BODY))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe("ALREADY_CHECKED_IN")
    // Route returns details: { previous_checkin: { checked_in_at, status, distance_meter } }
    expect(body.details).toHaveProperty("previous_checkin")
    expect(body.details.previous_checkin).toHaveProperty("checked_in_at")
  })
})

// ──────────────────────────────────────────────────────────────────
// Happy path — check-in berhasil → 200
// ──────────────────────────────────────────────────────────────────
describe("Happy path — check-in berhasil", () => {
  it("mengembalikan 200 dengan distance_meter", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    mockRateOk()

    const serverQuery = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSessionQuery(), error: null }),
    }
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from: vi.fn(() => serverQuery) } as never)

    const attendanceRecord = {
      id: "att-new", session_id: SESSION_UUID,
      user_id: MOCK_USER.id, checked_in_at: new Date().toISOString(), status: "hadir",
    }
    const serviceQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: attendanceRecord, error: null }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue({ from: vi.fn(() => serviceQuery) } as never)

    const res = await POST(makeReq(IN_RANGE_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty("distance_meter")
    expect(body.data.distance_meter).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────
// Validasi input buruk → 400 VALIDATION_ERROR
// ──────────────────────────────────────────────────────────────────
describe("Validasi Zod", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MOCK_USER as never, supabase: {} as never })
    mockRateOk()
  })

  it("body bukan JSON → 400", async () => {
    const req = new Request("http://localhost/api/attendance/checkin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "bukan json{{{",
    }) as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("session_id bukan UUID → 400 VALIDATION_ERROR", async () => {
    const res = await POST(makeReq({ session_id: "bukan-uuid", lat: -5.36, lng: 105.32 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("VALIDATION_ERROR")
  })

  it("lat di luar range [-90,90] → 400", async () => {
    const res = await POST(makeReq({ session_id: SESSION_UUID, lat: 999, lng: 105.32 }))
    expect(res.status).toBe(400)
  })

  it("field lat tidak ada → 400", async () => {
    const res = await POST(makeReq({ session_id: SESSION_UUID, lng: 105.32 }))
    expect(res.status).toBe(400)
  })
})
