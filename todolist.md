# 🧪 PresensLab — Master To-Do List
> **Stack:** Next.js · Google Auth · Supabase · Liquid Glass UI · Geolocation  
> **Total:** 8 Fase · 71 Task · Estimasi: 15–25 jam

---

## ⚠️ CATATAN CACAT & KEKURANGAN + SOLUSINYA

> Baca ini dulu sebelum mulai coding — ini yang sering bikin project gagal di tengah jalan.

| # | Cacat / Kekurangan | Dampak | Solusi yang Diimplementasikan |
|---|---|---|---|
| 1 | GPS di dalam gedung tidak akurat | Mahasiswa valid ditolak sistem | Radius default 100m, bukan 50m. Tambah tombol "Minta Override Dosen" |
| 2 | Mahasiswa bisa fake GPS pakai app pihak ketiga | Absen dari rumah | Validasi **server-side only**, log semua koordinat, dosen bisa audit |
| 3 | Tidak ada fallback kalau GPS timeout | Mahasiswa tidak bisa absen sama sekali | Tampilkan pesan error spesifik + saran ke dosen untuk manual override |
| 4 | Satu email bisa absen berkali-kali kalau UNIQUE constraint tidak ada | Data duplikat | `UNIQUE(user_id, session_id)` di database + cek server sebelum insert |
| 5 | Session NextAuth expired tapi user masih di halaman | Silent fail saat submit | Cek auth di setiap API route, return 401, redirect client ke login |
| 6 | Tidak ada audit trail siapa yang mengaktifkan/nonaktifkan sesi | Tidak bisa investigasi kalau ada masalah | Kolom `activated_by`, `activated_at`, `deactivated_at` di tabel sessions |
| 7 | Dashboard tidak update otomatis saat ada check-in baru | Dosen harus refresh manual | Supabase Realtime subscription di LiveAttendanceList |
| 8 | Tidak ada notifikasi kalau waktu absensi hampir habis | Dosen lupa perpanjang | Countdown di dashboard + alert toast 5 menit sebelum expired |
| 9 | Export CSV tidak handle karakter khusus (koma, petik) | File CSV corrupt di Excel | Wrap semua value dengan double-quote + escape karakter |
| 10 | Tidak ada rate limiting di endpoint check-in | Bisa di-spam / brute force | Max 3 request per user per menit di API route |
| 11 | Tidak ada halaman manajemen sesi praktikum | Dosen harus insert manual ke Supabase | Tambah CRUD sesi di dashboard |
| 12 | Tidak ada konfirmasi visual jarak sebelum submit | Mahasiswa tidak tahu seberapa jauh mereka | "Confirming state" — tampilkan koordinat + jarak sebelum submit final |

---

## FASE 0 — Persiapan & Setup Awal
> ⏱ Estimasi: 1–2 jam

