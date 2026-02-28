// =========================================
// PRESENSLAB — Centralized Mock Data
// Reflects real DB hierarchy:
//   classes → sessions → attendances
//   classes → enrollments → users
// =========================================
import type {
  PraktikumClass, Session, Enrollment, Attendance, User,
  StudentAttendanceSummary,
} from "@/types";

// ── USERS ──────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: "u1",  name: "Jordan Dika",    email: "jordan.d@stmik.ac.id",  nim: "2021001", initial: "JD", role: "mahasiswa", avatar_url: null },
  { id: "u2",  name: "Amira Safira",   email: "amira.s@stmik.ac.id",   nim: "2021002", initial: "AS", role: "mahasiswa", avatar_url: null },
  { id: "u3",  name: "Budi Waluyo",    email: "budi.w@stmik.ac.id",    nim: "2021003", initial: "BW", role: "mahasiswa", avatar_url: null },
  { id: "u4",  name: "Cindy Rahma",    email: "cindy.r@stmik.ac.id",   nim: "2021004", initial: "CR", role: "mahasiswa", avatar_url: null },
  { id: "u5",  name: "Deni Susanto",   email: "deni.s@stmik.ac.id",    nim: "2021005", initial: "DS", role: "mahasiswa", avatar_url: null },
  { id: "u6",  name: "Eka Putri",      email: "eka.p@stmik.ac.id",     nim: "2021006", initial: "EP", role: "mahasiswa", avatar_url: null },
  { id: "u7",  name: "Fajar Nugroho",  email: "fajar.n@stmik.ac.id",   nim: "2021007", initial: "FN", role: "mahasiswa", avatar_url: null },
  { id: "u8",  name: "Gita Lestari",   email: "gita.l@stmik.ac.id",    nim: "2021008", initial: "GL", role: "mahasiswa", avatar_url: null },
  { id: "u9",  name: "Hendra Putra",   email: "hendra.p@stmik.ac.id",  nim: "2021009", initial: "HP", role: "mahasiswa", avatar_url: null },
  { id: "u10", name: "Indi Maharani",  email: "indi.m@stmik.ac.id",    nim: "2021010", initial: "IM", role: "mahasiswa", avatar_url: null },
  { id: "d1",  name: "Dr. Alex Rivera",email: "alex.r@stmik.ac.id",    nim: "D001",    initial: "AR", role: "dosen",     avatar_url: null },
];

// ── CLASSES ────────────────────────────────────────────
export const MOCK_CLASSES: PraktikumClass[] = [
  {
    id: "c1", code: "JK-A1",
    name: "Praktikum Jaringan Komputer",
    semester: "Genap 2025/2026", lecturer: "Dr. Alex Rivera",
    location: "Lab Komputer A, Gedung 4",
    min_attendance_pct: 75, total_sessions_planned: 12, created_at: "2026-01-20T08:00:00Z",
  },
  {
    id: "c2", code: "BD-B2",
    name: "Praktikum Basis Data",
    semester: "Genap 2025/2026", lecturer: "Dr. Alex Rivera",
    location: "Lab Komputer 01",
    min_attendance_pct: 80, total_sessions_planned: 10, created_at: "2026-01-20T08:00:00Z",
  },
  {
    id: "c3", code: "SO-C1",
    name: "Praktikum Sistem Operasi",
    semester: "Genap 2025/2026", lecturer: "Dr. Alex Rivera",
    location: "Lab Komputer 05",
    min_attendance_pct: 75, total_sessions_planned: 10, created_at: "2026-01-20T08:00:00Z",
  },
  {
    id: "c4", code: "PW-1",
    name: "Praktikum Pengembangan Website",
    semester: "Genap 2025/2026", lecturer: "Dr. Gua",
    location: "LABTEK 1",
    min_attendance_pct: 75, total_sessions_planned: 14, created_at: "2026-01-20T08:00:00Z",
  },
];

