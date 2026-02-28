// ======================================================
// Unit Tests — apiHelpers.ts (pure helpers)
// Covers: ok(), err(), E constants, isStaffRole()
// Note: getAuthUser/isDosenOfClass need Supabase → mock test
//       dilakukan di checkin/activate test files
// ======================================================
import { describe, it, expect } from "vitest"

// Kita test bagian pure yang tidak bergantung Supabase
// dengan import hati-hati (mock supabase/server dulu)
import { vi } from "vitest"

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn(), getAll: vi.fn(() => []) })),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient:  vi.fn(),
  createSupabaseServiceClient: vi.fn(),
}))

// Import after mocks
const { ok, err, E, isStaffRole } = await import("@/lib/apiHelpers")

describe("ok()", () => {
  it("mengembalikan JSON dengan success=true dan data", async () => {
    const res = ok({ id: 1, name: "test" })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ id: 1, name: "test" })
  })

  it("menggunakan status kustom", async () => {
    const res = ok({ created: true }, 201)
    expect(res.status).toBe(201)
  })

  it("menerima null sebagai data", async () => {
    const res = ok(null)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeNull()
  })
})

describe("err()", () => {
  it("mengembalikan JSON dengan success=false + kode + pesan", async () => {
    const res = err(E.UNAUTHORIZED, "Silakan login.", 401)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe("UNAUTHORIZED")
    expect(body.message).toBe("Silakan login.")
  })

  it("menyertakan details jika diberikan", async () => {
    const details = { distance_meter: 250, max_radius: 100 }
    const res = err(E.OUT_OF_RANGE, "Terlalu jauh.", 403, details)
    const body = await res.json()
    expect(body.details).toEqual(details)
  })

  it("tidak menyertakan field 'details' jika tidak diberikan", async () => {
    const res = err(E.FORBIDDEN, "Tidak diizinkan.", 403)
    const body = await res.json()
    expect("details" in body).toBe(false)
  })

  it("status 429 untuk RATE_LIMITED", async () => {
    const res = err(E.RATE_LIMITED, "Terlalu banyak request.", 429)
    expect(res.status).toBe(429)
  })

  it("status 409 untuk ALREADY_CHECKED_IN", async () => {
    const res = err(E.ALREADY_CHECKED_IN, "Sudah absen.", 409)
    expect(res.status).toBe(409)
  })
})

describe("E constants", () => {
  it("semua kode error terdefinisi dan unique", () => {
    const values = Object.values(E)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  const expectedCodes = [
    "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND",
    "SESSION_INACTIVE", "SESSION_EXPIRED",
    "OUT_OF_RANGE", "ALREADY_CHECKED_IN",
    "RATE_LIMITED", "VALIDATION_ERROR", "INTERNAL_ERROR",
  ]

  for (const code of expectedCodes) {
    it(`E.${code} ada`, () => {
      expect(Object.values(E)).toContain(code)
    })
  }
})

describe("isStaffRole()", () => {
  it("dosen → true", ()  => expect(isStaffRole("dosen")).toBe(true))
  it("asisten → true",   () => expect(isStaffRole("asisten")).toBe(true))
  it("admin → true",     () => expect(isStaffRole("admin")).toBe(true))
  it("mahasiswa → false",() => expect(isStaffRole("mahasiswa")).toBe(false))
  it("null → false",     () => expect(isStaffRole(null)).toBe(false))
  it("string kosong → false", () => expect(isStaffRole("")).toBe(false))
  it("string acak → false", () => expect(isStaffRole("superuser")).toBe(false))
})
