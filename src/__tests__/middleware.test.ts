// ======================================================
// Middleware Tests — Route Protection
// B7.3  /dashboard tanpa login → redirect /login
// B7.4  /api/... tanpa login → 401 JSON
// + /api/auth/* selalu lolos (public)
// + /dashboard dengan session valid → lolos
// ======================================================
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

// Mock updateSession dari supabase middleware
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}))

import { middleware } from "@/middleware"
import { updateSession } from "@/lib/supabase/middleware"

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, { method: "GET" })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────
// Public routes — tidak perlu auth, langsung lolos
// ──────────────────────────────────────────────────────────────────
describe("Public routes (tidak butuh auth)", () => {
  const PUBLIC_PATHS = ["/", "/login", "/presensi", "/api/auth/callback", "/api/auth/signout"]

  for (const path of PUBLIC_PATHS) {
    it(`${path} lolos TANPA panggil updateSession`, async () => {
      const res = await middleware(makeRequest(path))
      // Tidak boleh memanggil updateSession
      expect(updateSession).not.toHaveBeenCalled()
      // Harus NextResponse.next (bukan redirect atau 401)
      expect(res.status).not.toBe(401)
      // Jika redirect, URL-nya bukan /login (berarti tidak di-reject)
      if (res.status === 307 || res.status === 308 || res.status === 302) {
        expect(res.headers.get("location")).not.toContain("/login")
      }
    })
  }
})

// ──────────────────────────────────────────────────────────────────
// B7.3 — /dashboard tanpa login → redirect ke /login
// ──────────────────────────────────────────────────────────────────
describe("B7.3 — /dashboard tanpa login", () => {
  it("/dashboard redirect ke /login", async () => {
    vi.mocked(updateSession).mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    })

    const res = await middleware(makeRequest("/dashboard"))
    // Must redirect
    expect([301, 302, 307, 308]).toContain(res.status)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("/dashboard/kelas redirect ke /login", async () => {
    vi.mocked(updateSession).mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    })

    const res = await middleware(makeRequest("/dashboard/kelas"))
    expect([301, 302, 307, 308]).toContain(res.status)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("/dashboard/sesi redirect ke /login", async () => {
    vi.mocked(updateSession).mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    })

    const res = await middleware(makeRequest("/dashboard/sesi"))
    expect([301, 302, 307, 308]).toContain(res.status)
    expect(res.headers.get("location")).toContain("/login")
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.4 — /dashboard dengan session valid → lolos (tidak redirect)
// ──────────────────────────────────────────────────────────────────
describe("B7.4 — /dashboard dengan session valid", () => {
  it("tidak redirect, mengembalikan response normal", async () => {
    const mockRes = NextResponse.next()
    vi.mocked(updateSession).mockResolvedValue({
      user: { id: "user-123", email: "dosen@itera.ac.id" } as never,
      response: mockRes,
    })

    const res = await middleware(makeRequest("/dashboard"))
    // Tidak boleh redirect ke /login
    if (res.status >= 300 && res.status < 400) {
      expect(res.headers.get("location")).not.toContain("/login")
    }
    expect(res.status).not.toBe(401)
  })
})

// ──────────────────────────────────────────────────────────────────
// B7.4 adapt — /api/* tanpa login → 401 JSON (bukan redirect)
// ──────────────────────────────────────────────────────────────────
describe("B7.4 — /api/* tanpa login → 401 JSON", () => {
  const PROTECTED_API = [
    "/api/classes",
    "/api/sessions/active",
    "/api/attendance/checkin",
    "/api/sessions/activate",
  ]

  for (const path of PROTECTED_API) {
    it(`${path} tanpa login → 401 JSON`, async () => {
      vi.mocked(updateSession).mockResolvedValue({
        user: null,
        response: NextResponse.next(),
      })

      const res = await middleware(makeRequest(path))
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe("UNAUTHORIZED")
    })
  }
})

// ──────────────────────────────────────────────────────────────────
// /api/* dengan session valid → lolos ke handler
// ──────────────────────────────────────────────────────────────────
describe("API routes dengan session valid → lolos", () => {
  it("/api/classes dengan login tidak di-block middleware", async () => {
    const mockRes = NextResponse.next()
    vi.mocked(updateSession).mockResolvedValue({
      user: { id: "user-123", email: "dosen@itera.ac.id" } as never,
      response: mockRes,
    })

    const res = await middleware(makeRequest("/api/classes"))
    expect(res.status).not.toBe(401)
    if (res.status >= 300 && res.status < 400) {
      expect(res.headers.get("location")).not.toContain("/login")
    }
  })
})