// ── SESSIONS (FK: class_id) ─────────────────────────────
export const MOCK_SESSIONS: Session[] = [
  // --- Class c1: Jaringan ---
  { id: "s1",  class_id: "c1", title: "Sesi 1",  date: "2026-01-27", location: "Lab A", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.2, location_lng: 106.8, created_at: "2026-01-27T07:00:00Z" },
  { id: "s2",  class_id: "c1", title: "Sesi 2",  date: "2026-02-03", location: "Lab A", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.2, location_lng: 106.8, created_at: "2026-02-03T07:00:00Z" },
  { id: "s3",  class_id: "c1", title: "Sesi 3",  date: "2026-02-10", location: "Lab A", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.2, location_lng: 106.8, created_at: "2026-02-10T07:00:00Z" },
  { id: "s4",  class_id: "c1", title: "Sesi 4",  date: "2026-02-17", location: "Lab A", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.2, location_lng: 106.8, created_at: "2026-02-17T07:00:00Z" },
  { id: "s5",  class_id: "c1", title: "Sesi 5",  date: "2026-02-24", location: "Lab A", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.2, location_lng: 106.8, created_at: "2026-02-24T07:00:00Z" },
  { id: "s6",  class_id: "c1", title: "Sesi 6",  date: "2026-02-28", location: "Lab A", radius_meters: 100, duration_minutes: 90, is_active: true,  expires_at: "2026-02-28T10:00:00Z", location_lat: -6.2, location_lng: 106.8, created_at: "2026-02-28T07:00:00Z" },
  // --- Class c2: Basis Data ---
  { id: "s7",  class_id: "c2", title: "Sesi 1",  date: "2026-01-28", location: "Lab 01", radius_meters: 80, duration_minutes: 120, is_active: false, expires_at: null, location_lat: -6.21, location_lng: 106.81, created_at: "2026-01-28T07:00:00Z" },
  { id: "s8",  class_id: "c2", title: "Sesi 2",  date: "2026-02-04", location: "Lab 01", radius_meters: 80, duration_minutes: 120, is_active: false, expires_at: null, location_lat: -6.21, location_lng: 106.81, created_at: "2026-02-04T07:00:00Z" },
  { id: "s9",  class_id: "c2", title: "Sesi 3",  date: "2026-02-11", location: "Lab 01", radius_meters: 80, duration_minutes: 120, is_active: false, expires_at: null, location_lat: -6.21, location_lng: 106.81, created_at: "2026-02-11T07:00:00Z" },
  { id: "s10", class_id: "c2", title: "Sesi 4",  date: "2026-02-18", location: "Lab 01", radius_meters: 80, duration_minutes: 120, is_active: false, expires_at: null, location_lat: -6.21, location_lng: 106.81, created_at: "2026-02-18T07:00:00Z" },
  // --- Class c3: Sistem Operasi ---
  { id: "s11", class_id: "c3", title: "Sesi 1",  date: "2026-01-29", location: "Lab 05", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.22, location_lng: 106.82, created_at: "2026-01-29T07:00:00Z" },
  { id: "s12", class_id: "c3", title: "Sesi 2",  date: "2026-02-05", location: "Lab 05", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.22, location_lng: 106.82, created_at: "2026-02-05T07:00:00Z" },
  { id: "s13", class_id: "c3", title: "Sesi 3",  date: "2026-02-12", location: "Lab 05", radius_meters: 100, duration_minutes: 90, is_active: false, expires_at: null, location_lat: -6.22, location_lng: 106.82, created_at: "2026-02-12T07:00:00Z" },
  // --- Class c4: Pengembangan Website ---
  { id: "s14", class_id: "c4", title: "Sesi 1",  date: "2026-01-28", location: "LABTEK 1", radius_meters: 100, duration_minutes: 100, is_active: false, expires_at: null, location_lat: -6.195, location_lng: 106.823, created_at: "2026-01-28T07:30:00Z" },
  { id: "s15", class_id: "c4", title: "Sesi 2",  date: "2026-02-04", location: "LABTEK 1", radius_meters: 100, duration_minutes: 100, is_active: false, expires_at: null, location_lat: -6.195, location_lng: 106.823, created_at: "2026-02-04T07:30:00Z" },
  { id: "s16", class_id: "c4", title: "Sesi 3",  date: "2026-02-11", location: "LABTEK 1", radius_meters: 100, duration_minutes: 100, is_active: false, expires_at: null, location_lat: -6.195, location_lng: 106.823, created_at: "2026-02-11T07:30:00Z" },
  { id: "s17", class_id: "c4", title: "Sesi 4",  date: "2026-02-18", location: "LABTEK 1", radius_meters: 100, duration_minutes: 100, is_active: false, expires_at: null, location_lat: -6.195, location_lng: 106.823, created_at: "2026-02-18T07:30:00Z" },
  { id: "s18", class_id: "c4", title: "Sesi 5",  date: "2026-02-25", location: "LABTEK 1", radius_meters: 100, duration_minutes: 100, is_active: false, expires_at: null, location_lat: -6.195, location_lng: 106.823, created_at: "2026-02-25T07:30:00Z" },
  { id: "s19", class_id: "c4", title: "Sesi 6",  date: "2026-02-28", location: "LABTEK 1", radius_meters: 100, duration_minutes: 100, is_active: false, expires_at: null, location_lat: -6.195, location_lng: 106.823, created_at: "2026-02-28T07:30:00Z" },
];

