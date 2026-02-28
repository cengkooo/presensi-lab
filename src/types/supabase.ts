// ======================================================
// Supabase Database Type Definitions
// Generated structure matching schema in 001_core_tables.sql
// Update ini setelah jalankan:
//   bunx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
// ======================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          nim: string | null
          avatar_url: string | null
          role: "mahasiswa" | "dosen" | "admin"
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          nim?: string | null
          avatar_url?: string | null
          role?: "mahasiswa" | "dosen" | "admin"
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          nim?: string | null
          avatar_url?: string | null
          role?: "mahasiswa" | "dosen" | "admin"
          updated_at?: string | null
        }
      }
      classes: {
        Row: {
          id: string
          code: string
          name: string
          semester: string | null
          description: string | null
          location: string | null
          min_attendance_pct: number
          total_sessions_planned: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          semester?: string | null
          description?: string | null
          location?: string | null
          min_attendance_pct?: number
          total_sessions_planned?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          code?: string
          name?: string
          semester?: string | null
          description?: string | null
          location?: string | null
          min_attendance_pct?: number
          total_sessions_planned?: number
        }
      }
      enrollments: {
        Row: {
          id: string
          class_id: string
          user_id: string
          peran: "mahasiswa" | "asisten" | "dosen"
          joined_at: string
        }
        Insert: {
          id?: string
          class_id: string
          user_id: string
          peran?: "mahasiswa" | "asisten" | "dosen"
          joined_at?: string
        }
        Update: {
          peran?: "mahasiswa" | "asisten" | "dosen"
        }
      }
      sessions: {
        Row: {
          id: string
          class_id: string
          title: string
          description: string | null
          session_date: string
          location: string | null
          is_active: boolean
          lat: number | null
          lng: number | null
          radius_meter: number
          expires_at: string | null
          activated_by: string | null
          activated_at: string | null
          deactivated_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          description?: string | null
          session_date: string
          location?: string | null
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          radius_meter?: number
          expires_at?: string | null
          activated_by?: string | null
          activated_at?: string | null
          deactivated_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          session_date?: string
          location?: string | null
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          radius_meter?: number
          expires_at?: string | null
          activated_by?: string | null
          activated_at?: string | null
          deactivated_at?: string | null
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          session_id: string
          user_id: string
          student_lat: number | null
          student_lng: number | null
          distance_meter: number | null
          status: "hadir" | "telat" | "absen" | "ditolak"
          rejected_reason: string | null
          is_manual_override: boolean
          checked_in_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          student_lat?: number | null
          student_lng?: number | null
          distance_meter?: number | null
          status?: "hadir" | "telat" | "absen" | "ditolak"
          rejected_reason?: string | null
          is_manual_override?: boolean
          checked_in_at?: string
        }
        Update: {
          status?: "hadir" | "telat" | "absen" | "ditolak"
          rejected_reason?: string | null
          is_manual_override?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Convenience row types ──────────────────────────────
export type Profile    = Database["public"]["Tables"]["profiles"]["Row"]
export type ClassRow   = Database["public"]["Tables"]["classes"]["Row"]
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"]
export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"]
export type AttendanceRow = Database["public"]["Tables"]["attendance"]["Row"]
