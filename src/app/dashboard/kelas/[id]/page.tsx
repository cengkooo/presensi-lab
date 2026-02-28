"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Download, Radio, Users, CalendarDays,
  Percent, Award, MapPin,
} from "lucide-react";
import {
  MOCK_CLASSES, MOCK_ATTENDANCES, getSessionsByClass,
  computeStudentSummaries,
} from "@/lib/mockData";
import type { Attendance, Session } from "@/types";

/* ── STATUS CELL ── */
function StatusCell({ att, sessionActive }: { att: Attendance | null; sessionActive: boolean }) {
  if (!att) {
    return sessionActive
      ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: "rgba(134,239,172,0.35)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            ⏳
          </span>
        </div>
      )
      : <div style={{ display: "flex", justifyContent: "center" }}><XCircle size={15} style={{ color: "#f87171", opacity: 0.7 }} /></div>;
  }
  const map = {
    hadir:   { icon: <CheckCircle size={15} style={{ color: "#4ade80" }} />, label: "H" },
    telat:   { icon: <Clock size={15} style={{ color: "#facc15" }} />, label: "T" },
    absen:   { icon: <XCircle size={15} style={{ color: "#f87171" }} />, label: "A" },
    ditolak: { icon: <AlertTriangle size={15} style={{ color: "#fb923c" }} />, label: "!" },
  };
  return (
    <div title={att.status} style={{ display: "flex", justifyContent: "center" }}>
      {map[att.status]?.icon}
    </div>
  );
}