- [ ] **0.1** Install Bun — `curl -fsSL https://bun.sh/install | bash`
- [ ] **0.2** Buat project Next.js — `bunx create-next-app@latest presensi-lab --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [ ] **0.3** Install dependencies — `bun add next-auth@beta @supabase/supabase-js @supabase/ssr lucide-react @auth/supabase-adapter`
- [ ] **0.4** Buat project di **Google Cloud Console** → Enable Google+ API → buat OAuth 2.0 Client ID → catat Client ID & Secret
- [ ] **0.5** Tambahkan Authorized Redirect URI: `http://localhost:3000/api/auth/callback/google` + domain production
- [ ] **0.6** Buat project **Supabase** baru → pilih region Singapore → catat URL, anon key, service role key
- [ ] **0.7** Buat `.env.local` dengan semua variable: `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_EMAILS`, `ALLOWED_EMAIL_DOMAIN`
- [ ] **0.8** Generate `NEXTAUTH_SECRET` — `bun -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] **0.9** Buat folder structure: `src/app/`, `src/components/ui/`, `src/components/layout/`, `src/components/dashboard/`, `src/lib/`, `src/types/`, `src/hooks/`
- [ ] **0.10** Buat `bunfig.toml` + update `package.json` scripts pakai `bun --bun`

---

## FASE 1 — Database Schema (Supabase)
> ⏱ Estimasi: 30–45 menit

### Tabel Utama
- [ ] **1.1** Buat tabel `users` — `id (uuid)`, `email`, `name`, `avatar_url`, `role (mahasiswa/dosen)`, `created_at`
- [ ] **1.2** Buat tabel `sessions` — `id`, `title`, `description`, `session_date`, `location`, `created_by (FK)`, `created_at`
- [ ] **1.3** Buat tabel `attendance` — `id`, `user_id (FK)`, `session_id (FK)`, `checked_in_at`, `status`, `notes`, `UNIQUE(user_id, session_id)`

### Kolom Geolocation — Tambahan Fitur Baru
- [ ] **1.4** Tambah kolom geolocation ke `sessions`:
  ```sql
  alter table sessions add column is_active      boolean default false;
  alter table sessions add column lat            float;
  alter table sessions add column lng            float;
  alter table sessions add column radius_meter   int default 100;
  alter table sessions add column expires_at     timestamptz;
  alter table sessions add column activated_by   uuid references users(id);
  alter table sessions add column activated_at   timestamptz;
  alter table sessions add column deactivated_at timestamptz;
  ```
- [ ] **1.5** Tambah kolom geolocation ke `attendance`:
  ```sql
  alter table attendance add column student_lat      float;
  alter table attendance add column student_lng      float;
  alter table attendance add column distance_meter   float;
  alter table attendance add column rejected_reason  text;
  alter table attendance add column is_manual_override boolean default false;
  ```

### Security & Realtime
- [ ] **1.6** Enable Row Level Security (RLS) pada semua tabel
- [ ] **1.7** Buat RLS policies: read all (authenticated), insert own attendance, admin full access
- [ ] **1.8** Enable **Supabase Realtime** pada tabel `attendance` dan `sessions` di dashboard Supabase
- [ ] **1.9** Test koneksi Supabase dari Next.js — simple query ke tabel users

---

## FASE 2 — Authentication (Google OAuth + Whitelist)
> ⏱ Estimasi: 1–2 jam

- [ ] **2.1** Setup NextAuth.js v5 — buat `src/app/api/auth/[...nextauth]/route.ts`
- [ ] **2.2** Setup Google Provider dengan `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- [ ] **2.3** Implementasi `signIn` callback — reject jika email tidak ada di `ALLOWED_EMAILS`
- [ ] **2.4** Implementasi domain check — reject jika email tidak cocok `ALLOWED_EMAIL_DOMAIN`
- [ ] **2.5** Auto-upsert user ke tabel Supabase saat login pertama — `INSERT ... ON CONFLICT DO UPDATE`
- [ ] **2.6** Buat `src/middleware.ts` — proteksi route `/dashboard`, redirect ke `/` jika belum login
- [ ] **2.7** Buat halaman `/unauthorized` — liquid glass error card dengan pesan dan kontak admin
- [ ] **2.8** Test: login email diizinkan ✅ → landing page
- [ ] **2.9** Test: login email tidak diizinkan ❌ → `/unauthorized`

---

## FASE 3 — Design System (Liquid Glass + Green)
> ⏱ Estimasi: 1–2 jam

- [ ] **3.1** Setup Tailwind config — tambah custom green palette (`green-brand`, `green-glow`, `green-soft`)
- [ ] **3.2** Buat global CSS — class `.glass`, `.glass-strong`, `.glass-subtle`
- [ ] **3.3** Buat animated background — 3 green gradient blobs dengan `@keyframes float`
- [ ] **3.4** Buat komponen `<GlassCard>` — props: `children`, `className`, `variant`
- [ ] **3.5** Buat komponen `<GlassButton>` — variant: `primary`, `ghost`, `danger`
- [ ] **3.6** Buat komponen `<StatusBadge>` — props: `status` (present/late/absent/rejected)
- [ ] **3.7** Buat komponen `<LoadingSpinner>` — green gradient ring animation
- [ ] **3.8** Buat komponen `<CountdownTimer>` — tabular-nums, gradient green → red saat < 5 menit
- [ ] **3.9** Buat komponen `<DistanceBar>` — progress bar hijau→merah untuk visualisasi jarak
- [ ] **3.10** Buat komponen `<Toast>` — notifikasi sukses/error/warning dengan auto-dismiss

