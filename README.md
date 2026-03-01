# 🧪 PresensLab

Sistem absensi praktikum berbasis GPS real-time untuk lingkungan laboratorium kampus. Dibangun dengan Next.js 16 App Router, Supabase, dan Upstash Redis.

---

## Fitur Utama

### Untuk Dosen / Asisten
- **Aktivasi Sesi Absensi** — Aktifkan sesi dengan radius GPS dan durasi yang dapat dikonfigurasi
- **Live Attendance Feed** — Lihat mahasiswa yang check-in secara real-time via Supabase Realtime
- **Manajemen Kelas** — Buat kelas praktikum, tambah mahasiswa, kelola enrollment
- **Manajemen Sesi** — Buat, edit, dan pantau sesi pertemuan per kelas
- **Rekap Kehadiran** — Tabel lengkap dengan filter status, ekspor data kehadiran
- **Panel Settings** — Konfigurasi radius default, durasi, rate limiting, dan whitelist email

### Untuk Mahasiswa
- **Check-in GPS** — Absen dengan verifikasi koordinat GPS terhadap titik lokasi sesi
- **Status Real-time** — Umpan balik langsung: hadir / telat / di luar radius / sudah absen
- **Riwayat Kehadiran** — Lihat rekap per kelas dan persentase kehadiran

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Auth | Supabase Auth (OAuth Google / Magic Link) |
| Database | Supabase (PostgreSQL + RLS) |
| Realtime | Supabase Realtime Channels |
| Rate Limiting | Upstash Redis + `@upstash/ratelimit` |
| Styling | Tailwind CSS v4 + Custom CSS (glassmorphism dark) |
| Validasi | Zod v4 |
| Icons | Lucide React |
| Testing | Vitest 4 + Happy DOM |
| Package Manager | Bun |

---

## Struktur Proyek

```
src/
├── app/
│   ├── dashboard/          # Halaman admin (dosen/asisten)
│   │   ├── page.tsx        # Dashboard utama — stats, aktivasi, live feed
│   │   ├── kelas/          # Manajemen kelas praktikum
│   │   ├── mahasiswa/      # Manajemen data mahasiswa
│   │   ├── sesi/           # Daftar semua sesi
│   │   ├── export/         # Ekspor data kehadiran
│   │   └── settings/       # Konfigurasi sistem
│   ├── presensi/           # Halaman check-in mahasiswa
│   ├── api/
│   │   ├── attendance/
│   │   │   ├── checkin/    # POST — check-in GPS mahasiswa
│   │   │   └── override/   # POST — tambah absen manual (dosen)
│   │   ├── sessions/
│   │   │   ├── activate/   # POST — aktifkan sesi + set GPS
│   │   │   ├── deactivate/ # POST — nonaktifkan sesi
│   │   │   ├── extend/     # POST — perpanjang durasi sesi
│   │   │   ├── active/     # GET  — ambil sesi aktif saat ini
│   │   │   └── create/     # POST — buat sesi baru
│   │   ├── classes/        # CRUD kelas praktikum
│   │   ├── enrollments/    # Manajemen enrollment mahasiswa
│   │   ├── admin/users/    # Admin: daftar semua user
│   │   └── auth/           # Callback & profile auth
│   └── globals.css         # Design tokens + utility classes
├── components/
│   ├── dashboard/          # Komponen panel admin
│   │   ├── ActivateAttendance.tsx
│   │   ├── AttendanceTable.tsx
│   │   ├── EnrollPopover.tsx
│   │   ├── LiveAttendanceList.tsx
│   │   ├── SessionManager.tsx
│   │   └── StatCard.tsx
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── BlobBackground.tsx
│       ├── CountdownTimer.tsx
│       ├── DistanceBar.tsx
│       ├── GlassButton.tsx
│       ├── GlassCard.tsx
│       ├── LoadingSpinner.tsx
│       ├── StatusBadge.tsx
│       └── Toast.tsx
├── lib/
│   ├── haversine.ts        # Kalkulasi jarak GPS (Haversine formula)
│   ├── apiHelpers.ts       # Standar response helper + error codes
│   ├── rateLimit.ts        # Rate limiting via Upstash Redis
│   └── utils.ts
├── hooks/
│   ├── useSupabaseSession.ts
│   └── useToast.ts
└── types/
    └── index.ts            # Type definitions (PraktikumClass, Session, Attendance, dll)
```

