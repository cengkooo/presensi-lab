# Panduan Export / Import CSV — PresensLab

> Tanggal review: 28 Februari 2026  
> Versi: v0.1 (mock data layer)

---

## Ringkasan Status

| No | Fitur | Halaman | Tombol | Status |
|----|-------|---------|--------|--------|
| 1 | Export daftar absensi (tabel overview) | `/dashboard` | **Export CSV** | ✅ Aktif |
| 2 | Export daftar mahasiswa | `/dashboard/mahasiswa` | **Export** | ✅ Aktif |
| 3 | Export riwayat absensi per mahasiswa | `/dashboard/mahasiswa/[id]` | **Export** | ✅ Aktif |
| 4 | Export rekap kehadiran per kelas | `/dashboard/kelas/[id]` | **Export CSV** | ✅ Aktif |
| 5 | Export terkonfigurasi (halaman Export) | `/dashboard/export` | **Export CSV** | ⚠️ Setengah Jalan |
| 6 | Import CSV (mahasiswa/kelas/absensi) | — | — | ❌ Belum Ada |

---

## 1. Export Daftar Absensi (Tabel Overview Dashboard)

**Letak tombol:** Halaman `/dashboard` → komponen `AttendanceTable` → tombol **Export CSV** (kanan atas tabel)

**Perilaku:** Mengekspor **baris yang sedang ditampilkan setelah filter** (filter sesi, filter status, dan pencarian nama/email ikut berpengaruh).

**Nama file output:** `absensi_YYYY-MM-DD.csv`

### Struktur Kolom

| Kolom | Isi | Contoh |
|-------|-----|--------|
| `Nama` | Nama lengkap mahasiswa | `Jordan Dika` |
| `Email` | Email mahasiswa | `jordan.d@presenslab.com` |
| `Sesi` | Nama sesi praktikum | `Algoritma Lanjut - A1` |
| `Tanggal` | Tanggal sesi | `24 Oct 2023` |
| `Jam Check-in` | Waktu check-in | `08:15 AM` atau `--:--` jika absen |
| `Status` | Status kehadiran | `hadir` / `telat` / `absen` / `ditolak` |
| `Jarak (meter)` | Jarak GPS check-in dalam meter | `18` atau `-` jika tidak ada |

### Contoh Isi File

```csv
Nama,Email,Sesi,Tanggal,Jam Check-in,Status,Jarak (meter)
"Jordan Dika","jordan.d@presenslab.com","Algoritma Lanjut - A1","24 Oct 2023","08:15 AM","hadir","18"
"Amira Safira","amira.s@presenslab.com","Basis Data - B2","24 Oct 2023","08:35 AM","telat","45"
"Budi Waluyo","budi.w@presenslab.com","Sistem Operasi - C1","24 Oct 2023","--:--","absen","-"
```

> ⚠️ **Catatan saat ini:** Data yang ditampilkan di tabel ini masih hardcoded di `AttendanceTable.tsx` (bukan dari konteks/database). Export sudah berjalan tapi datanya adalah mock statis.

---

## 2. Export Daftar Mahasiswa

**Letak tombol:** Halaman `/dashboard/mahasiswa` → tombol **Export** (kanan atas, sebelah "Tambah")

**Perilaku:** Mengekspor **mahasiswa yang lolos filter aktif** (search nama/email/NIM, filter role, filter kelas). Jika tidak ada filter, semua mahasiswa diekspor.

**Nama file output:** `mahasiswa.csv`

### Struktur Kolom

| Kolom | Isi | Contoh |
|-------|-----|--------|
| `Nama` | Nama lengkap | `Jordan Dika` |
| `Email` | Email | `jordan.d@stmik.ac.id` |
| `NIM` | Nomor Induk Mahasiswa | `2021001` |
| `Role` | Peran pengguna | `mahasiswa` / `dosen` |
| `Kelas` | Semua kode kelas yang diikuti, dipisah koma | `JK-A1, BD-B2, SO-C1` |
| `Rata-rata %` | Rata-rata persentase kehadiran lintas kelas | `72%` |

### Contoh Isi File

```csv
Nama,Email,NIM,Role,Kelas,Rata-rata %
"Jordan Dika","jordan.d@stmik.ac.id","2021001","mahasiswa","JK-A1, BD-B2, SO-C1","72%"
"Amira Safira","amira.s@stmik.ac.id","2021002","mahasiswa","JK-A1, BD-B2","85%"
"Dr. Reza Pratama","reza.p@stmik.ac.id","198901001","dosen","","0%"
```

