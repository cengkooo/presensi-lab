"use client"
// ======================================================
// useSupabaseSession — Hook untuk baca session & user
// Untuk Client Components
// ======================================================
import { useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/supabase"

export type AuthState = {
  user:    User | null
  profile: Profile | null
  loading: boolean
}

export function useSupabaseSession(): AuthState {
  const [state, setState] = useState<AuthState>({
    user:    null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // Ambil session awal
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setState({ user: null, profile: null, loading: false })
        return
      }

      // Ambil profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setState({ user, profile: profile ?? null, loading: false })
    })

    // Subscribe ke perubahan auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          setState({ user: null, profile: null, loading: false })
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        setState({ user: session.user, profile: profile ?? null, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return state
}