---

## Instalasi & Setup

### 1. Clone & Install

```bash
git clone https://github.com/<username>/presensi-lab.git
cd presensi-lab
bun install
```

### 2. Konfigurasi Environment

Buat file `.env.local` di root proyek:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# NextAuth
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Setup Database (Supabase)

Tabel yang dibutuhkan di Supabase:

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data user (nama, NIM/NIP, role) |
| `classes` | Kelas praktikum |
| `sessions` | Sesi pertemuan per kelas |
| `enrollments` | Mapping mahasiswa ke kelas |
| `attendance` | Record kehadiran per sesi |

Aktifkan **Row Level Security (RLS)** pada semua tabel. Aktifkan **Realtime** pada tabel `attendance` dan `sessions`.

### 4. Jalankan Development Server

```bash
bun dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Menjalankan Test

```bash
# Jalankan semua test
bun test

# Watch mode
bun run test:watch

# Dengan coverage
bun run test:coverage

# UI interaktif
bun run test:ui
```

Test meliputi: Haversine formula, API helpers, endpoint `/api/attendance/checkin`, endpoint `/api/sessions/activate`, dan middleware auth (69 test cases).

---

## Alur Kerja Sistem

### Check-in Mahasiswa

```
Mahasiswa buka /presensi
  → Login (Supabase Auth)
  → Fetch sesi aktif (GET /api/sessions/active)
  → Ambil koordinat GPS browser
  → POST /api/attendance/checkin { session_id, lat, lng }
      → Rate limit check (Upstash Redis)
      → Validasi body (Zod)
      → Verifikasi sesi aktif & belum expired
      → Verifikasi enrollment di kelas
      → Hitung jarak Haversine (koordinat vs titik sesi)
      → Jika dalam radius → status "hadir"
      → Jika melewati late_after_minutes → status "telat"
      → Jika di luar radius → status "ditolak"
  → Response ditampilkan ke mahasiswa
```

### Aktivasi Sesi (Dosen)

```
Dosen buka /dashboard
  → Pilih sesi dari dropdown
  → Gunakan Lokasi Saya (GPS browser)
  → Atur radius (meter) & durasi (menit)
  → Klik Aktifkan Absensi
      → POST /api/sessions/activate { session_id, lat, lng, radius_meter, duration_minutes }
  → Panel beralih ke mode LIVE
  → LiveAttendanceList terhubung ke Supabase Realtime
  → Check-in mahasiswa masuk secara real-time
```

---

## API Reference

### `POST /api/attendance/checkin`
Check-in absensi mahasiswa. Memerlukan autentikasi.

**Body:**
```json
{ "session_id": "uuid", "lat": -6.9147, "lng": 107.6098 }
```

**Response sukses:**
```json
{ "success": true, "data": { "status": "hadir", "distance_meter": 23, "checked_in_at": "..." } }
```

---

### `POST /api/sessions/activate`
Aktifkan sesi absensi. Hanya dosen/asisten.

**Body:**
```json
{ "session_id": "uuid", "lat": -6.9147, "lng": 107.6098, "radius_meter": 100, "duration_minutes": 30 }
```

---

### `POST /api/sessions/extend`
Perpanjang durasi sesi aktif sebesar 15 menit.

**Body:** `{ "session_id": "uuid", "extend_minutes": 15 }`

---

### `POST /api/sessions/deactivate`
Nonaktifkan sesi sebelum waktu habis.

**Body:** `{ "session_id": "uuid" }`

---

## Build Produksi

```bash
bun run build
bun start
```

---

## Deploy

Direkomendasikan deploy ke **Vercel** — konfigurasi environment variables di dashboard Vercel, lalu connect ke repository GitHub.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
