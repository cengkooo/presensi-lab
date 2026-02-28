"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  Download, Mail, Calendar, BookOpen, Filter,
  MapPin, Award,
} from "lucide-react";
import {
  MOCK_USERS,
  getStudentClassSummaries,
  getStudentAttendanceHistory,
} from "@/lib/mockData";

/* ── STATUS ICON ── */
function AttStatus({ status }: { status: string | null }) {
  if (!status) return <XCircle size={14} style={{ color: "#f87171", opacity: 0.6 }} />;
  if (status === "hadir") return <CheckCircle size={14} style={{ color: "#4ade80" }} />;
  if (status === "telat") return <Clock size={14} style={{ color: "#facc15" }} />;
  if (status === "ditolak") return <AlertTriangle size={14} style={{ color: "#fb923c" }} />;
  return <XCircle size={14} style={{ color: "#f87171" }} />;
}

/* ── ATTENDANCE BAR ── */
function AttBar({ pct, min }: { pct: number; min: number }) {
  const color = pct >= min ? "#4ade80" : pct >= 60 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", minWidth: 80, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
        {/* Min threshold marker */}
        <div style={{ position: "absolute", top: 0, height: "100%", width: 1.5, background: "rgba(255,255,255,0.3)", left: `${min}%` }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

export default function MahasiswaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const user = MOCK_USERS.find((u) => u.id === userId);
  const classSummaries = useMemo(() => getStudentClassSummaries(userId), [userId]);
  const history = useMemo(() => getStudentAttendanceHistory(userId), [userId]);

  const [classFilter, setClassFilter] = useState<string>("all");

  const filteredHistory = useMemo(() =>
    classFilter === "all"
      ? history
      : history.filter((h) => h.kelas.id === classFilter),
    [history, classFilter]
  );

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0fdf4" }}>
        Mahasiswa tidak ditemukan.
      </div>
    );
  }

  /* Global stats across all classes */
  const totalHadir = classSummaries.reduce((a, c) => a + c.total_hadir + c.total_telat, 0);
  const totalSessi = classSummaries.reduce((a, c) => a + c.completed_sessions, 0);
  const totalAbsen = totalSessi - totalHadir;
  const avgPct = classSummaries.length > 0
    ? Math.round(classSummaries.reduce((a, c) => a + c.attendance_pct, 0) / classSummaries.length)
    : 0;

  const lastAttendance = history.find((h) => h.attendance !== null);

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = ["Sesi", "Kelas", "Tanggal", "Jam Check-in", "Jarak (m)", "Status"];
    const rows = filteredHistory.map((h) => [
      `"${h.session.title}"`,
      `"${h.kelas.name}"`,
      `"${h.session.date}"`,
      `"${h.attendance?.checked_in_at ? new Date(h.attendance.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}"`,
      `"${h.attendance?.distance_meters ?? "-"}"`,
      `"${h.attendance?.status ?? "absen"}"`,
    ]);
    const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    Object.assign(document.createElement("a"), {
      href: url, download: `riwayat_${user.nim}_${new Date().toISOString().split("T")[0]}.csv`,
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Back */}
      <button onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(134,239,172,0.5)", fontSize: "13px", background: "none", border: "none", cursor: "pointer", marginBottom: "20px", padding: 0 }}>
        <ArrowLeft size={15} /> Kembali ke daftar mahasiswa
      </button>

      {/* Profile Card */}
      <div className="glass rounded-2xl" style={{ padding: "22px 24px", marginBottom: "20px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#15803d,#22c55e)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {user.initial}
        </div>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
            <h1 style={{ color: "#f0fdf4", fontSize: "22px", fontWeight: 700 }}>{user.name}</h1>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px",
              background: user.role === "dosen" ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.1)",
              color: user.role === "dosen" ? "#facc15" : "#4ade80",
              border: user.role === "dosen" ? "1px solid rgba(234,179,8,0.25)" : "1px solid rgba(34,197,94,0.2)" }}>
              {user.role}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>
              Aktif
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>
              <Mail size={12} /> {user.email}
            </span>
            <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>NIM: <strong style={{ color: "#f0fdf4" }}>{user.nim}</strong></span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>
              <Calendar size={12} /> Bergabung: 20 Jan 2026
            </span>
          </div>
        </div>
        <button onClick={exportCSV} className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "9px 16px", flexShrink: 0 }}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }} className="mhs-stat-grid">
        {[
          { label: "Total Kelas", value: classSummaries.length, icon: <BookOpen size={15} style={{ color: "#4ade80" }} /> },
          { label: "Total Hadir", value: totalHadir, icon: <CheckCircle size={15} style={{ color: "#4ade80" }} /> },
          { label: "Total Absen", value: totalAbsen, icon: <XCircle size={15} style={{ color: "#f87171" }} /> },
          { label: "Rata-rata", value: `${avgPct}%`, icon: <Award size={15} style={{ color: avgPct >= 75 ? "#4ade80" : "#f87171" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.5)" }}>{s.label}</span>
            </div>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Kelas yang diikuti */}
      <div className="glass rounded-2xl" style={{ padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen size={15} style={{ color: "#4ade80" }} /> Kelas yang Diikuti
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {classSummaries.map((cs) => (
            <Link key={cs.kelas.id} href={`/dashboard/kelas/${cs.kelas.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(34,197,94,0.1)", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.1)"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#f0fdf4" }}>{cs.kelas.name}</p>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "20px", background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>
                      {cs.kelas.code}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)" }}>
                      {cs.total_hadir + cs.total_telat}/{cs.completed_sessions} sesi
                    </span>
                    <div style={{ flex: 1 }}>
                      <AttBar pct={cs.attendance_pct} min={cs.kelas.min_attendance_pct} />
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", flexShrink: 0,
                  background: cs.is_eligible ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                  color: cs.is_eligible ? "#4ade80" : "#f87171",
                  border: cs.is_eligible ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)" }}>
                  {cs.is_eligible ? "Lulus" : "Di bawah batas"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Riwayat Absensi Detail */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(34,197,94,0.1)", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={14} style={{ color: "#4ade80" }} /> Riwayat Absensi Detail
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={13} style={{ color: "rgba(134,239,172,0.4)" }} />
            <select
              className="select-glass"
              style={{ width: "auto", minWidth: "160px", fontSize: "12px", padding: "6px 10px" }}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">Semua Kelas</option>
              {classSummaries.map((cs) => (
                <option key={cs.kelas.id} value={cs.kelas.id}>{cs.kelas.code}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                {["SESI", "KELAS", "TANGGAL", "JAM", "JARAK", "STATUS"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "11px 18px", fontSize: "11px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((row, i) => {
                const att = row.attendance;
                const statusColor = !att || att.status === "absen" ? "#f87171" : att.status === "hadir" ? "#4ade80" : att.status === "telat" ? "#facc15" : "#fb923c";
                return (
                  <tr key={i}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <td style={{ padding: "11px 18px", fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{row.session.title}</td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(34,197,94,0.08)", color: "#4ade80", fontWeight: 600, border: "1px solid rgba(34,197,94,0.15)" }}>
                        {row.kelas.code}
                      </span>
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: "12px", color: "rgba(134,239,172,0.55)" }}>{row.session.date}</td>
                    <td style={{ padding: "11px 18px", fontSize: "12px", color: "rgba(134,239,172,0.55)", fontVariantNumeric: "tabular-nums" }}>
                      {att?.checked_in_at ? new Date(att.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: "12px", color: "rgba(134,239,172,0.55)", fontVariantNumeric: "tabular-nums" }}>
                      {att?.distance_meters != null ? `${att.distance_meters}m` : "—"}
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <AttStatus status={att?.status ?? null} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: statusColor, textTransform: "capitalize" }}>
                          {att?.status ?? "absen"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "rgba(134,239,172,0.3)", fontSize: "13px" }}>
                    Tidak ada riwayat absensi untuk filter ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(34,197,94,0.08)" }}>
          <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.35)" }}>
            Menampilkan {filteredHistory.length} dari {history.length} record
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) { .mhs-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
