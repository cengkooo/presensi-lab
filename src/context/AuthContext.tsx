"use client"
// ======================================================
// AuthContext — Singleton auth state untuk seluruh app
// Fetch session sekali, di-share ke semua komponen
// Profile di-cache di Redis via /api/auth/profile (~5ms hit)
// ======================================================
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/supabase"

export type AuthState = {
  user:    User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({
  user:    null,
  profile: null,
  loading: true,
})

async function fetchCachedProfile(): Promise<Profile | null> {
  try {
    const res = await fetch("/api/auth/profile", { credentials: "same-origin" })
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:    null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // onAuthStateChange fires INITIAL_SESSION almost instantly from localStorage
    // (tidak hit network untuk baca session awal)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null

        if (!user) {
          setState({ user: null, profile: null, loading: false })
          return
        }

        // TOKEN_REFRESHED — hanya update user token, tidak perlu re-fetch profile
        if (event === "TOKEN_REFRESHED") {
          setState(prev => ({ ...prev, user, loading: false }))
          return
        }

        // Fetch profile via Redis-cached API route
        // Cache HIT ~5ms (Redis), Cache MISS ~150-300ms (Supabase query lalu cache)
        const profile = await fetchCachedProfile()
        setState({ user, profile, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