---

## FASE 4 — Landing Page (Check-in Absensi)
> ⏱ Estimasi: 2–3 jam

### Layout & Auth States
- [ ] **4.1** Full-screen layout dengan animated blob background (fixed, z-index: -1)
- [ ] **4.2** State **belum login** — card dengan tombol "Masuk dengan Google"
- [ ] **4.3** State **sudah login** — avatar, nama, email mahasiswa dengan animasi fade-in

### Geolocation Check-in Flow (State Machine)
- [ ] **4.4** State `idle` — tombol "📍 Catat Kehadiran" + teks kecil "Pastikan GPS aktif"
- [ ] **4.5** State `getting-gps` — spinner + "Mendapatkan lokasi GPS kamu..." + `enableHighAccuracy: true`
- [ ] **4.6** Handle GPS error spesifik:
  - Error code 1 → "Izin lokasi ditolak. Aktifkan GPS di pengaturan browser."
  - Error code 2 → "Sinyal GPS lemah. Coba di tempat terbuka."
  - Error code 3 → "GPS timeout. Coba lagi atau hubungi dosen."
- [ ] **4.7** State `confirming` — tampilkan koordinat + akurasi GPS + tombol konfirmasi & deteksi ulang
- [ ] **4.8** State `submitting` — loading spinner + "Memverifikasi lokasi kamu..."
- [ ] **4.9** State `success` — animated checkmark, timestamp, **jarak dari titik absen** (misal "📍 23 meter dari titik absen ✅")
- [ ] **4.10** State `error` dengan pesan spesifik:
  - "Absensi belum dibuka" → icon 🔒 + saran tunggu dosen
  - "Waktu absensi habis" → icon ⏰ + saran hubungi dosen
  - "Di luar jangkauan" → icon 📍 + **DistanceBar** visualisasi + jarak aktual vs maksimal
  - "Sudah absen" → icon ✅ + tampilkan waktu absen sebelumnya
- [ ] **4.11** Fetch sesi aktif dari API `/api/sessions/active` saat halaman load
- [ ] **4.12** Tampilkan card info sesi aktif — judul, tanggal, lokasi, radius, waktu berakhir
- [ ] **4.13** Tombol "Minta Override Dosen" — muncul jika GPS gagal 2x (kirim notifikasi ke dashboard)
- [ ] **4.14** Link ke `/dashboard` hanya muncul jika email ada di whitelist

---

## FASE 5 — API Routes (Geolocation + Attendance)
> ⏱ Estimasi: 2–3 jam

### Session Management APIs
- [ ] **5.1** `POST /api/sessions/activate` — dosen aktifkan absensi
  - Validasi: user harus ada di `ALLOWED_EMAILS`
  - Nonaktifkan semua sesi aktif lain dulu
  - Set `is_active=true`, koordinat, radius, `expires_at`, `activated_by`, `activated_at`
- [ ] **5.2** `POST /api/sessions/deactivate` — dosen nonaktifkan absensi, set `deactivated_at`
- [ ] **5.3** `POST /api/sessions/extend` — perpanjang `expires_at` + N menit
- [ ] **5.4** `GET /api/sessions/active` — ambil sesi aktif yang belum expired

