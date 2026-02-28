"use client";

import { useState } from "react";
import {
  Download, FileText, FileSpreadsheet, Printer,
  Calendar, ChevronDown, CheckCircle,
  Archive, Clock, ArrowRight, ClipboardList, SlidersHorizontal, History,
} from "lucide-react";

/* ── EXPORT OPTIONS ── */
const REPORT_TYPES = [
  { id: "all", label: "Semua Data Absensi", desc: "Seluruh riwayat kehadiran semua sesi" },
  { id: "session", label: "Per Sesi Praktikum", desc: "Rekap kehadiran berdasarkan sesi tertentu" },
  { id: "student", label: "Per Mahasiswa", desc: "Rekap kehadiran per individu mahasiswa" },
  { id: "summary", label: "Rekap Bulanan", desc: "Ringkasan statistik kehadiran per bulan" },
];

const SESSIONS_CHOICE = [
  "Semua Sesi",
  "Praktikum Jaringan - A1",
  "Basis Data - B2",
  "Sistem Operasi - C1",
  "Kecerdasan Buatan - A2",
  "Algoritma Lanjut - A1",
];

/* ── RECENT EXPORTS ── */
const RECENT = [
  { filename: "absensi_jaringan_a1_2026-02-28.csv", type: "CSV", size: "12 KB", date: "28 Feb 2026, 09:15", status: "done" },
  { filename: "rekap_bulanan_feb2026.csv", type: "CSV", size: "8.4 KB", date: "27 Feb 2026, 14:32", status: "done" },
  { filename: "mahasiswa_all_2026-02-20.csv", type: "CSV", size: "24 KB", date: "20 Feb 2026, 10:00", status: "done" },
];

