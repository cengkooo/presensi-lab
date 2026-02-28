// ======================================================
// API Integration Tests — POST /api/sessions/activate
// B7.11 Akun mahasiswa mengakses endpoint dosen → 403 FORBIDDEN
// Plus: unauthenticated → 401, valid dosen → 200
// ======================================================
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn(), getAll: vi.fn(() => []) })),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient:  vi.fn(),
  createSupabaseServiceClient: vi.fn(),
}))

vi.mock("@/lib/apiHelpers", async () => {
  const { NextResponse } = await import("next/server")

  const E = {
    UNAUTHORIZED:     "UNAUTHORIZED",
    FORBIDDEN:        "FORBIDDEN",
    NOT_FOUND:        "NOT_FOUND",
    SESSION_INACTIVE: "SESSION_INACTIVE",
    SESSION_EXPIRED:  "SESSION_EXPIRED",
    OUT_OF_RANGE:     "OUT_OF_RANGE",
    ALREADY_CHECKED_IN: "ALREADY_CHECKED_IN",
    RATE_LIMITED:     "RATE_LIMITED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    INTERNAL_ERROR:   "INTERNAL_ERROR",
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

import { POST } from "@/app/api/sessions/activate/route"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { getAuthUser, isDosenOfClass } from "@/lib/apiHelpers"

const MAHASISWA_USER = { id: "user-mahasiswa", email: "mahasiswa1@student.itera.ac.id" }
const DOSEN_USER     = { id: "user-dosen",     email: "dosen@itera.ac.id" }
// UUID v4 yang valid: third group dimulai '4', fourth group dimulai '8/9/a/b'
const SESSION_UUID   = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const CLASS_UUID     = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

const VALID_BODY = {
  session_id:       SESSION_UUID,
  lat:              -5.3600,
  lng:              105.3200,
  radius_meter:     100,
  duration_minutes: 30,
}

function makeReq(body: object): NextRequest {
  return new Request("http://localhost/api/sessions/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────
// B7.5 adapt — Tanpa auth → 401
// ──────────────────────────────────────────────────────────────────
describe("Activate: tanpa auth", () => {
  it("mengembalikan 401 UNAUTHORIZED", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: null, supabase: {} as never })
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("UNAUTHORIZED")
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.11 — Mahasiswa mengakses endpoint dosen → 403 FORBIDDEN
// ──────────────────────────────────────────────────────────────────
describe("B7.11 — Mahasiswa akses activate", () => {
  it("mengembalikan 403 FORBIDDEN", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: MAHASISWA_USER as never, supabase: {} as never })

    // Sesi ditemukan — service client mengembalikan sesi valid
    const sessionData = { id: SESSION_UUID, class_id: CLASS_UUID, is_active: false }
    const mockServiceQuery = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sessionData, error: null }),
      }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue(mockServiceQuery as never)

    // isDosenOfClass → false (mahasiswa bukan dosen di kelas ini)
    vi.mocked(isDosenOfClass).mockResolvedValue(false)

    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("FORBIDDEN")
  })
})

// ──────────────────────────────────────────────────────────────────
// Validate: body tidak valid → 400
// ──────────────────────────────────────────────────────────────────
describe("Activate: validasi input", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: DOSEN_USER as never, supabase: {} as never })
  })

  it("session_id bukan UUID → 400 VALIDATION_ERROR", async () => {
    const res = await POST(makeReq({ ...VALID_BODY, session_id: "bukan-uuid" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("VALIDATION_ERROR")
  })

  it("duration_minutes terlalu kecil (< 5) → 400", async () => {
    const res = await POST(makeReq({ ...VALID_BODY, duration_minutes: 2 }))
    expect(res.status).toBe(400)
  })

  it("radius_meter > 1000 → 400", async () => {
    const res = await POST(makeReq({ ...VALID_BODY, radius_meter: 9999 }))
    expect(res.status).toBe(400)
  })
})

// ──────────────────────────────────────────────────────────────────
// Sesi tidak ditemukan → 404
// ──────────────────────────────────────────────────────────────────
describe("Activate: sesi tidak ditemukan", () => {
  it("mengembalikan 404 NOT_FOUND", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ user: DOSEN_USER as never, supabase: {} as never })

    const mockServiceQuery = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue(mockServiceQuery as never)

    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe("NOT_FOUND")
  })
})
