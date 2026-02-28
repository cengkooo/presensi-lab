"use client";

import { useState, useEffect } from "react";
import {
  Download, FileText, FileSpreadsheet, Printer,
  Calendar, ChevronDown, CheckCircle,
  Archive, Clock, ArrowRight, ClipboardList, SlidersHorizontal, History,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/* ── EXPORT OPTIONS ── */
const REPORT_TYPES = [
  { id: "all", label: "Semua Data Absensi", desc: "Seluruh riwayat kehadiran semua sesi" },
  { id: "session", label: "Per Sesi Praktikum", desc: "Rekap kehadiran berdasarkan sesi tertentu" },
  { id: "student", label: "Per Mahasiswa", desc: "Rekap kehadiran per individu mahasiswa" },
  { id: "summary", label: "Rekap Bulanan", desc: "Ringkasan statistik kehadiran per bulan" },
];

/* ── STAT MINI ── */
function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <span style={{ fontSize: "12px", color: "rgba(110,231,183,0.5)" }}>{label}</span>
      </div>
      <p style={{ fontSize: "26px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

interface ClassOption { id: string; code: string; name: string; }

export default function ExportPage() {
  const { profile, loading: authLoading } = useSupabaseSession();
  const role    = profile?.role ?? "mahasiswa";
  const isStaff = role === "dosen" || role === "asisten" || role === "admin";

  const [reportType, setReportType] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  // Fetch classes for dropdown
  useEffect(() => {
    fetch("/api/classes", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setClasses(json.data.map((c: any) => ({ id: c.id, code: c.code, name: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch counts when filters change
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createSupabaseBrowserClient() as any;
    let attQuery = supabase
      .from("attendance")
      .select("id, sessions!inner( session_date, class_id )", { count: "exact", head: true })
      .gte("sessions.session_date", dateFrom)
      .lte("sessions.session_date", dateTo);
    let sessQuery = supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .gte("session_date", dateFrom)
      .lte("session_date", dateTo);
    if (selectedClassId !== "all") {
      attQuery  = attQuery.eq("sessions.class_id", selectedClassId);
      sessQuery = sessQuery.eq("class_id", selectedClassId);
    }
    Promise.all([attQuery, sessQuery]).then(
      ([{ count: attCount }, { count: sCount }]: [{ count: number | null }, { count: number | null }]) => {
        setTotalCount(attCount ?? 0);
        setSessionCount(sCount ?? 0);
      }
    ).catch(() => {});
  }, [selectedClassId, dateFrom, dateTo]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createSupabaseBrowserClient() as any;
      let query = supabase
        .from("attendance")
        .select(`
          id, status, checked_in_at, distance_meter,
          profiles ( full_name, nim ),
          sessions!inner ( id, title, location, session_date, class_id,
            classes ( code, name ) )
        `)
        .gte("sessions.session_date", dateFrom)
        .lte("sessions.session_date", dateTo)
        .order("checked_in_at", { ascending: true })
        .limit(5000);
      if (selectedClassId !== "all") {
        query = query.eq("sessions.class_id", selectedClassId);
      }
      const { data } = await query;
      if (!data || data.length === 0) {
        alert("Tidak ada data untuk ekspor dengan filter yang dipilih.");
        setExporting(false);
        return;
      }
      const BOM = "\uFEFF";
      const header = ["No", "Nama", "NIM", "Sesi", "Kelas", "Tanggal", "Jam Check-in", "Status", "Jarak (meter)"];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const csvRows = data.map((r: any, i: number) => [
        `"${i + 1}"`,
        `"${r.profiles?.full_name ?? "-"}"`,
        `"${r.profiles?.nim ?? "-"}"`,
        `"${r.sessions?.title ?? "-"}"`,
        `"${r.sessions?.classes?.code ?? ""} — ${r.sessions?.classes?.name ?? ""}"`,
        `"${r.sessions?.session_date ?? "-"}"`,
        `"${r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}"`,
        `"${r.status}"`,
        `"${r.distance_meter ?? "-"}"`,
      ]);
      const csv = BOM + [header.join(","), ...csvRows.map((r: string[]) => r.join(","))].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      Object.assign(document.createElement("a"), {
        href: url,
        download: `absensi_export_${dateTo}.csv`,
      }).click();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch {
      alert("Gagal mengambil data untuk ekspor.");
    } finally {
      setExporting(false);
    }
  };

  // ── Loading / Access Guard ──
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "32px" }}>
        <div style={{ fontSize: "40px" }}>🔒</div>
        <h2 style={{ color: "#f0fdf4", fontSize: "18px", fontWeight: 700 }}>Akses Dibatasi</h2>
        <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", textAlign: "center" }}>
          Halaman ini hanya dapat diakses oleh dosen dan asisten.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Export Data</h1>
        <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>
          Unduh data absensi dalam format CSV atau cetak laporan
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
        <MiniStat label="Total Record" value={totalCount.toLocaleString("id-ID")} icon={<Archive size={15} style={{ color: "#34D399" }} />} />
        <MiniStat label="Sesi Tersedia" value={sessionCount.toLocaleString("id-ID")} icon={<Calendar size={15} style={{ color: "#34D399" }} />} />
        <MiniStat label="Export Terakhir" value="Hari Ini" icon={<Clock size={15} style={{ color: "#34D399" }} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }} className="export-grid">
        {/* ── KIRI: Form Konfigurasi ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Tipe Laporan */}
          <div className="glass rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={16} style={{ color: "#34D399" }} /> Tipe Laporan
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {REPORT_TYPES.map((t) => (
                <label key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                  background: reportType === t.id ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${reportType === t.id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <div style={{ marginTop: "2px", width: 16, height: 16, borderRadius: "50%", border: `2px solid ${reportType === t.id ? "#10B981" : "rgba(16,185,129,0.3)"}`, background: reportType === t.id ? "#10B981" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {reportType === t.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <input type="radio" name="reportType" value={t.id} checked={reportType === t.id} onChange={() => setReportType(t.id)} style={{ display: "none" }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: reportType === t.id ? "#34D399" : "#f0fdf4" }}>{t.label}</p>
                    <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="glass rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <SlidersHorizontal size={16} style={{ color: "#34D399" }} /> Filter Data
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>Kelas Praktikum</label>
                <div style={{ position: "relative" }}>
                  <select className="select-glass" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    <option value="all">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(110,231,183,0.3)", pointerEvents: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>Dari Tanggal</label>
                  <input type="date" className="input-glass" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>Sampai Tanggal</label>
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
              <Download size={16} style={{ color: "#34D399" }} /> Unduh Data
            </h3>
            <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.4)", marginBottom: "18px" }}>
              Format yang tersedia
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* CSV */}
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", cursor: exporting ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: exporting ? 0.7 : 1,
                  background: exported ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.08))",
                  border: `1px solid ${exported ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.25)"}`,
                  width: "100%",
                }}
              >
                {exported
                  ? <CheckCircle size={22} style={{ color: "#34D399", flexShrink: 0 }} />
                  : exporting
                    ? <div style={{ width: 22, height: 22, border: "2px solid rgba(16,185,129,0.3)", borderTop: "2px solid #10B981", borderRadius: "50%", animation: "spin-ring 0.8s linear infinite", flexShrink: 0 }} />
                    : <FileSpreadsheet size={22} style={{ color: "#34D399", flexShrink: 0 }} />
                }
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>
                    {exported ? "Berhasil Diunduh!" : exporting ? "Mengekspor..." : "Export CSV"}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>
                    Kompatibel dengan Microsoft Excel
                  </p>
                </div>
                {!exporting && !exported && <ArrowRight size={16} style={{ color: "rgba(110,231,183,0.4)", marginLeft: "auto" }} />}
              </button>

              {/* PDF (coming soon) */}
              <button disabled style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", cursor: "not-allowed", opacity: 0.4, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", width: "100%" }}>
                <FileText size={22} style={{ color: "rgba(110,231,183,0.4)", flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>Export PDF</p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.3)" }}>Segera hadir</p>
                </div>
              </button>

              {/* Print */}
              <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", width: "100%" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <Printer size={22} style={{ color: "rgba(110,231,183,0.5)", flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>Cetak Laporan</p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.3)" }}>Buka dialog print browser</p>
                </div>
                <ArrowRight size={16} style={{ color: "rgba(110,231,183,0.3)", marginLeft: "auto" }} />
              </button>
            </div>
          </div>

          {/* Info card */}
          <div className="glass rounded-2xl" style={{ padding: "20px" }}>
            <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={15} style={{ color: "#34D399" }} /> Panduan Export
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: 0, listStyle: "none" }}>
              {[
                "Filter kelas + tanggal sebelum ekspor",
                "Hasil CSV UTF-8 BOM — aman untuk Excel",
                "Maksimal 5.000 baris per ekspor",
                "Klik Export CSV lalu pilih folder simpan",
              ].map((tip) => (
                <li key={tip} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(110,231,183,0.5)" }}>
                  <CheckCircle size={12} style={{ color: "#34D399", flexShrink: 0 }} />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .export-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
