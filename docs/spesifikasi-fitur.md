# PresensLab — Spesifikasi Fitur Lengkap

> **Versi:** 0.1.0  
> **Tech Stack:** Next.js 16.1.6 · React 19 · Supabase · Upstash Redis · TypeScript · Tailwind CSS v4

---

## Daftar Isi

1. [Gambaran Sistem](#1-gambaran-sistem)
2. [Peran Pengguna (Roles)](#2-peran-pengguna-roles)
3. [Fitur Fungsional](#3-fitur-fungsional)
   - [3.1 Autentikasi & Otorisasi](#31-autentikasi--otorisasi)
   - [3.2 Halaman Presensi Mahasiswa](#32-halaman-presensi-mahasiswa)
   - [3.3 Dashboard Staff](#33-dashboard-staff)
   - [3.4 Manajemen Kelas](#34-manajemen-kelas)
   - [3.5 Manajemen Sesi Praktikum](#35-manajemen-sesi-praktikum)
   - [3.6 Absensi — Check-in](#36-absensi--check-in)
   - [3.7 Manajemen Mahasiswa](#37-manajemen-mahasiswa)
   - [3.8 Ekspor Data](#38-ekspor-data)
4. [Fitur Non-Fungsional](#4-fitur-non-fungsional)
   - [4.1 Keamanan](#41-keamanan)
   - [4.2 Performa & Caching](#42-performa--caching)
   - [4.3 Validasi Input](#43-validasi-input)
   - [4.4 Penanganan Error](#44-penanganan-error)
   - [4.5 Database & RLS](#45-database--rls)
   - [4.6 Aksesibilitas & UX](#46-aksesibilitas--ux)
5. [API Endpoint Reference](#5-api-endpoint-reference)
6. [Struktur Database](#6-struktur-database)

---

## 1. Gambaran Sistem

PresensLab adalah sistem manajemen presensi digital untuk kegiatan praktikum di laboratorium kampus. Sistem ini memungkinkan:

- **Mahasiswa** melakukan absensi mandiri secara real-time dengan validasi lokasi GPS
- **Dosen & Asisten** mengelola sesi praktikum, mengaktifkan/menonaktifkan absensi, dan memantau kehadiran secara langsung
- **Admin** memiliki akses penuh ke seluruh data dan pengaturan sistem

Sistem berjalan sebagai web application berbasis Next.js dengan backend serverless (API Routes), database PostgreSQL via Supabase, dan caching melalui Upstash Redis.

---

## 2. Peran Pengguna (Roles)

| Role | Deskripsi | Akses Utama |
|------|-----------|-------------|
| `mahasiswa` | Peserta praktikum | Halaman `/presensi` — check-in absensi |
| `asisten` | Asisten praktikum | Dashboard — kelola sesi, lihat absensi kelas sendiri |
| `dosen` | Dosen pengampu | Dashboard — semua fitur manajemen kelas + sesi |
| `admin` | Administrator sistem | Akses penuh seluruh sistem |

---

## 3. Fitur Fungsional

### 3.1 Autentikasi & Otorisasi

#### Login
- Login menggunakan email & password via Supabase Auth
- Mendukung provider `email` (dan siap diperluas ke OAuth)
- Sesi disimpan di cookie HttpOnly (SSR-compatible via `@supabase/ssr`)
- Redirect otomatis setelah login berhasil berdasarkan role:
  - Mahasiswa → `/presensi`
  - Staff/Admin → `/dashboard`

#### Logout
- Logout membersihkan sesi di sisi client (browser localStorage) DAN server (cookie)
- Diimplementasikan via `supabase.auth.signOut()` langsung dari browser client
- `AuthContext` menerima event `SIGNED_OUT` secara real-time via `onAuthStateChange`

#### Proteksi Route (Middleware)
- `/dashboard/**` — hanya user yang sudah login; redirect ke `/login` jika belum
- `/api/**` (kecuali `/api/auth/*`) — kembalikan `401 UNAUTHORIZED` jika tidak ada sesi
- `/login`, `/presensi`, `/` — publik, tidak memerlukan autentikasi

#### Mode Dev Login (Development Only)
- Form email+password tambahan tersedia di `/login` dan `/presensi` saat `NODE_ENV === "development"`
- Ditandai badge DEV kuning, tidak muncul di production
- Memudahkan testing tanpa harus menggunakan Google SSO

---

### 3.2 Halaman Presensi Mahasiswa (`/presensi`)

Halaman utama bagi mahasiswa untuk melakukan absensi. Tidak memerlukan login terlebih dahulu untuk membuka halaman, namun login wajib sebelum check-in.

#### Status States Halaman
| State | Tampilan |
|-------|----------|
| `loading` | Spinner loading |
| `not-logged-in` | Prompt login / form dev login |
| `logged-in` | UI presensi lengkap |

#### Alur Check-in Mahasiswa
1. **Cek sesi aktif** — sistem secara otomatis memuat sesi aktif via `GET /api/sessions/active`
2. **Tampil informasi sesi** — judul sesi, mata kuliah, lokasi, radius, countdown timer
3. **Minta izin GPS** — browser meminta akses lokasi perangkat
4. **Ambil koordinat** — sistem mengambil GPS dengan validasi akurasi (< 100 meter)
5. **Tampil DistanceBar** — visualisasi jarak mahasiswa ke titik pusat absensi secara real-time
6. **Konfirmasi** — mahasiswa menekan tombol untuk mengirim absensi
7. **Submit** — request dikirim ke `POST /api/attendance/checkin`
8. **Feedback** — tampil status sukses / error yang spesifik

#### Check-in States (Error Handling UI)
| State | Pesan Pengguna |
|-------|----------------|
| `getting-gps` | Sedang mengambil lokasi GPS |
| `confirming` | Konfirmasi check-in dengan jarak ke titik |
| `submitting` | Sedang mengirim... |
| `success` | Absensi berhasil dicatat |
| `error-not-open` | Absensi belum dibuka |
| `error-expired` | Waktu absensi sudah habis |
| `error-out-of-range` | Di luar radius, dengan keterangan jarak |
| `error-already-checked-in` | Sudah absen sebelumnya |
| `error-gps-denied` | Izin lokasi ditolak |
| `error-gps-weak` | Sinyal GPS lemah (akurasi > 100m) |
| `error-gps-timeout` | Timeout saat mengambil GPS |

#### Komponen UI Presensi
- **CountdownTimer** — hitung mundur real-time sampai sesi berakhir
- **DistanceBar** — progress bar visual jarak mahasiswa vs radius izin
- **BlobBackground** — background animasi gradient
- **GlassCard / GlassButton** — komponen UI kaca (glassmorphism)
- **ToastContainer** — notifikasi pop-up non-blocking

---

### 3.3 Dashboard Staff (`/dashboard`)

Halaman utama dashboard untuk dosen, asisten, dan admin.

#### Statistik Ringkasan (StatCards)
| Kartu | Data |
|-------|------|
| Total Sesi | Jumlah total sesi praktikum seluruh kelas |
| Total Mahasiswa | Jumlah user dengan role `mahasiswa` |
| Rata-rata Kehadiran | Persentase hadir dari total semua record absensi |
| Sesi Hari Ini | Jumlah sesi dengan `session_date` = hari ini |

#### Panel Aktivasi Absensi (Staff Only)
- Rentang fitur berbeda berdasarkan `activateState`:
  - `idle` — pilih sesi untuk diaktifkan
  - `active` — tampil live attendance list, tombol perpanjang & nonaktifkan
  - `expired` — sesi telah berakhir
- Komponen: `ActivateAttendance`, `LiveAttendanceList`, `SessionManager`

#### Live Attendance List
- Update real-time saat mahasiswa check-in (Supabase Realtime subscription)
- Tampil nama, NIM, waktu check-in, status (hadir/telat)

---

### 3.4 Manajemen Kelas (`/dashboard/kelas`)

#### Daftar Kelas
- Tampil semua kelas yang diikuti user (via `GET /api/classes`)
- Untuk setiap kelas tampil: kode, nama, semester, lokasi, jumlah sesi, status aktif
- Filter berdasarkan role: mahasiswa hanya lihat kelas sendiri, staff lihat semua kelas yang mereka ampu

#### Buat Kelas Baru (Dosen/Asisten/Admin)
Form inline di halaman dengan field:
- Nama kelas (min. 2 karakter, wajib)
- Kode kelas (wajib)
- Semester
- Dosen pengampu
- Lokasi lab
- Total sesi yang direncanakan (1–100)
- Minimum persentase kehadiran (1–100)

#### Detail Kelas (`/dashboard/kelas/[id]`)
- Informasi lengkap kelas
- Daftar sesi praktikum dalam kelas tersebut
- Navigasi ke detail sesi

---

### 3.5 Manajemen Sesi Praktikum

#### Buat Sesi Baru (`POST /api/sessions/create`)
Dosen membuat sesi baru dengan:
- `class_id` — kelas tempat sesi dibuat
- `title` — judul sesi (min. 3 karakter)
- `description` — deskripsi opsional
- `session_date` — tanggal sesi (format `YYYY-MM-DD`)
- `location` — lokasi opsional (override lokasi default kelas)

#### Aktivasi Absensi (`POST /api/sessions/activate`)
Saat dosen/asisten mengaktifkan absensi:
- Koordinat GPS titik pusat (`lat`, `lng`) wajib diisi
- Radius izin dalam meter (10–1000 m, default 100 m)
- Durasi absensi dalam menit (5–480 menit, default 30 menit)
- Batas telat opsional (`late_after_minutes`, 1–120 menit) — mahasiswa yang check-in setelah batas ini dicatat `telat`
- Sistem otomatis menonaktifkan sesi aktif lain di kelas yang sama
- Sesi tidak aktif menjadi aktif, `expires_at` dihitung dari sekarang + durasi

#### Nonaktifkan Sesi (`POST /api/sessions/deactivate`)
- Hanya bisa dilakukan oleh yang mengaktifkan sesi, atau admin
- Sesi ditandai `is_active: false`, `deactivated_at` dicatat

#### Perpanjang Waktu Sesi (`POST /api/sessions/extend`)
- Perpanjangan 1–120 menit
- `expires_at` baru dihitung dari waktu kadaluarsa setokens (bukan dari now)
- Wewenang: yang mengaktifkan sesi atau admin

#### Cek Sesi Aktif (`GET /api/sessions/active`)
- Tersedia untuk semua user yang login (termasuk mahasiswa)
- Kembalikan satu sesi aktif terbaru yang belum expired
- Jika tidak ada sesi aktif, kembalikan `null` (bukan error)

#### Detail Sesi (`/dashboard/kelas/[id]/sesi/[sesiId]`)
- Rincian sesi: judul, tanggal, status, waktu ekspirasi
- Daftar presensi mahasiswa untuk sesi tersebut

---

### 3.6 Absensi — Check-in

**Endpoint:** `POST /api/attendance/checkin`

#### Validation Chain (Server-side, berurutan)
1. **Auth check** — user harus login
2. **Rate limit** — max 3 percobaan per 60 detik per user (sliding window, Upstash Redis)
3. **Validate body** — `session_id` (UUID), `lat` (-90 s/d 90), `lng` (-180 s/d 180)
4. **Fetch sesi** — sesi harus ada (RLS: user harus terdaftar di kelas)
5. **Cek `is_active`** — sesi harus sedang aktif
6. **Cek `expires_at`** — sesi belum kadaluarsa
7. **Hitung jarak** — Haversine formula (titik mahasiswa vs titik sesi)
8. **Cek radius** — mahasiswa harus dalam radius yang ditentukan
9. **Cek duplikat** — mahasiswa belum pernah absen di sesi ini
10. **Insert attendance** — simpan record dengan status `hadir`/`telat`

#### Status Absensi
- `hadir` — check-in dilakukan sebelum batas waktu `late_after_minutes` tercapai
- `telat` — check-in dilakukan setelah `activated_at + late_after_minutes` terlewati (jika field ini diisi saat aktivasi)
- `absen` — mahasiswa tidak check-in; dapat di-set secara manual oleh dosen/asisten via update attendance
- `ditolak` — check-in ditolak oleh dosen (override manual, field `rejected_reason` menyimpan alasan)

> **Catatan:** Status `absen` dan `ditolak` dikelola secara manual oleh staff. Belum ada scheduled job otomatis yang menandai `absen` ketika sesi berakhir.

---

### 3.7 Manajemen Mahasiswa (`/dashboard/mahasiswa`)

#### Daftar Mahasiswa
- Tampil semua mahasiswa yang terdaftar di sistem
- Paginasi (10 per halaman)
- Pencarian berdasarkan nama atau NIM

#### Detail Mahasiswa (`/dashboard/mahasiswa/[id]`)
- Data profil: nama, NIM, avatar
- Daftar kelas yang diikuti beserta peran
- Statistik kehadiran per kelas:
  - Jumlah hadir vs total sesi
  - Persentase kehadiran
  - Status eligibilitas (memenuhi minimum kehadiran atau tidak)

#### Enrollment (Daftar Anggota Kelas)
- `GET /api/classes/[id]/enrollments` — daftar semua user di kelas (dosen/asisten kelas only)
- `POST /api/classes/[id]/enrollments` — tambah user ke kelas
- `DELETE /api/classes/[id]/enrollments/[userId]` — hapus user dari kelas

---

### 3.8 Ekspor Data (`/dashboard/export`)

#### Jenis Laporan
| Tipe | Deskripsi |
|------|-----------|
| Semua Data Absensi | Seluruh riwayat kehadiran semua sesi |
| Per Sesi Praktikum | Rekap kehadiran berdasarkan sesi tertentu |
| Per Mahasiswa | Rekap kehadiran per individu |
| Rekap Bulanan | Ringkasan statistik kehadiran per bulan |

#### Filter Ekspor
- Pilih kelas (dropdown — semua kelas atau satu kelas)
- Rentang tanggal (dari - sampai)
- Format: **CSV** (default), dengan tombol **Print** untuk cetak langsung

#### Preview Statistik
Sebelum ekspor, tampil mini-stats:
- Total record absensi sesuai filter
- Jumlah sesi yang tercakup

#### Format CSV
- Kolom: NIM, Nama Mahasiswa, Sesi, Tanggal, Status, Waktu Check-in
- Profil mahasiswa diambil terpisah dari tabel `profiles` (tidak via PostgREST join langsung)
- Download otomatis via `Blob` URL

---

## 4. Fitur Non-Fungsional

### 4.1 Keamanan

#### Autentikasi
- Session disimpan sebagai cookie HttpOnly (tidak dapat diakses JavaScript)
- Cookie di-refresh otomatis via middleware sebelum kadaluarsa
- Supabase JWT divalidasi server-side pada setiap API request

#### Otorisasi Berlapis
- **Middleware** — proteksi level route (redirect/401 sebelum handler berjalan)
- **API Handler** — validasi role & kepemilikan resource secara eksplisit
- **RLS (Row Level Security)** — proteksi level database, setiap query difilter sesuai `auth.uid()`

#### Row Level Security (RLS) Policies
| Tabel | Policy |
|-------|--------|
| `profiles` | User hanya bisa baca profil sendiri; staff bisa baca semua (via SECURITY DEFINER) |
| `classes` | Hanya member kelas yang bisa baca; staff kelas bisa baca |
| `enrollments` | User bisa lihat enrollment sendiri; staff kelas via SECURITY DEFINER function |
| `sessions` | User terdaftar di kelas bisa baca; staff kelas bisa insert/update |
| `attendance` | User bisa lihat absensi sendiri; staff kelas bisa lihat semua absensi kelas |

#### SECURITY DEFINER Functions
Untuk mencegah RLS infinite recursion:
- `auth_user_is_staff()` — cek apakah user adalah dosen/asisten/admin
- `is_class_staff(class_id)` — cek apakah user adalah staff di kelas tertentu
- `is_enrolled_in_class(class_id)` — cek apakah user terdaftar di kelas tertentu

Ketiga fungsi ini berjalan sebagai `postgres` (bypass RLS) sehingga tidak memicu recursive policy evaluation.

#### Rate Limiting
- Check-in endpoint dibatasi **3 request per 60 detik per user**
- Implementasi: Upstash Redis Sliding Window
- Prefix key: `presenslab:checkin:{userId}`
- Response 429 menyertakan `retry_after_seconds`

#### Validasi Lokasi
- Jarak dihitung server-side menggunakan Haversine formula
- Koordinat mahasiswa tidak bisa dimodifikasi (server yang menghitung, client hanya mengirim `lat` & `lng`)
- Akurasi GPS divalidasi di sisi client (< 100 meter, timeout handling)

---

### 4.2 Performa & Caching

#### AuthContext Singleton
- `useSupabaseSession` menggunakan React Context singleton (`AuthContext`)
- Auth state hanya diinisialisasi **satu kali** di root layout
- `onAuthStateChange` membaca localStorage (hampir instan, tidak ada network call)
- Menggantikan pola lama di mana 5–6 komponen masing-masing memanggil `getUser()` secara independen

#### Profile Cache (Upstash Redis)
- Endpoint: `GET /api/auth/profile`
- Cache HIT: ~5ms | Cache MISS: ~150–300ms
- TTL: 5 menit per user
- Cache key: `presenslab:profile:{userId}`
- Cache invalidation via `DELETE /api/auth/profile`
- `AuthContext` selalu gunakan endpoint ini (bukan query langsung ke Supabase)

#### Middleware Optimization
- Public routes (`/`, `/login`, `/presensi`, `/api/auth/*`) **tidak** memanggil `updateSession()`
- `updateSession()` memanggil `getUser()` ke Supabase server (~200–500ms)
- Penghematan: setiap request ke public route hemat 1 round-trip ke Supabase

#### Next.js Turbopack
- Dev server menggunakan Turbopack (build lebih cepat vs Webpack)
- Hot Module Replacement (HMR) instan saat pengembangan

---

### 4.3 Validasi Input

Semua validasi menggunakan **Zod** (schema-first validation):

#### Check-in (`POST /api/attendance/checkin`)
```
session_id: UUID string
lat: number [-90, 90]
lng: number [-180, 180]
```

#### Buat Sesi (`POST /api/sessions/create`)
```
class_id: UUID string
title: string (min 3 karakter)
description: string? (opsional)
session_date: string (format YYYY-MM-DD)
location: string? (opsional)
```

#### Aktivasi Sesi (`POST /api/sessions/activate`)
```
session_id: UUID string
lat: number
lng: number
radius_meter: number [10, 1000] (default: 100)
duration_minutes: number [5, 480] (default: 30)
late_after_minutes: number [1, 120] (opsional) — batas waktu telat
```

#### Perpanjang Sesi (`POST /api/sessions/extend`)
```
session_id: UUID string
extend_minutes: number [1, 120]
```

#### Buat Kelas (`POST /api/classes`)
```
name: string (min 2 karakter)
code: string (min 1 karakter)
semester: string (min 2 karakter)
lecturer: string (min 2 karakter)
location: string (min 2 karakter)
total_sessions_planned: integer [1, 100]
min_attendance_pct: integer [1, 100]
description: string? (opsional)
```

---

### 4.4 Penanganan Error

#### Format Response API (Konsisten)

**Sukses:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Pesan error dalam Bahasa Indonesia",
  "details": { ... }
}
```

#### Error Codes
| Code | HTTP Status | Keterangan |
|------|-------------|------------|
| `UNAUTHORIZED` | 401 | Belum login |
| `FORBIDDEN` | 403 | Tidak punya izin |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `VALIDATION_ERROR` | 400 | Input tidak valid |
| `RATE_LIMITED` | 429 | Terlalu banyak request |
| `SESSION_INACTIVE` | 403 | Sesi belum dibuka |
| `SESSION_EXPIRED` | 403 | Sesi sudah kadaluarsa |
| `ALREADY_CHECKED_IN` | 409 | Sudah absen |
| `OUT_OF_RANGE` | 403 | Di luar radius |
| `INTERNAL_ERROR` | 500 | Error server internal |

#### Toast Notifications
- Sistem toast non-blocking untuk feedback user
- Tipe: `success`, `error`, `info`, `warning`
- Auto-dismiss dengan durasi configurable
- Hook: `useToast()` — `toast()`, `dismissToast()`

---

### 4.5 Database & RLS

#### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data profil user (nama, NIM, role, avatar) |
| `classes` | Data kelas/mata kuliah praktikum |
| `enrollments` | Relasi user-kelas beserta peran |
| `sessions` | Sesi praktikum (jadwal, status, koordinat GPS) |
| `attendance` | Record absensi per user per sesi |

#### Foreign Keys
- `profiles.id → auth.users.id` (CASCADE DELETE)
- `classes.created_by → profiles.id`
- `enrollments.class_id → classes.id` (CASCADE DELETE)
- `enrollments.user_id → profiles.id` (CASCADE DELETE)
- `sessions.class_id → classes.id` (CASCADE DELETE)
- `attendance.session_id → sessions.id` (CASCADE DELETE)
- `attendance.user_id → profiles.id` (CASCADE DELETE) — ditambahkan via migration 005 untuk mendukung PostgREST join

#### Indeks Performa
- `idx_enrollments_user_id` — query kelas per user
- `idx_enrollments_class_id` — query member per kelas
- `idx_sessions_class_id` — query sesi per kelas
- `idx_sessions_is_active` — query sesi aktif
- `idx_attendance_session_id` — query absensi per sesi
- `idx_attendance_user_id` — query absensi per user

#### Trigger Otomatis
- Auto-create profil saat user baru mendaftar via Supabase Auth
- Auto-update `updated_at` pada tabel `profiles`

---

### 4.6 Aksesibilitas & UX

#### Design System
- **Glassmorphism** — komponen kartu semi-transparan dengan backdrop blur
- **Dark theme** konsisten — warna dominan hijau (#10B981) di atas latar gelap
- **Responsive** — layout menyesuaikan mobile dan desktop
- **Lucide React Icons** — set ikon konsisten di seluruh aplikasi

#### Komponen UI Reusable
| Komponen | Fungsi |
|----------|--------|
| `GlassCard` | Kartu konten glassmorphism |
| `GlassButton` | Tombol interaktif dengan gaya kaca |
| `StatusBadge` | Badge status berwarna (aktif/nonaktif/dll) |
| `LoadingSpinner` | Spinner loading animasi |
| `CountdownTimer` | Timer hitung mundur real-time |
| `DistanceBar` | Progress bar visualisasi jarak GPS |
| `BlobBackground` | Background gradient animasi blob |
| `Toast / ToastContainer` | Notifikasi pop-up |

#### Sidebar Navigation
- Navigasi dashboard dengan item: Dashboard, Kelas, Sesi, Mahasiswa, Export, Settings
- Active state visual berdasarkan route saat ini
- Role-sensitive: item tertentu hanya muncul untuk staff

#### Loading States
- Setiap fetch data memiliki loading state tersendiri
- Auth loading terpisah dari data loading
- Skeleton/spinner ditampilkan selama fetch berlangsung

#### Error States
- Pesan error dalam Bahasa Indonesia yang ramah pengguna
- Petunjuk tindakan yang bisa diambil user (misal: "Hubungi dosen")
- Error toast untuk notifikasi non-kritis

---

## 5. API Endpoint Reference

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/auth/profile` | Login | Ambil profil user (Redis-cached) |
| `DELETE` | `/api/auth/profile` | Login | Invalidate cache profil |
| `GET` | `/api/auth/callback` | — | OAuth callback Supabase |
| `POST` | `/api/auth/signout` | Login | Logout (server-side) |
| `GET` | `/api/classes` | Login | Daftar kelas user |
| `POST` | `/api/classes` | Dosen/Asisten/Admin | Buat kelas baru |
| `GET` | `/api/classes/[id]` | Login | Detail kelas |
| `GET` | `/api/classes/[id]/enrollments` | Staff kelas | Daftar member kelas |
| `POST` | `/api/classes/[id]/enrollments` | Staff kelas | Tambah member ke kelas |
| `DELETE` | `/api/classes/[id]/enrollments/[userId]` | Staff kelas | Hapus member dari kelas |
| `GET` | `/api/sessions/active` | Login | Ambil sesi aktif saat ini |
| `POST` | `/api/sessions/create` | Dosen | Buat sesi baru |
| `POST` | `/api/sessions/activate` | Staff kelas | Aktifkan absensi sesi |
| `POST` | `/api/sessions/deactivate` | Aktivator/Admin | Nonaktifkan sesi |
| `POST` | `/api/sessions/extend` | Aktivator/Admin | Perpanjang durasi sesi |
| `POST` | `/api/attendance/checkin` | Mahasiswa | Check-in absensi |

---

## 6. Struktur Database

### Tabel `profiles`
```
id            UUID (PK, FK → auth.users)
full_name     TEXT
nim           TEXT
avatar_url    TEXT
role          ENUM('mahasiswa','dosen','asisten','admin')
updated_at    TIMESTAMPTZ
```

### Tabel `classes`
```
id                      UUID (PK)
code                    TEXT UNIQUE
name                    TEXT
semester                TEXT
description             TEXT
location                TEXT
min_attendance_pct      INTEGER (default: 75)
total_sessions_planned  INTEGER (default: 14)
created_by              UUID (FK → profiles)
created_at              TIMESTAMPTZ
```

### Tabel `enrollments`
```
id          UUID (PK)
class_id    UUID (FK → classes, CASCADE)
user_id     UUID (FK → profiles, CASCADE)
peran       ENUM('mahasiswa','asisten','dosen')
joined_at   TIMESTAMPTZ
UNIQUE (class_id, user_id)
```

### Tabel `sessions`
```
id                  UUID (PK)
class_id            UUID (FK → classes, CASCADE)
title               TEXT
description         TEXT
session_date        DATE
location            TEXT
is_active           BOOLEAN (default: false)
lat                 DOUBLE PRECISION
lng                 DOUBLE PRECISION
radius_meter        INTEGER (default: 100)
expires_at          TIMESTAMPTZ
activated_by        UUID (FK → profiles)
activated_at        TIMESTAMPTZ
deactivated_at      TIMESTAMPTZ
late_after_minutes  INTEGER (NULL = tidak ada batas telat)
created_by          UUID (FK → profiles)
created_at          TIMESTAMPTZ
```

### Tabel `attendance`
```
id                  UUID (PK)
session_id          UUID (FK → sessions, CASCADE)
user_id             UUID (FK → profiles, CASCADE)
status              ENUM('hadir','telat','absen','ditolak')
checked_in_at       TIMESTAMPTZ
student_lat         DOUBLE PRECISION
student_lng         DOUBLE PRECISION
distance_meter      INTEGER
rejected_reason     TEXT (isi jika status = 'ditolak')
is_manual_override  BOOLEAN (default: false)
created_at          TIMESTAMPTZ
UNIQUE (session_id, user_id)
```