/* ── SESSION EXPAND ROW ── */
function SessionDetail({ session, attendances, enrolledUserIds }: {
  session: Session;
  attendances: Attendance[];
  enrolledUserIds: string[];
}) {
  const { MOCK_USERS } = require("@/lib/mockData");
  const rows = enrolledUserIds.map((uid: string) => {
    const user = MOCK_USERS.find((u: { id: string }) => u.id === uid)!;
    const att = attendances.find((a) => a.user_id === uid && a.session_id === session.id) ?? null;
    return { user, att };
  });
  const hadirCount = rows.filter((r) => r.att?.status === "hadir" || r.att?.status === "telat").length;

  return (
    <div style={{ padding: "14px 18px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(34,197,94,0.08)" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>
          <MapPin size={11} style={{ display: "inline", marginRight: 4 }} />{session.location}
        </span>
        <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>
          Radius: {session.radius_meters}m
        </span>
        <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 600 }}>
          {hadirCount}/{rows.length} hadir
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
        {rows.map(({ user, att }) => (
          <div key={user.id}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "10px",
              background: att && (att.status === "hadir" || att.status === "telat") ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${att && (att.status === "hadir" || att.status === "telat") ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)"}`,
            }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>
              {user.initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
              {att ? (
                <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)" }}>
                  {att.status === "absen" ? "Tidak hadir" : att.status === "ditolak" ? `Ditolak · ${att.distance_meters}m` : `${att.checked_in_at ? new Date(att.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"} · ${att.distance_meters}m`}
                </p>
              ) : (
                <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.25)" }}>
                  {session.is_active ? "Belum check-in" : "Absen"}
                </p>
              )}
            </div>
            <StatusCell att={att} sessionActive={session.is_active} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function KelasDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const kelas = MOCK_CLASSES.find((c) => c.id === classId);
  const sessions = getSessionsByClass(classId);
  const completedSessions = sessions.filter((s) => !s.is_active);
  const activeSession = sessions.find((s) => s.is_active);

  const [summaries, setSummaries] = useState(() => computeStudentSummaries(classId));
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([...MOCK_ATTENDANCES]);
  const [expandedSession, setExpandedSession] = useState<string | null>(activeSession?.id ?? null);

  // ── Mock Supabase Realtime: simulate new check-ins on active session ──
  useEffect(() => {
    if (!activeSession) return;
    const enrolledIds = summaries.map((s) => s.user.id);
    // check-in belum ada untuk u3–u10 di sesi aktif
    const notYetCheckedIn = enrolledIds.filter(
      (uid) => !allAttendances.some((a) => a.session_id === activeSession.id && a.user_id === uid)
    );
    if (notYetCheckedIn.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= notYetCheckedIn.length) { clearInterval(interval); return; }
      const uid = notYetCheckedIn[idx];
      const newAtt: Attendance = {
        id: `rt_${Date.now()}`,
        session_id: activeSession.id, user_id: uid,
        status: Math.random() > 0.2 ? "hadir" : "telat",
        distance_meters: Math.floor(Math.random() * 80) + 5,
        checked_in_at: new Date().toISOString(),
        student_lat: -6.2, student_lng: 106.8,
        created_at: new Date().toISOString(),
      };
      setAllAttendances((prev) => {
        const next = [...prev, newAtt];
        // Recompute summaries using updated attendances
        // Inject into MOCK_ATTENDANCES temporarily via closure
        setSummaries(computeStudentSummariesFrom(classId, next));
        return next;
      });
      idx++;
    }, 4000); // setiap 4 detik ada 1 mahasiswa check-in (mock realtime)

    return () => clearInterval(interval);
  }, [activeSession, classId]);

  // Helper: computeStudentSummaries dengan attendances yang bisa di-override
  function computeStudentSummariesFrom(cid: string, attendances: Attendance[]) {
    const { MOCK_ENROLLMENTS, MOCK_USERS, MOCK_CLASSES: classes } = require("@/lib/mockData");
    const cls = classes.find((c: { id: string }) => c.id === cid)!;
    const enrolled = (MOCK_ENROLLMENTS as Enrollment[]).filter((e: { class_id: string }) => e.class_id === cid);
    return enrolled.map((enrollment: { user_id: string; class_id: string; id: string; enrolled_at: string; is_eligible: boolean | null }) => {
      const user = (MOCK_USERS as User[]).find((u: { id: string }) => u.id === enrollment.user_id)!;
      const attMap: Record<string, Attendance | null> = {};
      sessions.forEach((sess) => {
        attMap[sess.id] = attendances.find(
          (a) => a.session_id === sess.id && a.user_id === enrollment.user_id
        ) ?? null;
      });
      const vals = Object.values(attMap);
      const total_hadir = vals.filter((a) => a?.status === "hadir").length;
      const total_telat = vals.filter((a) => a?.status === "telat").length;
      const total_absen = vals.filter((a) => a?.status === "absen" || a === null).length;
      const total_ditolak = vals.filter((a) => a?.status === "ditolak").length;
      const pct = completedSessions.length > 0
        ? Math.round(((total_hadir + total_telat) / completedSessions.length) * 100) : 0;
      return {
        user, enrollment: { ...enrollment }, attendanceMap: attMap,
        total_hadir, total_telat, total_absen, total_ditolak,
        attendance_pct: pct, is_eligible: pct >= cls.min_attendance_pct,
      };
    }).sort((a: { attendance_pct: number }, b: { attendance_pct: number }) => b.attendance_pct - a.attendance_pct);
  }

  // Types needed for the helper above
  type User = import("@/types").User;
  type Enrollment = import("@/types").Enrollment;

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const sesHeaders = sessions.map((s) => `"${s.title} (${s.date})"`);
    const header = ["Nama", "NIM", ...sesHeaders.map(h => h), "Total Hadir", "% Kehadiran", "Status Lulus"];
    const rows = summaries.map((s) => [
      `"${s.user.name}"`, `"${s.user.nim}"`,
      ...sessions.map((sess) => {
        const att = s.attendanceMap[sess.id];
        if (!att) return `"Absen"`;
        return `"${att.status}"`;
      }),
      `"${s.total_hadir + s.total_telat}"`,
      `"${s.attendance_pct}%"`,
      `"${s.is_eligible ? "Lulus" : "Tidak Lulus"}"`,
    ]);
    const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    Object.assign(document.createElement("a"), { href: url, download: `rekap_${kelas?.code}_${new Date().toISOString().split("T")[0]}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  if (!kelas) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0fdf4" }}>
      Kelas tidak ditemukan.
    </div>
  );

  const avgPct = summaries.length > 0 ? Math.round(summaries.reduce((a, s) => a + s.attendance_pct, 0) / summaries.length) : 0;
  const eligibleCount = summaries.filter((s) => s.is_eligible).length;

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: "24px" }}>
        <button onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(134,239,172,0.5)", fontSize: "13px", background: "none", border: "none", cursor: "pointer", marginBottom: "14px", padding: 0 }}>
          <ArrowLeft size={15} /> Kembali ke daftar kelas
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ color: "#f0fdf4", fontSize: "24px", fontWeight: 700, lineHeight: 1.2 }}>{kelas.name}</h1>
              <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                {kelas.code}
              </span>
              {activeSession && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
                  LIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "rgba(134,239,172,0.45)" }}>
              {kelas.lecturer} · {kelas.semester} · Min. kehadiran: {kelas.min_attendance_pct}%
            </p>
          </div>
          <button onClick={exportCSV} className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "9px 16px", flexShrink: 0 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }} className="detail-stat-grid">
        {[
          { label: "Total Mahasiswa", value: summaries.length, icon: <Users size={15} style={{ color: "#4ade80" }} /> },
          { label: "Rata-rata Hadir", value: `${avgPct}%`, icon: <Percent size={15} style={{ color: avgPct >= kelas.min_attendance_pct ? "#4ade80" : "#f87171" }} /> },
          { label: "Sesi Selesai", value: `${completedSessions.length}/${kelas.total_sessions_planned}`, icon: <CalendarDays size={15} style={{ color: "#4ade80" }} /> },
          { label: "Lulus Min. Kehadiran", value: `${eligibleCount}/${summaries.length}`, icon: <Award size={15} style={{ color: "#4ade80" }} /> },
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

      {/* ── MATRIX: Mahasiswa × Sesi ── */}
      <div className="glass rounded-2xl" style={{ marginBottom: "20px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(34,197,94,0.1)", display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4" }}>Rekap Per Mahasiswa</h2>
          <div style={{ display: "flex", gap: "14px", marginLeft: "auto" }}>
            {[
              { icon: <CheckCircle size={12} style={{ color: "#4ade80" }} />, label: "Hadir" },
              { icon: <Clock size={12} style={{ color: "#facc15" }} />, label: "Telat" },
              { icon: <XCircle size={12} style={{ color: "#f87171" }} />, label: "Absen/Belum" },
              { icon: <AlertTriangle size={12} style={{ color: "#fb923c" }} />, label: "Ditolak" },
            ].map((l) => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "rgba(134,239,172,0.45)" }}>
                {l.icon} {l.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                <th style={{ textAlign: "left", padding: "10px 20px", fontSize: "11px", fontWeight: 700, color: "#22c55e", position: "sticky", left: 0, background: "rgba(4,14,8,0.95)", zIndex: 1, minWidth: "160px" }}>
                  MAHASISWA
                </th>
                {sessions.map((s) => (
                  <th key={s.id} style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: s.is_active ? "#f87171" : "#22c55e", whiteSpace: "nowrap", minWidth: "60px" }}>
                    <div>{s.title}</div>
                    <div style={{ fontSize: "9px", fontWeight: 400, color: "rgba(134,239,172,0.35)", marginTop: "2px" }}>
                      {new Date(s.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </div>
                    {s.is_active && (
                      <div style={{ fontSize: "9px", color: "#f87171", fontWeight: 700, marginTop: "1px" }}>● LIVE</div>
                    )}
                  </th>
                ))}
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: "#22c55e", minWidth: "70px" }}>
                  HADIR
                </th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: "#22c55e", minWidth: "60px" }}>
                  %
                </th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: "#22c55e", minWidth: "80px" }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.user.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  {/* Student name — sticky */}
                  <td style={{ padding: "11px 20px", position: "sticky", left: 0, background: "rgba(4,14,8,0.95)", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>
                        {s.user.initial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4", whiteSpace: "nowrap" }}>{s.user.name}</p>
                        <p style={{ fontSize: "10px", color: "rgba(134,239,172,0.4)" }}>{s.user.nim}</p>
                      </div>
                    </div>
                  </td>
                  {/* Status cells per session */}
                  {sessions.map((sess) => (
                    <td key={sess.id} style={{ padding: "10px 12px", textAlign: "center" }}>
                      <StatusCell att={s.attendanceMap[sess.id] ?? null} sessionActive={sess.is_active} />
                    </td>
                  ))}
                  {/* Total hadir */}
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>
                      {s.total_hadir + s.total_telat}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.35)" }}>/{completedSessions.length}</span>
                  </td>
                  {/* % kehadiran + mini bar */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ textAlign: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                        color: s.attendance_pct >= kelas.min_attendance_pct ? "#4ade80" : s.attendance_pct >= 60 ? "#facc15" : "#f87171" }}>
                        {s.attendance_pct}%
                      </span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", width: "100%", minWidth: 40 }}>
                      <div style={{ height: "100%", width: `${s.attendance_pct}%`, borderRadius: 2, transition: "width 0.5s ease",
                        background: s.attendance_pct >= kelas.min_attendance_pct ? "#4ade80" : s.attendance_pct >= 60 ? "#facc15" : "#f87171" }} />
                    </div>
                  </td>
                  {/* Lulus/Tidak */}
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px",
                      background: s.is_eligible ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                      color: s.is_eligible ? "#4ade80" : "#f87171",
                      border: s.is_eligible ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.2)" }}>
                      {s.is_eligible ? "Lulus" : "Tidak"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETAIL PER SESI (expandable) ── */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4", marginBottom: "12px" }}>
          Detail Per Sesi — klik untuk expand
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...sessions].reverse().map((sess) => {
            const isExpanded = expandedSession === sess.id;
            const sessAttendances = allAttendances.filter((a) => a.session_id === sess.id);
            const hadirCount = sessAttendances.filter((a) => a.status === "hadir" || a.status === "telat").length;
            const enrolledUserIds = summaries.map((s) => s.user.id);

            return (
              <div key={sess.id} className="glass rounded-2xl" style={{ overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : sess.id)}
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {/* Status indicator */}
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: sess.is_active ? "#f87171" : "#22c55e",
                    animation: sess.is_active ? "pulse-dot 1.5s ease-in-out infinite" : "none" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#f0fdf4" }}>{sess.title}</span>
                      {sess.is_active && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.12)", padding: "1px 7px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.25)" }}>LIVE</span>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)" }}>
                      {new Date(sess.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {" · "}
                      {sess.is_active
                        ? `${sessAttendances.length} check-in sejauh ini`
                        : `${hadirCount}/${enrolledUserIds.length} hadir`}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {!sess.is_active && (
                      <div style={{ height: 6, width: "60px", background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round(hadirCount / enrolledUserIds.length * 100)}%`, background: "#22c55e", borderRadius: 3 }} />
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} style={{ color: "rgba(134,239,172,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(134,239,172,0.4)" }} />}
                  </div>
                </button>
                {isExpanded && (
                  <SessionDetail
                    session={sess}
                    attendances={allAttendances}
                    enrolledUserIds={enrolledUserIds}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .detail-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
