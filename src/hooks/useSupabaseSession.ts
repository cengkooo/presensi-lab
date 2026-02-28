"use client"
// ======================================================
// useSupabaseSession — Thin wrapper ke AuthContext
// Semua komponen share satu instance fetch (no duplicate calls)
// ======================================================
export type { AuthState } from "@/context/AuthContext"
export { useAuth as useSupabaseSession } from "@/context/AuthContext"