// ── ENROLLMENTS (FK: class_id + user_id) ───────────────
export const MOCK_ENROLLMENTS: Enrollment[] = [
  // Class c1 — 10 mahasiswa
  ...(["u1","u2","u3","u4","u5","u6","u7","u8","u9","u10"] as const).map((uid, i) => ({
    id: `e_c1_${uid}`, class_id: "c1", user_id: uid,
    enrolled_at: "2026-01-20T08:00:00Z", is_eligible: null, peran: "mahasiswa" as const,
  })),
  // Class c2 — 8 mahasiswa
  ...(["u1","u2","u3","u4","u5","u6","u7","u8"] as const).map((uid) => ({
    id: `e_c2_${uid}`, class_id: "c2", user_id: uid,
    enrolled_at: "2026-01-20T08:00:00Z", is_eligible: null, peran: "mahasiswa" as const,
  })),
  // Class c3 — 7 mahasiswa
  ...(["u1","u3","u4","u5","u7","u8","u9"] as const).map((uid) => ({
    id: `e_c3_${uid}`, class_id: "c3", user_id: uid,
    enrolled_at: "2026-01-20T08:00:00Z", is_eligible: null, peran: "mahasiswa" as const,
  })),
  // Class c4 — 9 mahasiswa
  ...(["u1","u2","u3","u4","u5","u6","u7","u8","u9"] as const).map((uid) => ({
    id: `e_c4_${uid}`, class_id: "c4", user_id: uid,
    enrolled_at: "2026-01-20T08:00:00Z", is_eligible: null, peran: "mahasiswa" as const,
  })),
];

// ── ATTENDANCES (FK: session_id + user_id) ─────────────
// Helper to make attendance records
const mkAtt = (
  id: string, sid: string, uid: string,
  status: "hadir"|"telat"|"absen"|"ditolak",
  dist: number|null, time: string|null
): Attendance => ({
  id, session_id: sid, user_id: uid, status,
  distance_meters: dist,
  checked_in_at: time,
  student_lat: dist ? -6.2 + Math.random() * 0.001 : null,
  student_lng: dist ? 106.8 + Math.random() * 0.001 : null,
  created_at: time ?? new Date().toISOString(),
});

