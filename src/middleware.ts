// ======================================================
// Next.js Middleware — Session Refresh & Route Protection
// Runs on EVERY request before page/API handler
// ======================================================
import { NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Public routes — SKIP updateSession (tidak perlu auth check, hemat 1 network call) ──
  // updateSession memanggil getUser() ke server Supabase (~200-500ms) di setiap request.
  // Public pages tidak membutuhkan ini — auth state dibaca dari localStorage di client.
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/presensi" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next({ request })
  }

  // ── Protected routes — perlu verify session ──────────
  const response = NextResponse.next({ request })
  const { user } = await updateSession(request, response)

  // Proteksi /dashboard/**
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return response
  }

  // Proteksi /api/** (sudah exclude /api/auth/** di atas)
  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Kamu harus login terlebih dahulu." },
        { status: 401 }
      )
    }
    return response
  }

  return response
}

// TEMP: matcher dikosongkan sementara selama incident Vercel dxb1 (Edge Middleware global deployment).
// API routes tetap aman via getAuthUser(), dashboard redirect via AuthContext client-side.
// Kembalikan matcher di bawah setelah incident selesai.
export const config = {
  matcher: [],
}