/* ── STAT MINI ── */
function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>{label}</span>
      </div>
      <p style={{ fontSize: "26px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

export default function ExportPage() {
  const [reportType, setReportType] = useState("all");
  const [selectedSession, setSelectedSession] = useState("Semua Sesi");
  const [dateFrom, setDateFrom] = useState("2026-02-01");
  const [dateTo, setDateTo] = useState("2026-02-28");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    // TODO: call actual API
    await new Promise((r) => setTimeout(r, 1800));
    const BOM = "\uFEFF";
    const header = ["No", "Nama", "Email", "Sesi", "Tanggal", "Jam Check-in", "Status", "Jarak (meter)"];
    const rows = [
      ["1", "Jordan Dika", "jordan.d@presenslab.com", "Praktikum Jaringan", "28/02/2026", "08:15", "Hadir", "18"],
      ["2", "Amira Safira", "amira.s@presenslab.com", "Praktikum Jaringan", "28/02/2026", "08:35", "Telat", "45"],
      ["3", "Budi Waluyo", "budi.w@presenslab.com", "Praktikum Jaringan", "28/02/2026", "--:--", "Absen", "-"],
    ].map((r) => r.map((c) => `"${c}"`));
    const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    Object.assign(document.createElement("a"), {
      href: url,
      download: `absensi_${selectedSession.replace(/\s+/g, "_").toLowerCase()}_${dateTo}.csv`,
    }).click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Export Data</h1>
        <p style={{ color: "rgba(134,239,172,0.5)", fontSize: "14px", marginTop: "6px" }}>
          Unduh data absensi dalam format CSV atau cetak laporan
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
        <MiniStat label="Total Record" value="2,431" icon={<Archive size={15} style={{ color: "#4ade80" }} />} />
        <MiniStat label="Sesi Tersedia" value="124" icon={<Calendar size={15} style={{ color: "#4ade80" }} />} />
        <MiniStat label="Export Terakhir" value="Hari Ini" icon={<Clock size={15} style={{ color: "#4ade80" }} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }} className="export-grid">
        {/* ── KIRI: Form Konfigurasi ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Tipe Laporan */}
          <div className="glass rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={16} style={{ color: "#4ade80" }} /> Tipe Laporan
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {REPORT_TYPES.map((t) => (
                <label key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                  background: reportType === t.id ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${reportType === t.id ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <div style={{ marginTop: "2px", width: 16, height: 16, borderRadius: "50%", border: `2px solid ${reportType === t.id ? "#22c55e" : "rgba(34,197,94,0.3)"}`, background: reportType === t.id ? "#22c55e" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {reportType === t.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <input type="radio" name="reportType" value={t.id} checked={reportType === t.id} onChange={() => setReportType(t.id)} style={{ display: "none" }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: reportType === t.id ? "#4ade80" : "#f0fdf4" }}>{t.label}</p>
                    <p style={{ fontSize: "12px", color: "rgba(134,239,172,0.4)", marginTop: "2px" }}>{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="glass rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <SlidersHorizontal size={16} style={{ color: "#4ade80" }} /> Filter Data
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(134,239,172,0.5)", marginBottom: "6px" }}>Sesi Praktikum</label>
                <div style={{ position: "relative" }}>
                  <select className="select-glass" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
                    {SESSIONS_CHOICE.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(134,239,172,0.3)", pointerEvents: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(134,239,172,0.5)", marginBottom: "6px" }}>Dari Tanggal</label>
                  <input type="date" className="input-glass" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(134,239,172,0.5)", marginBottom: "6px" }}>Sampai Tanggal</label>
                  <input type="date" className="input-glass" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KANAN: Export Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Export Buttons */}
          <div className="glass-strong rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={16} style={{ color: "#4ade80" }} /> Unduh Data
            </h3>
            <p style={{ fontSize: "12px", color: "rgba(134,239,172,0.4)", marginBottom: "18px" }}>
              Format yang tersedia
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* CSV */}
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", cursor: exporting ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: exporting ? 0.7 : 1,
                  background: exported ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08))",
                  border: `1px solid ${exported ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.25)"}`,
                  width: "100%",
                }}
              >
                {exported
                  ? <CheckCircle size={22} style={{ color: "#4ade80", flexShrink: 0 }} />
                  : exporting
                    ? <div style={{ width: 22, height: 22, border: "2px solid rgba(34,197,94,0.3)", borderTop: "2px solid #22c55e", borderRadius: "50%", animation: "spin-ring 0.8s linear infinite", flexShrink: 0 }} />
                    : <FileSpreadsheet size={22} style={{ color: "#4ade80", flexShrink: 0 }} />
                }
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>
                    {exported ? "Berhasil Diunduh!" : exporting ? "Mengekspor..." : "Export CSV"}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)" }}>
                    Kompatibel dengan Microsoft Excel
                  </p>
                </div>
                {!exporting && !exported && <ArrowRight size={16} style={{ color: "rgba(134,239,172,0.4)", marginLeft: "auto" }} />}
              </button>

              {/* PDF (coming soon) */}
              <button disabled style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", cursor: "not-allowed", opacity: 0.4, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", width: "100%" }}>
                <FileText size={22} style={{ color: "rgba(134,239,172,0.4)", flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>Export PDF</p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.3)" }}>Segera hadir</p>
                </div>
              </button>

              {/* Print */}
              <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", width: "100%" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <Printer size={22} style={{ color: "rgba(134,239,172,0.5)", flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>Cetak Laporan</p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.3)" }}>Buka dialog print browser</p>
                </div>
                <ArrowRight size={16} style={{ color: "rgba(134,239,172,0.3)", marginLeft: "auto" }} />
              </button>
            </div>
          </div>

          {/* Recent Exports */}
          <div className="glass rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={15} style={{ color: "#4ade80" }} /> Riwayat Export
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {RECENT.map((r) => (
                <div key={r.filename} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <FileSpreadsheet size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.filename}</p>
                    <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.35)" }}>{r.date} · {r.size}</p>
                  </div>
                  <CheckCircle size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .export-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
