// =========================================
// PRESENSLAB — Central Type Definitions
// Reflects actual DB schema (Supabase)
// =========================================

/** Kelas Praktikum — top-level entity */
export interface PraktikumClass {
  id: string;
  code: string;               // cth: JK-A1
  name: string;               // cth: Praktikum Jaringan Komputer
  semester: string;           // cth: Genap 2025/2026
  lecturer: string;
  location: string;
  min_attendance_pct: number; // min % kehadiran lulus (cth: 75)
  total_sessions_planned: number;
  created_at: string;
}

/** Sesi pertemuan dalam satu kelas */
export interface Session {
  id: string;
  class_id: string;           // FK → PraktikumClass.id
  title: string;              // cth: Sesi 1
  date: string;               // ISO date
  location: string;
  radius_meters: number;
  duration_minutes: number;
  is_active: boolean;
  expires_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

/** Mahasiswa yang terdaftar di kelas */
export interface Enrollment {
  id: string;
  class_id: string;           // FK → PraktikumClass.id
  user_id: string;            // FK → User.id
  enrolled_at: string;
  is_eligible: boolean | null; // dihitung otomatis dari % kehadiran
  peran: "mahasiswa" | "asisten" | "dosen"; // peran di kelas ini (bukan global)
}

/** Record kehadiran per mahasiswa per sesi */
export interface Attendance {
  id: string;
  session_id: string;         // FK → Session.id
  user_id: string;            // FK → User (student)
  status: AttendanceStatus;
  distance_meter: number | null;
  checked_in_at: string | null;
  student_lat: number | null;
  student_lng: number | null;
  created_at: string;
}

export type AttendanceStatus = "hadir" | "telat" | "absen" | "ditolak";

/** User (mahasiswa atau dosen) */
export interface User {
  id: string;
  name: string;
  email: string;
  nim: string;               // NIM untuk mahasiswa, NIP untuk dosen
  initial: string;
  role: "mahasiswa" | "dosen";
  avatar_url: string | null;
}

// ── Derived / computed types ──

/** Enrollment + User info (join result) */
export interface EnrolledStudent extends Enrollment {
  user: User;
}

/** Attendance + Session info */
export interface AttendanceWithSession extends Attendance {
  session: Session;
}

/** Per-mahasiswa rekap di satu kelas */
export interface StudentAttendanceSummary {
  user: User;
  enrollment: Enrollment;
  /** Map: session_id → Attendance record (or null if absent) */
  attendanceMap: Record<string, Attendance | null>;
  total_hadir: number;
  total_telat: number;
  total_absen: number;
  total_ditolak: number;
  attendance_pct: number;
  is_eligible: boolean;
}