### Check-in API (Semua validasi server-side)
- [ ] **5.5** `POST /api/attendance/checkin` — implementasi full validation chain:
  1. Auth check — user harus login
  2. Fetch session — pastikan ada
  3. Cek `is_active` → 403 jika false
  4. Cek `expires_at` → 403 jika expired
  5. Hitung jarak pakai Haversine formula
  6. Cek jarak vs `radius_meter` → 403 jika melebihi + return detail jarak
  7. Cek duplikat → 409 jika sudah absen
  8. Rate limiting → 429 jika > 3 request/menit
  9. Insert attendance dengan koordinat + jarak
  10. Return `{ success: true, distance, checkedInAt }`
- [ ] **5.6** Buat `src/lib/haversine.ts` — fungsi hitung jarak dua koordinat (meter)
- [ ] **5.7** Buat `src/lib/rateLimit.ts` — simple in-memory rate limiter per userId

### CRUD Sesi (Bonus — lihat Fase 6)
- [ ] **5.8** `POST /api/sessions/create` — dosen buat sesi praktikum baru
- [ ] **5.9** `GET /api/sessions` — ambil semua sesi untuk dropdown dashboard

---

## FASE 6 — Dashboard
> ⏱ Estimasi: 3–5 jam

### Layout
- [ ] **6.1** Layout sidebar kiri (fixed, glass) + main content area (scrollable)
- [ ] **6.2** Sidebar: logo, nav links (Dashboard, Sesi, Export), user info + tombol logout bawah
- [ ] **6.3** Sidebar collapse ke bottom nav di mobile

### Summary Cards
- [ ] **6.4** 4 summary cards: Total Sesi | Total Mahasiswa | Rata-rata Kehadiran % | Kehadiran Hari Ini
- [ ] **6.5** Hitung semua metrik dari data Supabase

### Panel Aktivasi Absensi (Fitur Baru)
- [ ] **6.6** Komponen `<ActivateAttendance>` — state machine: `idle` → `active` → `expired`
- [ ] **6.7** State `idle` — form: pilih sesi, input radius (default 100m), input durasi (default 30 menit), tombol ambil GPS
- [ ] **6.8** Tombol "📍 Gunakan Lokasi Saya" — `getCurrentPosition()` + tampilkan koordinat + akurasi
- [ ] **6.9** Tombol "🟢 Aktifkan Absensi" — call `/api/sessions/activate`
- [ ] **6.10** State `active` — tampilkan: pulsing red dot, sesi aktif, countdown timer, koordinat, radius, jumlah yang sudah absen
- [ ] **6.11** Tombol "+ Perpanjang 15 Menit" — call `/api/sessions/extend`
- [ ] **6.12** Tombol "⏹ Nonaktifkan" — call `/api/sessions/deactivate` + konfirmasi dialog
- [ ] **6.13** Alert toast 5 menit sebelum expired — "⚠️ Absensi berakhir dalam 5 menit!"
- [ ] **6.14** State `expired` — tampilkan total hadir + tombol aktifkan sesi baru

### Live Attendance Feed (Fitur Baru)
- [ ] **6.15** Komponen `<LiveAttendanceList>` — Supabase Realtime subscription
- [ ] **6.16** Subscribe ke `INSERT` event pada tabel `attendance` filter by `session_id`
- [ ] **6.17** Setiap baris baru animate masuk: `slideDown` + fade-in
- [ ] **6.18** Tampilkan: avatar initial, nama, email, waktu check-in, **distance badge** (warna sesuai jarak)
- [ ] **6.19** Distance badge: < 30m → hijau | 30–80m → kuning | > 80m → oranye
- [ ] **6.20** Empty state: "Menunggu mahasiswa check in..." dengan animasi sonar

### Manajemen Sesi (Fitur Baru — atasi kekurangan #11)
- [ ] **6.21** Form buat sesi praktikum baru: judul, deskripsi, tanggal, lokasi
- [ ] **6.22** List semua sesi dengan status aktif/tidak + tombol edit & hapus

