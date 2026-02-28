"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FlaskConical, Users, CalendarDays, ChevronRight,
  CheckCircle, AlertTriangle, Radio,
} from "lucide-react";
import {
  MOCK_CLASSES, getSessionsByClass, getEnrolledUsers, computeStudentSummaries,
} from "@/lib/mockData";

export default function KelasPage() {
  const classes = useMemo(() =>
    MOCK_CLASSES.map((kelas) => {
      const sessions = getSessionsByClass(kelas.id);
      const enrolled = getEnrolledUsers(kelas.id);
      const summaries = computeStudentSummaries(kelas.id);
      const completedSessions = sessions.filter((s) => !s.is_active);
      const avgPct = summaries.length > 0
        ? Math.round(summaries.reduce((a, s) => a + s.attendance_pct, 0) / summaries.length)
        : 0;
      const eligibleCount = summaries.filter((s) => s.is_eligible).length;
      const activeSession = sessions.find((s) => s.is_active);
      return { kelas, sessions, enrolled, completedSessions, avgPct, eligibleCount, activeSession };
    }),
    []
  );

  const totalStats = {
    totalKelas: classes.length,
    totalMhs: new Set(classes.flatMap((c) => c.enrolled.map((u) => u.id))).size,
    avgKehadiran: Math.round(classes.reduce((a, c) => a + c.avgPct, 0) / classes.length),
    activeCount: classes.filter((c) => c.activeSession).length,
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Kelas Praktikum
        </h1>
        <p style={{ color: "rgba(134,239,172,0.5)", fontSize: "14px", marginTop: "6px" }}>
          Kelola kelas, sesi, dan rekap absensi seluruh mahasiswa
        </p>
      </div>

      {/* Global Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "28px" }}
        className="kelas-stat-grid">
        {[
          { label: "Total Kelas", value: totalStats.totalKelas, icon: <FlaskConical size={16} style={{ color: "#4ade80" }} /> },
          { label: "Total Mahasiswa", value: totalStats.totalMhs, icon: <Users size={16} style={{ color: "#4ade80" }} /> },
          { label: "Rata-rata Kehadiran", value: `${totalStats.avgKehadiran}%`, icon: <CheckCircle size={16} style={{ color: "#4ade80" }} /> },
          { label: "Sesi Aktif Sekarang", value: totalStats.activeCount, icon: <Radio size={16} style={{ color: "#f87171" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "8px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.5)" }}>{s.label}</span>
            </div>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Class Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {classes.map(({ kelas, sessions, enrolled, completedSessions, avgPct, eligibleCount, activeSession }) => (
          <Link key={kelas.id} href={`/dashboard/kelas/${kelas.id}`}
            style={{ textDecoration: "none" }}>
            <div
              className="glass glass-hover rounded-2xl"
              style={{ padding: "20px 22px", cursor: "pointer", display: "flex", alignItems: "center", gap: "20px" }}
            >
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: "14px", background: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(34,197,94,0.1))", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FlaskConical size={22} style={{ color: "#4ade80" }} />
              </div>

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>{kelas.name}</h3>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                    {kelas.code}
                  </span>
                  {activeSession && (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
                      LIVE
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "rgba(134,239,172,0.45)" }}>
                  {kelas.lecturer} · {kelas.semester} · {kelas.location}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "28px", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{enrolled.length}</p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", marginTop: "2px" }}>Mahasiswa</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>
                    {completedSessions.length}<span style={{ fontSize: "13px", color: "rgba(134,239,172,0.4)" }}>/{kelas.total_sessions_planned}</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", marginTop: "2px" }}>Sesi</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: avgPct >= kelas.min_attendance_pct ? "#4ade80" : avgPct >= 60 ? "#facc15" : "#f87171" }}>
                    {avgPct}%
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", marginTop: "2px" }}>Rata-rata</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>
                    {eligibleCount}<span style={{ fontSize: "13px", color: "rgba(134,239,172,0.4)" }}>/{enrolled.length}</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", marginTop: "2px" }}>Lulus</p>
                </div>
              </div>

              <ChevronRight size={18} style={{ color: "rgba(134,239,172,0.3)", flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) { .kelas-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
