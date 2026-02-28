// ======================================================
// Supabase Server Client
// Untuk: Server Components, API Route Handlers, Middleware
// Menggunakan @supabase/ssr — handle cookie otomatis
// ======================================================
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

/**
 * Buat Supabase client untuk Server Components dan Route Handlers.
 * Client ini menggunakan `anon` key — tunduk pada RLS.
 * Panggil di dalam fungsi async (bukan module-level) karena butuh `cookies()`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll bisa throw di Server Components (read-only).
            // Aman diabaikan jika middleware sudah handle refresh session.
          }
        },
      },
    }
  )
}

/**
 * Buat Supabase client dengan Service Role key.
 * HANYA untuk operasi yang perlu bypass RLS:
 * - Activate/deactivate session (ubah is_active)
 * - Manual override attendance
 * JANGAN expose ke client-side.
 */
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