### Tabel Attendance + Filter
- [ ] **6.23** Tabel dengan kolom: No | Nama | Email | Sesi | Tanggal | Jam | Jarak | Status
- [ ] **6.24** Kolom **Jarak** baru — tampilkan `distance_meter` dari database
- [ ] **6.25** Filter: by session, date range, status
- [ ] **6.26** Search: by nama atau email, debounce 300ms
- [ ] **6.27** Pagination 10 baris per halaman
- [ ] **6.28** Row hover: green left border accent
- [ ] **6.29** Export CSV — semua data sesuai filter aktif, dengan kolom Jarak

### Export CSV (atasi kekurangan #9)
- [ ] **6.30** CSV columns: Nama, Email, Sesi, Tanggal, Jam Check-in, Status, Jarak (meter), Catatan
- [ ] **6.31** Wrap semua nilai dengan double-quote, escape karakter khusus
- [ ] **6.32** Filename: `absensi_[nama-sesi]_[tanggal].csv`
- [ ] **6.33** Tambah BOM UTF-8 (`\uFEFF`) agar Excel baca karakter Indonesia dengan benar

---

## FASE 7 — Testing & QA
> ⏱ Estimasi: 2–3 jam

### Auth Tests
- [ ] **7.1** Login email diizinkan → masuk landing page, user terupsert ke Supabase ✅
- [ ] **7.2** Login email tidak diizinkan → redirect `/unauthorized` ✅
- [ ] **7.3** Akses `/dashboard` tanpa login → redirect ke `/` ✅

### Geolocation Tests
- [ ] **7.4** Check-in dengan koordinat **dalam radius** → berhasil, tampil jarak ✅
- [ ] **7.5** Check-in dengan koordinat **luar radius** → ditolak, tampil DistanceBar + jarak aktual ✅
- [ ] **7.6** Check-in saat **sesi tidak aktif** → error "Absensi belum dibuka" ✅
- [ ] **7.7** Check-in saat **sesi expired** → error "Waktu absensi habis" ✅
- [ ] **7.8** Check-in **dua kali** → error "Sudah absen", tidak ada duplikat di DB ✅
- [ ] **7.9** Simulasi **fake GPS** (koordinat manual dari Postman) → validasi jarak tetap jalan di server ✅
- [ ] **7.10** GPS ditolak browser (permission denied) → tampil pesan error spesifik ✅
- [ ] **7.11** **Rate limit** — kirim > 3 request/menit → return 429 ✅

### Dashboard Tests
- [ ] **7.12** Aktifkan absensi dari dashboard → sesi berubah `is_active=true` di DB ✅
- [ ] **7.13** Mahasiswa check-in → muncul realtime di LiveAttendanceList tanpa refresh ✅
- [ ] **7.14** Countdown mencapai 0 → auto switch ke state `expired` ✅
- [ ] **7.15** Alert muncul 5 menit sebelum expired ✅
- [ ] **7.16** Perpanjang waktu → `expires_at` update di DB + countdown reset ✅
- [ ] **7.17** Semua filter dashboard bekerja dikombinasi ✅
- [ ] **7.18** Export CSV → buka di Excel, kolom rapi, encoding benar, karakter Indonesia tidak rusak ✅

### Mobile Tests
- [ ] **7.19** Landing page responsif di 375px (iPhone SE) ✅
- [ ] **7.20** GPS flow usable di mobile browser (Chrome Android / Safari iOS) ✅
- [ ] **7.21** Dashboard sidebar collapse ke bottom nav di mobile ✅

---

## FASE 8 — Deployment
> ⏱ Estimasi: 1–2 jam

- [ ] **8.1** Push ke GitHub repository
- [ ] **8.2** Connect repo ke **Vercel** → New Project → import → auto-detect Next.js
- [ ] **8.3** Set semua environment variables di Vercel dashboard (sama dengan `.env.local`)
- [ ] **8.4** Update `NEXTAUTH_URL` ke domain production Vercel
- [ ] **8.5** Update Google Console → tambah production URL ke Authorized Redirect URIs
- [ ] **8.6** Enable Supabase Realtime di production project
- [ ] **8.7** End-to-end test full flow di production URL
- [ ] **8.8** Test GPS check-in dari HP di lokasi asli (bukan localhost)
- [ ] **8.9** Share link ke dosen + mahasiswa