export const MOCK_ATTENDANCES: Attendance[] = [
  // ── Sesi 1 (s1, class c1) ──
  mkAtt("a1",  "s1","u1","hadir",   18, "2026-01-27T08:12:00Z"),
  mkAtt("a2",  "s1","u2","hadir",   32, "2026-01-27T08:15:00Z"),
  mkAtt("a3",  "s1","u3","absen",   null, null),
  mkAtt("a4",  "s1","u4","hadir",   9,  "2026-01-27T08:05:00Z"),
  mkAtt("a5",  "s1","u5","telat",   55, "2026-01-27T08:52:00Z"),
  mkAtt("a6",  "s1","u6","hadir",   22, "2026-01-27T08:08:00Z"),
  mkAtt("a7",  "s1","u7","hadir",   14, "2026-01-27T08:11:00Z"),
  mkAtt("a8",  "s1","u8","absen",   null, null),
  mkAtt("a9",  "s1","u9","hadir",   38, "2026-01-27T08:20:00Z"),
  mkAtt("a10", "s1","u10","ditolak",145, "2026-01-27T08:30:00Z"),

  // ── Sesi 2 (s2) ──
  mkAtt("b1",  "s2","u1","hadir",   12, "2026-02-03T08:10:00Z"),
  mkAtt("b2",  "s2","u2","telat",   45, "2026-02-03T08:50:00Z"),
  mkAtt("b3",  "s2","u3","hadir",   20, "2026-02-03T08:07:00Z"),
  mkAtt("b4",  "s2","u4","hadir",   8,  "2026-02-03T08:03:00Z"),
  mkAtt("b5",  "s2","u5","hadir",   33, "2026-02-03T08:18:00Z"),
  mkAtt("b6",  "s2","u6","absen",   null, null),
  mkAtt("b7",  "s2","u7","hadir",   17, "2026-02-03T08:14:00Z"),
  mkAtt("b8",  "s2","u8","hadir",   28, "2026-02-03T08:22:00Z"),
  mkAtt("b9",  "s2","u9","absen",   null, null),
  mkAtt("b10", "s2","u10","hadir",  41, "2026-02-03T08:25:00Z"),

  // ── Sesi 3 (s3) ──
  mkAtt("c1",  "s3","u1","hadir",   15, "2026-02-10T08:08:00Z"),
  mkAtt("c2",  "s3","u2","hadir",   29, "2026-02-10T08:11:00Z"),
  mkAtt("c3",  "s3","u3","telat",   67, "2026-02-10T08:48:00Z"),
  mkAtt("c4",  "s3","u4","hadir",   11, "2026-02-10T08:04:00Z"),
  mkAtt("c5",  "s3","u5","hadir",   25, "2026-02-10T08:16:00Z"),
  mkAtt("c6",  "s3","u6","hadir",   19, "2026-02-10T08:09:00Z"),
  mkAtt("c7",  "s3","u7","absen",   null, null),
  mkAtt("c8",  "s3","u8","hadir",   35, "2026-02-10T08:20:00Z"),
  mkAtt("c9",  "s3","u9","hadir",   22, "2026-02-10T08:13:00Z"),
  mkAtt("c10", "s3","u10","hadir",  44, "2026-02-10T08:28:00Z"),

  // ── Sesi 4 (s4) ──
  mkAtt("d1",  "s4","u1","hadir",   10, "2026-02-17T08:05:00Z"),
  mkAtt("d2",  "s4","u2","absen",   null, null),
  mkAtt("d3",  "s4","u3","hadir",   18, "2026-02-17T08:09:00Z"),
  mkAtt("d4",  "s4","u4","hadir",   7,  "2026-02-17T08:02:00Z"),
  mkAtt("d5",  "s4","u5","ditolak", 130, "2026-02-17T08:45:00Z"),
  mkAtt("d6",  "s4","u6","hadir",   24, "2026-02-17T08:12:00Z"),
  mkAtt("d7",  "s4","u7","hadir",   16, "2026-02-17T08:07:00Z"),
  mkAtt("d8",  "s4","u8","hadir",   31, "2026-02-17T08:19:00Z"),
  mkAtt("d9",  "s4","u9","telat",   60, "2026-02-17T08:55:00Z"),
  mkAtt("d10", "s4","u10","hadir",  38, "2026-02-17T08:24:00Z"),

  // ── Sesi 5 (s5) ──
  mkAtt("e1",  "s5","u1","hadir",   14, "2026-02-24T08:06:00Z"),
  mkAtt("e2",  "s5","u2","hadir",   26, "2026-02-24T08:13:00Z"),
  mkAtt("e3",  "s5","u3","hadir",   21, "2026-02-24T08:10:00Z"),
  mkAtt("e4",  "s5","u4","telat",   55, "2026-02-24T08:53:00Z"),
  mkAtt("e5",  "s5","u5","hadir",   28, "2026-02-24T08:17:00Z"),
  mkAtt("e6",  "s5","u6","hadir",   15, "2026-02-24T08:08:00Z"),
  mkAtt("e7",  "s5","u7","hadir",   19, "2026-02-24T08:11:00Z"),
  mkAtt("e8",  "s5","u8","absen",   null, null),
  mkAtt("e9",  "s5","u9","hadir",   33, "2026-02-24T08:21:00Z"),
  mkAtt("e10", "s5","u10","hadir",  42, "2026-02-24T08:29:00Z"),

  // ── Sesi 6 (s6) — LIVE ──
  mkAtt("f1",  "s6","u1","hadir",   18, "2026-02-28T08:12:00Z"),
  mkAtt("f2",  "s6","u2","hadir",   35, "2026-02-28T08:15:00Z"),
  // u3, u4, u5, u6... belum check-in (sesi masih aktif)

  // ── Class c4: Pengembangan Website (s14–s19) ──
  // Sesi 1 (s14)
  mkAtt("pw1",  "s14","u1","hadir",   15, "2026-01-28T08:10:00Z"),
  mkAtt("pw2",  "s14","u2","hadir",   22, "2026-01-28T08:13:00Z"),
  mkAtt("pw3",  "s14","u3","telat",   55, "2026-01-28T08:50:00Z"),
  mkAtt("pw4",  "s14","u4","hadir",   8,  "2026-01-28T08:04:00Z"),
  mkAtt("pw5",  "s14","u5","hadir",   30, "2026-01-28T08:17:00Z"),
  mkAtt("pw6",  "s14","u6","hadir",   20, "2026-01-28T08:11:00Z"),
  mkAtt("pw7",  "s14","u7","hadir",   14, "2026-01-28T08:08:00Z"),
  mkAtt("pw8",  "s14","u8","hadir",   35, "2026-01-28T08:20:00Z"),
  mkAtt("pw9",  "s14","u9","absen",   null, null),
  // Sesi 2 (s15)
  mkAtt("pw10", "s15","u1","hadir",   12, "2026-02-04T08:09:00Z"),
  mkAtt("pw11", "s15","u2","hadir",   28, "2026-02-04T08:15:00Z"),
  mkAtt("pw12", "s15","u3","hadir",   18, "2026-02-04T08:10:00Z"),
  mkAtt("pw13", "s15","u4","hadir",   7,  "2026-02-04T08:03:00Z"),
  mkAtt("pw14", "s15","u5","absen",   null, null),
  mkAtt("pw15", "s15","u6","hadir",   25, "2026-02-04T08:14:00Z"),
  mkAtt("pw16", "s15","u7","hadir",   16, "2026-02-04T08:09:00Z"),
  mkAtt("pw17", "s15","u8","hadir",   32, "2026-02-04T08:19:00Z"),
  mkAtt("pw18", "s15","u9","hadir",   40, "2026-02-04T08:25:00Z"),
  // Sesi 3 (s16)
  mkAtt("pw19", "s16","u1","hadir",   10, "2026-02-11T08:06:00Z"),
  mkAtt("pw20", "s16","u2","hadir",   24, "2026-02-11T08:13:00Z"),
  mkAtt("pw21", "s16","u3","hadir",   20, "2026-02-11T08:11:00Z"),
  mkAtt("pw22", "s16","u4","telat",   65, "2026-02-11T08:53:00Z"),
  mkAtt("pw23", "s16","u5","hadir",   28, "2026-02-11T08:15:00Z"),
  mkAtt("pw24", "s16","u6","hadir",   17, "2026-02-11T08:10:00Z"),
  mkAtt("pw25", "s16","u7","absen",   null, null),
  mkAtt("pw26", "s16","u8","hadir",   38, "2026-02-11T08:22:00Z"),
  mkAtt("pw27", "s16","u9","absen",   null, null),
  // Sesi 4 (s17)
  mkAtt("pw28", "s17","u1","hadir",   14, "2026-02-18T08:08:00Z"),
  mkAtt("pw29", "s17","u2","absen",   null, null),
  mkAtt("pw30", "s17","u3","hadir",   19, "2026-02-18T08:11:00Z"),
  mkAtt("pw31", "s17","u4","hadir",   9,  "2026-02-18T08:05:00Z"),
  mkAtt("pw32", "s17","u5","hadir",   31, "2026-02-18T08:18:00Z"),
  mkAtt("pw33", "s17","u6","telat",   58, "2026-02-18T08:51:00Z"),
  mkAtt("pw34", "s17","u7","hadir",   22, "2026-02-18T08:13:00Z"),
  mkAtt("pw35", "s17","u8","hadir",   29, "2026-02-18T08:17:00Z"),
  mkAtt("pw36", "s17","u9","absen",   null, null),
  // Sesi 5 (s18)
  mkAtt("pw37", "s18","u1","hadir",   11, "2026-02-25T08:07:00Z"),
  mkAtt("pw38", "s18","u2","hadir",   26, "2026-02-25T08:14:00Z"),
  mkAtt("pw39", "s18","u3","hadir",   21, "2026-02-25T08:12:00Z"),
  mkAtt("pw40", "s18","u4","hadir",   8,  "2026-02-25T08:04:00Z"),
  mkAtt("pw41", "s18","u5","absen",   null, null),
  mkAtt("pw42", "s18","u6","hadir",   18, "2026-02-25T08:10:00Z"),
  mkAtt("pw43", "s18","u7","ditolak", 142, "2026-02-25T08:35:00Z"),
  mkAtt("pw44", "s18","u8","hadir",   34, "2026-02-25T08:21:00Z"),
  mkAtt("pw45", "s18","u9","hadir",   44, "2026-02-25T08:27:00Z"),
  // Sesi 6 (s19)
  mkAtt("pw46", "s19","u1","hadir",   13, "2026-02-28T08:08:00Z"),
  mkAtt("pw47", "s19","u2","hadir",   27, "2026-02-28T08:15:00Z"),
  mkAtt("pw48", "s19","u3","hadir",   17, "2026-02-28T08:10:00Z"),
  mkAtt("pw49", "s19","u4","hadir",   6,  "2026-02-28T08:03:00Z"),
  mkAtt("pw50", "s19","u5","hadir",   29, "2026-02-28T08:16:00Z"),
  mkAtt("pw51", "s19","u6","hadir",   22, "2026-02-28T08:12:00Z"),
  mkAtt("pw52", "s19","u7","hadir",   15, "2026-02-28T08:09:00Z"),
  mkAtt("pw53", "s19","u8","absen",   null, null),
  mkAtt("pw54", "s19","u9","absen",   null, null),

  // ── Class c2 sessions (s7–s10) ──
  mkAtt("g1","s7","u1","hadir",12,"2026-01-28T08:10:00Z"),
  mkAtt("g2","s7","u2","hadir",25,"2026-01-28T08:13:00Z"),
  mkAtt("g3","s7","u3","absen",null,null),
  mkAtt("g4","s7","u4","hadir",8,"2026-01-28T08:04:00Z"),
  mkAtt("g5","s7","u5","telat",67,"2026-01-28T08:51:00Z"),
  mkAtt("g6","s7","u6","hadir",20,"2026-01-28T08:09:00Z"),
  mkAtt("g7","s7","u7","hadir",15,"2026-01-28T08:07:00Z"),
  mkAtt("g8","s7","u8","hadir",32,"2026-01-28T08:18:00Z"),

  mkAtt("h1","s8","u1","hadir",10,"2026-02-04T08:07:00Z"),
  mkAtt("h2","s8","u2","telat",55,"2026-02-04T08:48:00Z"),
  mkAtt("h3","s8","u3","hadir",18,"2026-02-04T08:09:00Z"),
  mkAtt("h4","s8","u4","hadir",7,"2026-02-04T08:02:00Z"),
  mkAtt("h5","s8","u5","hadir",29,"2026-02-04T08:15:00Z"),
  mkAtt("h6","s8","u6","absen",null,null),
  mkAtt("h7","s8","u7","hadir",22,"2026-02-04T08:11:00Z"),
  mkAtt("h8","s8","u8","hadir",38,"2026-02-04T08:22:00Z"),
];