> ℹ️ Kolom `Rata-rata %` menghitung rata-rata dari semua kelas yang diikuti (denominator = `total_sessions_planned` per kelas).

---

## 3. Export Riwayat Absensi per Mahasiswa

**Letak tombol:** Halaman `/dashboard/mahasiswa/[id]` → tombol **Export** (kanan atas profil)

**Perilaku:** Mengekspor **riwayat yang ditampilkan** setelah filter kelas (dropdown "Semua Kelas" / pilih kelas tertentu di atas tabel riwayat).

**Nama file output:** `riwayat_[NIM]_YYYY-MM-DD.csv`  
Contoh: `riwayat_2021001_2026-02-28.csv`

### Struktur Kolom

| Kolom | Isi | Contoh |
|-------|-----|--------|
| `Sesi` | Judul sesi | `Sesi 3` |
| `Kelas` | Nama lengkap kelas | `Praktikum Jaringan Komputer` |
| `Tanggal` | Tanggal sesi (format ISO) | `2026-01-14` |
| `Jam Check-in` | Waktu check-in format HH:MM | `08:15` atau `-` jika absen |
| `Jarak (m)` | Jarak GPS dalam meter | `22` atau `-` jika tidak ada |
| `Status` | Status kehadiran | `hadir` / `telat` / `absen` / `ditolak` |

### Contoh Isi File

```csv
Sesi,Kelas,Tanggal,Jam Check-in,Jarak (m),Status
"Sesi 1","Praktikum Jaringan Komputer","2026-01-14","08:05","22","hadir"
"Sesi 2","Praktikum Jaringan Komputer","2026-01-21","08:47","54","telat"
"Sesi 3","Praktikum Jaringan Komputer","2026-01-28","-","-","absen"
"Sesi 1","Praktikum Basis Data","2026-01-15","08:12","10","hadir"
```

> ℹ️ Baris yang tidak pernah check-in (tidak ada Attendance record) tetap muncul dengan status `absen` dan jam/jarak diisi `-`.

---

## 4. Export Rekap Kehadiran per Kelas (Cross-Table)

**Letak tombol:** Halaman `/dashboard/kelas/[id]` → tombol **Export CSV** (kanan atas di bawah nama kelas)

**Perilaku:** Mengekspor rekap semua mahasiswa × semua sesi kelas tersebut dalam satu tabel. Tombol ini **tidak terpengaruh** oleh tab yang aktif (Sesi / Mahasiswa / Rekap).

**Nama file output:** `rekap_[KODE_KELAS]_YYYY-MM-DD.csv`  
Contoh: `rekap_JK-A1_2026-02-28.csv`

### Struktur Kolom

| Kolom | Isi |
|-------|-----|
| `Nama` | Nama lengkap mahasiswa |
| `NIM` | Nomor Induk Mahasiswa |
| `[Sesi N] (YYYY-MM-DD)` | **Satu kolom per sesi** — judul + tanggal sesi sebagai header |
| `Total Hadir` | Jumlah sesi hadir + telat |
| `% Kehadiran` | Persentase kehadiran (dari `total_sessions_planned`) |
| `Status` | `Lulus` atau `Tidak Lulus` |

**Jumlah kolom dinamis** — tergantung banyaknya sesi yang dibuat di kelas tersebut.

### Contoh Isi File (kelas JK-A1 dengan 3 sesi)

```csv
Nama,NIM,"Sesi 1 (2026-01-14)","Sesi 2 (2026-01-21)","Sesi 3 (2026-01-28)",Total Hadir,% Kehadiran,Status
"Jordan Dika","2021001","hadir","telat","absen","2","17%","Tidak Lulus"
"Amira Safira","2021002","hadir","hadir","hadir","3","25%","Tidak Lulus"
"Budi Waluyo","2021003","absen","absen","hadir","1","8%","Tidak Lulus"
```

> ⚠️ **Catatan penting:** Nilai di sel sesi adalah status mentah (`hadir` / `telat` / `absen` / `ditolak`) bukan nilai override manual. Override yang dilakukan di UI tidak ikut masuk ke CSV ini saat ini.

> ℹ️ `% Kehadiran` menggunakan `total_sessions_planned` (jumlah sesi yang direncanakan) sebagai penyebut, bukan jumlah sesi yang sudah selesai. Jadi angkanya bisa kecil di awal semester.