---

## 💡 IDE & IMPROVEMENT IDEAS

> Ide-ide ini belum masuk scope utama tapi worth dipertimbangkan untuk versi berikutnya.

### 🔒 Keamanan Lebih Lanjut
- **Device fingerprinting** — simpan user-agent + IP saat check-in, deteksi anomali (1 orang absen dari 2 device berbeda dalam 1 menit)
- **Screenshot prevention** — pakai CSS `user-select: none` + deteksi screenshot API (terbatas)
- **QR Code sebagai layer kedua** — dosen tampilkan QR yang refresh setiap 30 detik, mahasiswa scan + GPS sebagai double verification
- **Foto selfie saat check-in** — ambil snapshot dari kamera depan, simpan ke Supabase Storage, dosen bisa audit

### 📊 Analytics & Reporting
- **Grafik kehadiran per sesi** — chart line/bar pakai Recharts, visualisasi tren kehadiran
- **Rekap per mahasiswa** — berapa kali hadir, telat, absen dalam 1 semester
- **Export PDF rekap** — bukan cuma CSV, tapi PDF formatted untuk keperluan akademik
- **Email otomatis ke mahasiswa** — kirim konfirmasi absen via email pakai Resend/Nodemailer

### 🗓️ Fitur Jadwal
- **Jadwal sesi berulang** — dosen set template sesi (misal setiap Rabu 08:00), sistem auto-buat sesi
- **Notifikasi reminder** — mahasiswa dapat reminder 15 menit sebelum sesi dimulai (via browser push notification)
- **Kalender view** — tampilkan sesi dalam tampilan kalender mingguan/bulanan

### 🗺️ Geolocation Lanjutan
- **Multiple checkpoint** — dosen set beberapa titik lokasi sekaligus (misal 2 ruangan berbeda yang valid)
- **Polygon zone** — bukan radius lingkaran tapi area bebas (pakai Turf.js), berguna untuk area kampus tidak beraturan
- **Heatmap lokasi check-in** — visualisasi sebaran lokasi mahasiswa saat absen, deteksi outlier
- **Offline support** — queue check-in request saat sinyal lemah, kirim otomatis saat online kembali

### 👤 User Management
- **Halaman profil mahasiswa** — edit nama, lihat riwayat absensi sendiri
- **Bulk import mahasiswa** — upload CSV daftar email yang diizinkan, bukan cuma env variable
- **Role-based access** — role `mahasiswa` hanya bisa check-in, role `dosen` bisa kelola sesi dan dashboard
- **Manajemen kelas/kelompok** — dosen bisa buat grup, assign mahasiswa ke grup, filter absensi per grup

### 🔔 Realtime & UX
- **Push notification** — dosen dapat notif browser saat ada mahasiswa check-in
- **Dark/light mode toggle** — sekarang full dark, tambah opsi light mode
- **Animasi lebih kaya** — Lottie animation untuk success state check-in
- **PWA** — tambah `manifest.json` + service worker agar bisa di-install ke homescreen HP

---

## 📋 RINGKASAN

| Fase | Nama | Task | Estimasi |
|------|------|------|----------|
| 0 | Persiapan & Setup | 10 | 1–2 jam |
| 1 | Database Schema | 9 | 30–45 mnt |
| 2 | Authentication | 9 | 1–2 jam |
| 3 | Design System | 10 | 1–2 jam |
| 4 | Landing Page | 14 | 2–3 jam |
| 5 | API Routes | 9 | 2–3 jam |
| 6 | Dashboard | 33 | 3–5 jam |
| 7 | Testing & QA | 21 | 2–3 jam |
| 8 | Deployment | 9 | 1–2 jam |
| **Total** | | **71 task** | **15–25 jam** |

---

*Dibuat untuk project PresensLab — Sistem Absensi Praktikum Digital*