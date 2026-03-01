// ======================================================
// Sign Out Route
// URL: POST /api/auth/signout
// Hapus session Supabase, redirect ke landing page
// ======================================================
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL("/", origin), { status: 302 })
}