// ── COMPUTED HELPERS ────────────────────────────────────

/** Ambil semua session milik suatu kelas */
export function getSessionsByClass(classId: string): Session[] {
  return MOCK_SESSIONS.filter((s) => s.class_id === classId);
}

/** Ambil semua user yang enroll di suatu kelas */
export function getEnrolledUsers(classId: string): User[] {
  const enrolled = MOCK_ENROLLMENTS.filter((e) => e.class_id === classId);
  return enrolled.map((e) => MOCK_USERS.find((u) => u.id === e.user_id)!).filter(Boolean);
}

/** Hitung rekap absensi per mahasiswa untuk satu kelas */
export function computeStudentSummaries(classId: string): StudentAttendanceSummary[] {
  const sessions = getSessionsByClass(classId);
  const enrolled = MOCK_ENROLLMENTS.filter((e) => e.class_id === classId);
  const kelas = MOCK_CLASSES.find((c) => c.id === classId);
  if (!kelas || enrolled.length === 0) return [];

  return enrolled.map((enrollment) => {
    const user = MOCK_USERS.find((u) => u.id === enrollment.user_id)!;
    const attendanceMap: Record<string, Attendance | null> = {};

    sessions.forEach((sess) => {
      const att = MOCK_ATTENDANCES.find(
        (a) => a.session_id === sess.id && a.user_id === enrollment.user_id
      ) ?? null;
      attendanceMap[sess.id] = att;
    });

    const values = Object.values(attendanceMap);
    const completedSessions = sessions.filter((s) => !s.is_active);
    const total_hadir   = values.filter((a) => a?.status === "hadir").length;
    const total_telat   = values.filter((a) => a?.status === "telat").length;
    const total_absen   = values.filter((a) => a?.status === "absen" || a === null).length;
    const total_ditolak = values.filter((a) => a?.status === "ditolak").length;
    const effective_hadir = total_hadir + total_telat; // telat tetap dihitung hadir
    // Pakai total_sessions_planned sebagai penyebut agar % dinamis sejak awal semester
    const denominator = kelas.total_sessions_planned > 0 ? kelas.total_sessions_planned : completedSessions.length;
    const attendance_pct = denominator > 0
      ? Math.round((effective_hadir / denominator) * 100)
      : 0;
    const is_eligible = attendance_pct >= kelas.min_attendance_pct;

    return { user, enrollment, attendanceMap, total_hadir, total_telat, total_absen, total_ditolak, attendance_pct, is_eligible };
  }).sort((a, b) => b.attendance_pct - a.attendance_pct);
}

