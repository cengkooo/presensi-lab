// ======================================================
// Next.js Middleware — Session Refresh & Route Protection
// Runs on EVERY request before page/API handler
// ======================================================
import { NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Refresh Supabase session — wajib ada agar JWT tidak expired diam-diam
  const { user } = await updateSession(request, response)

  const { pathname } = request.nextUrl

  // ── Proteksi /dashboard/** ───────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return response
  }

  // ── Proteksi /api/** (kecuali /api/auth/**) ──────────
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
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

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - file extensions (png, jpg, dll)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
