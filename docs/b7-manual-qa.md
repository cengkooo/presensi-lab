# B7 — Manual QA Checklist
> Item yang tidak bisa diotomasi karena memerlukan browser, OAuth, GPS, atau perangkat fisik.

---

## B7.1 — Auth: Login domain diizinkan

**Langkah:**
1. Buka `http://localhost:3000`
2. Klik "Masuk dengan Google"
3. Login dengan akun `@student.itera.ac.id` atau email di `ALLOWED_EMAILS`

**Harapan:**
- [ ] Redirect ke `/dashboard`
- [ ] Profil terupsert di Supabase: cek tabel `profiles` — row dengan email tersebut ada
- [ ] `full_name` dan `nim` terisi dari `raw_user_meta_data`

---

## B7.2 — Auth: Login domain di luar whitelist

**Langkah:**
1. Buka `http://localhost:3000`
2. Klik "Masuk dengan Google"
3. Login dengan akun Gmail `@gmail.com` biasa (bukan domain kampus)

**Harapan:**
- [ ] Redirect ke `/unauthorized`
- [ ] Pesan error ditampilkan (bukan error mentah)
- [ ] User **tidak** masuk ke tabel `profiles`

---

## B7.12 — Realtime: Check-in muncul di LiveAttendanceList

**Persiapan:**
1. Login sebagai dosen/asisten → buka `/dashboard`
2. Aktifkan sesi dari panel ActivateAttendance
3. Buka tab baru — login sebagai mahasiswa → buka `/presensi`

**Langkah:**
4. Mahasiswa lakukan check-in (atau kirim request manual via Postman ke `/api/attendance/checkin`)

**Harapan:**
- [ ] Baris baru muncul di LiveAttendanceList di tab dosen **tanpa refresh**
- [ ] Animasi slide-down + fade-in berjalan
- [ ] Nama, email, waktu check-in, dan distance badge tampil benar

---

## B7.13 — Realtime: Countdown expired otomatis

**Langkah:**
1. Aktifkan sesi dengan durasi **5 menit**
2. Tunggu countdown mencapai 0

**Harapan:**
- [ ] State berubah dari `active` → `expired` otomatis (tanpa refresh)
- [ ] Tombol "Aktifkan" muncul kembali
- [ ] Toast peringatan "⚠️ Absensi berakhir dalam 5 menit!" muncul sebelum expired

---

## B7.14 — Realtime: Perpanjang waktu terupdate

**Langkah:**
1. Aktifkan sesi
2. Buka tab kedua dengan akun dosen yang sama
3. Di tab pertama — klik "Perpanjang 15 Menit"

**Harapan:**
- [ ] `expires_at` diupdate di Supabase (cek di Dashboard Supabase)
- [ ] Countdown di tab kedua terupdate otomatis tanpa refresh

---

## B7.15 — Mobile: GPS flow di Chrome Android / Safari iOS

**Perangkat:** HP fisik (bukan emulator)

**Langkah:**
1. Buka `https://<domain>` di Chrome Android atau Safari iOS
2. Login → halaman presensi
3. Klik "Catat Kehadiran"
4. Izinkan akses GPS saat browser meminta

**Harapan:**
- [ ] Browser prompt izin GPS muncul
- [ ] State berubah `idle` → `getting-gps` → `confirming`
- [ ] Koordinat aktual ditampilkan di state `confirming`
- [ ] Tombol "Konfirmasi & Kirim" dapat diklik

---

## B7.16 — Mobile: Check-in berhasil dari HP

**Prasyarat:** Sesi sudah diaktifkan oleh dosen, mahasiswa berada di lokasi asli (dalam radius)

**Langkah:**
1. Lakukan check-in dari HP di lokasi lab/kampus

**Harapan:**
- [ ] State `success` muncul dengan jarak aktual (bukan 0)
- [ ] Record muncul di tabel `attendance` Supabase
- [ ] Di tab dosen — muncul di LiveAttendanceList secara realtime

---

## B7.17 — Export CSV: Encoding UTF-8 di Excel

**Langkah:**
1. Login sebagai dosen → `/dashboard/export`
2. Pilih kelas & sesi → klik Export CSV
3. Buka file hasil di Microsoft Excel

**Harapan:**
- [ ] File ter-download dengan nama format `absensi_[nama-sesi]_[tanggal].csv`
- [ ] Excel menampilkan semua karakter Indonesia dengan benar (tidak ada `???` atau kotak)
- [ ] Kolom: Nama, Email, Sesi, Tanggal, Jam Check-in, Status, Jarak (meter)
- [ ] Nama dengan spesial karakter (Ö, é, dll) jika ada - tampil benar
- [ ] Buka dengan text editor — baris pertama ada karakter BOM (`EF BB BF` dalam hex)

---

## Ringkasan Status

| Item | Jenis | Status |
|------|-------|--------|
| B7.1 Login domain diizinkan | Manual | ⬜ Belum ditest |
| B7.2 Login domain di luar whitelist | Manual | ⬜ Belum ditest |
| B7.3 /dashboard tanpa login → redirect | **Otomatis** ✅ | `middleware.test.ts` |
| B7.4 Session expired → redirect | **Otomatis** ✅ | `middleware.test.ts` |
| B7.5 Checkin tanpa auth → 401 | **Otomatis** ✅ | `checkin.test.ts` |
| B7.6 Koordinat luar radius → 403 + detail | **Otomatis** ✅ | `checkin.test.ts` |
| B7.7 Sesi tidak aktif → 403 | **Otomatis** ✅ | `checkin.test.ts` |
| B7.8 Sesi expired → 403 | **Otomatis** ✅ | `checkin.test.ts` |
| B7.9 Check-in duplikat → 409 | **Otomatis** ✅ | `checkin.test.ts` |
| B7.10 Rate limited → 429 | **Otomatis** ✅ | `checkin.test.ts` |
| B7.11 Mahasiswa akses endpoint dosen → 403 | **Otomatis** ✅ | `activate.test.ts` |
| B7.12 Realtime check-in muncul | Manual | ⬜ Belum ditest |
| B7.13 Countdown expired otomatis | Manual | ⬜ Belum ditest |
| B7.14 Perpanjang waktu terupdate | Manual | ⬜ Belum ditest |
| B7.15 GPS flow di mobile | Manual | ⬜ Belum ditest |
| B7.16 Check-in dari HP fisik | Manual | ⬜ Belum ditest |
| B7.17 Export CSV encoding Excel | Manual | ⬜ Belum ditest |

**9 dari 17 item diotomasi** — 8 item memerlukan testing manual (browser/OAuth/GPS/perangkat fisik).
