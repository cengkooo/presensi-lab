// ======================================================
// Auth Callback Route — Supabase OAuth
// URL: /api/auth/callback
// Dipanggil otomatis setelah Google OAuth selesai
// ======================================================
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/unauthorized?reason=no_code`)
  }

  const supabase = await createSupabaseServerClient()

  // Tukar code → session
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message)
    return NextResponse.redirect(`${origin}/unauthorized?reason=auth_error`)
  }

  // Ambil user yang baru login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.redirect(`${origin}/unauthorized?reason=no_email`)
  }

  // ── Whitelist check ──────────────────────────────────
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? ""
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const emailLower = user.email.toLowerCase()
  const domainMatch = allowedDomain ? emailLower.endsWith(`@${allowedDomain}`) : false
  const emailMatch  = allowedEmails.includes(emailLower)

  if (!domainMatch && !emailMatch) {
    // Sign out user yang tidak diizinkan
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/unauthorized?reason=email_not_allowed`)
  }

  // ── Upsert profile ────────────────────────────────────
  // Gunakan service role agar bisa INSERT walau profil belum ada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceClient = createSupabaseServiceClient() as any
  const { error: upsertErr } = await serviceClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name:  user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        // role default 'mahasiswa' kecuali di ALLOWED_EMAILS (dosen/admin)
        role: emailMatch ? "dosen" : "mahasiswa",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    )

  if (upsertErr) {
    console.error("[auth/callback] profile upsert error:", upsertErr.message)
    // Non-fatal — user sudah login, lanjutkan walau upsert gagal
  }

  return NextResponse.redirect(`${origin}${next}`)
}