---

## 5. Export dari Halaman Export (`/dashboard/export`)

**Letak tombol:** Sidebar → **Export** → tombol **Export CSV** (besar, hijau)

**Status: ⚠️ Setengah Jalan — perlu perhatian**

### Yang sudah berfungsi
- Tombol berjalan, file CSV berhasil diunduh
- Animasi loading saat proses export

### Yang belum berfungsi / masih mock
| Fitur | Status | Keterangan |
|-------|--------|------------|
| Tipe laporan (4 pilihan) | ❌ Tidak berpengaruh | Semua pilihan menghasilkan output yang sama |
| Filter sesi | ❌ Tidak berpengaruh | Pilihan sesi tidak memfilter data aktual |
| Filter rentang tanggal | ❌ Tidak berpengaruh | Tanggal tidak dipakai dalam generate CSV |
| Data aktual | ❌ Mock hardcoded | Hanya 3 baris dummy |
| Tombol Print | ❌ Tidak berfungsi | Belum diimplementasikan |
| Recent Exports | ❌ Mock statis | Daftar file lama adalah data dummy |

### Struktur Kolom (saat ini — semua tipe laporan)

| Kolom | Isi | Contoh |
|-------|-----|--------|
| `No` | Nomor urut | `1` |
| `Nama` | Nama lengkap | `Jordan Dika` |
| `Email` | Email | `jordan.d@presenslab.com` |
| `Sesi` | Nama sesi | `Praktikum Jaringan` |
| `Tanggal` | Tanggal format DD/MM/YYYY | `28/02/2026` |
| `Jam Check-in` | Waktu HH:MM | `08:15` atau `--:--` |
| `Status` | Status kehadiran (kapital) | `Hadir` / `Telat` / `Absen` |
| `Jarak (meter)` | Jarak GPS | `18` atau `-` |

> ⚠️ Perhatikan: kolom `Status` di sini menggunakan huruf kapital (`Hadir`) berbeda dengan export lain yang lowercase (`hadir`). Perlu disamakan jika ingin konsisten.

### Contoh Isi File

```csv
No,Nama,Email,Sesi,Tanggal,Jam Check-in,Status,Jarak (meter)
"1","Jordan Dika","jordan.d@presenslab.com","Praktikum Jaringan","28/02/2026","08:15","Hadir","18"
"2","Amira Safira","amira.s@presenslab.com","Praktikum Jaringan","28/02/2026","08:35","Telat","45"
"3","Budi Waluyo","budi.w@presenslab.com","Praktikum Jaringan","28/02/2026","--:--","Absen","-"
```

---

## 6. Import CSV

**Status: ❌ Belum Ada**

Tidak ada fitur import CSV yang diimplementasikan di mana pun dalam aplikasi. Tidak ada `<input type="file">`, `FileReader`, atau endpoint yang menerima upload file CSV.

### Skenario import yang mungkin dibutuhkan ke depannya

| Skenario | Kegunaan |
|----------|----------|
| Import data mahasiswa | Daftarkan banyak mahasiswa sekaligus dari file ekspor SIAKAD/SIAK |
| Import enrollment massal | Daftarkan banyak mahasiswa ke satu kelas dari file CSV |
| Import override absensi | Koreksi masal status kehadiran dari file rekap eksternal |

---

## Catatan Umum Format CSV

- **Encoding:** UTF-8 dengan BOM (`\uFEFF`) — aman dibuka langsung di Microsoft Excel tanpa masalah karakter khusus
- **Delimiter:** Koma (`,`)
- **Quote:** Setiap nilai dibungkus tanda kutip ganda (`"..."`)
- **Nilai kosong / tidak ada:** Ditulis sebagai `-` bukan string kosong
- **Nilai persentase:** Disertakan simbol `%` di dalam string, misal `"75%"`

---

## Rekap Inkonsistensi yang Perlu Dirapikan

| Masalah | Lokasi | Detail |
|---------|--------|--------|
| Status kapital vs lowercase | Export page vs lainnya | Export page pakai `Hadir`, export lain pakai `hadir` |
| Format tanggal berbeda | Export overview vs detail | Overview: `24 Oct 2023`, detail mahasiswa: `2026-01-14` |
| Override manual tidak masuk CSV | Kelas detail | Rekap CSV mengambil dari MOCK_ATTENDANCES, bukan state override UI |
| Data export page tidak real | Export page | 3 baris hardcoded, filter tidak berfungsi |