// -- NEW HELPERS for detail mahasiswa & enhanced list --

export interface StudentClassSummary {
  kelas: PraktikumClass;
  enrollment: Enrollment;
  total_sessions: number;
  completed_sessions: number;
  total_hadir: number;
  total_telat: number;
  attendance_pct: number;
  is_eligible: boolean;
}

export interface AttendanceHistoryRow {
  session: Session;
  kelas: PraktikumClass;
  attendance: Attendance | null;
}

export interface LowAttendanceAlert {
  user: User;
  kelas: PraktikumClass;
  attendance_pct: number;
  min_pct: number;
}

export function getStudentClassSummaries(userId: string): StudentClassSummary[] {
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.user_id === userId);
  return enrollments.map((enrollment) => {
    const kelas = MOCK_CLASSES.find((c) => c.id === enrollment.class_id)!;
    const sessions = MOCK_SESSIONS.filter((s) => s.class_id === kelas.id);
    const completedSessions = sessions.filter((s) => !s.is_active);
    const atts = MOCK_ATTENDANCES.filter(
      (a) => a.user_id === userId && sessions.some((s) => s.id === a.session_id)
    );
    const total_hadir = atts.filter((a) => a.status === "hadir").length;
    const total_telat = atts.filter((a) => a.status === "telat").length;
    // Pakai total_sessions_planned sebagai penyebut agar % dinamis
    const denominator = kelas.total_sessions_planned > 0 ? kelas.total_sessions_planned : completedSessions.length;
    const pct = denominator > 0
      ? Math.round(((total_hadir + total_telat) / denominator) * 100)
      : 0;
    return {
      kelas, enrollment,
      total_sessions: sessions.length,
      completed_sessions: completedSessions.length,
      total_hadir, total_telat,
      attendance_pct: pct,
      is_eligible: pct >= kelas.min_attendance_pct,
    };
  });
}

