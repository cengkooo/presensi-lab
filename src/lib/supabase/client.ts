// ======================================================
// Supabase Browser Client
// Untuk: Client Components ("use client")
// Singleton pattern — satu instance per browser session
// ======================================================
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Singleton Supabase client untuk Client Components.
 * Jangan panggil ini di Server Components atau API routes.
 */
export function createSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