export function getStudentAttendanceHistory(userId: string): AttendanceHistoryRow[] {
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.user_id === userId);
  const rows: AttendanceHistoryRow[] = [];
  enrollments.forEach((e) => {
    const kelas = MOCK_CLASSES.find((c) => c.id === e.class_id)!;
    const sessions = MOCK_SESSIONS.filter((s) => s.class_id === kelas.id);
    sessions.forEach((session) => {
      const attendance = MOCK_ATTENDANCES.find(
        (a) => a.session_id === session.id && a.user_id === userId
      ) ?? null;
      rows.push({ session, kelas, attendance });
    });
  });
  return rows.sort((a, b) => b.session.date.localeCompare(a.session.date));
}

export function getStudentClassBadges(userId: string): PraktikumClass[] {
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.user_id === userId);
  return enrollments.map((e) => MOCK_CLASSES.find((c) => c.id === e.class_id)!).filter(Boolean);
}

export function getLowAttendanceAlerts(): LowAttendanceAlert[] {
  const alerts: LowAttendanceAlert[] = [];
  MOCK_CLASSES.forEach((kelas) => {
    const summaries = computeStudentSummaries(kelas.id);
    summaries.forEach((s) => {
      if (s.user.role === "mahasiswa" && !s.is_eligible) {
        alerts.push({ user: s.user, kelas, attendance_pct: s.attendance_pct, min_pct: kelas.min_attendance_pct });
      }
    });
  });
  return alerts.sort((a, b) => a.attendance_pct - b.attendance_pct);
}
