"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  MapPin, Radio, Users, Play, Square, RefreshCw, Zap,
} from "lucide-react";
import {
  MOCK_ATTENDANCES,
  getSessionsByClass, computeStudentSummaries,
} from "@/lib/mockData";
import { MOCK_USERS } from "@/lib/mockData";
import { useClasses } from "@/context/ClassesContext";
import type { Attendance } from "@/types";

/* ── LIVE FEED ROW ── */
function LiveRow({ user, att, sessionActive }: {
  user: { name: string; initial: string; nim: string };
  att: Attendance | null;
  sessionActive: boolean;
  isNew?: boolean;
}) {
  const notCheckedIn = !att && sessionActive;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
      borderRadius: "11px", transition: "all 0.4s ease",
      background: att && (att.status === "hadir" || att.status === "telat")
        ? "rgba(34,197,94,0.07)" : notCheckedIn ? "rgba(255,255,255,0.015)" : "rgba(239,68,68,0.05)",
      border: att && (att.status === "hadir" || att.status === "telat")
        ? "1px solid rgba(34,197,94,0.2)" : notCheckedIn ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(239,68,68,0.15)",
    }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>
        {user.initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{user.name}</p>
        <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", fontVariantNumeric: "tabular-nums" }}>{user.nim}</p>
      </div>
      {att ? (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "2px" }}>
            {att.status === "hadir" && <><CheckCircle size={14} style={{ color: "#4ade80" }} /><span style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80" }}>Hadir</span></>}
            {att.status === "telat" && <><Clock size={14} style={{ color: "#facc15" }} /><span style={{ fontSize: "12px", fontWeight: 700, color: "#facc15" }}>Telat</span></>}
            {att.status === "absen" && <><XCircle size={14} style={{ color: "#f87171" }} /><span style={{ fontSize: "12px", fontWeight: 700, color: "#f87171" }}>Absen</span></>}
            {att.status === "ditolak" && <><AlertTriangle size={14} style={{ color: "#fb923c" }} /><span style={{ fontSize: "12px", fontWeight: 700, color: "#fb923c" }}>Ditolak</span></>}
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            {att.checked_in_at && (
              <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", display: "flex", alignItems: "center", gap: "3px" }}>
                <Clock size={10} /> {new Date(att.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {att.distance_meters != null && (
              <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", display: "flex", alignItems: "center", gap: "3px" }}>
                <MapPin size={10} /> {att.distance_meters}m
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flexShrink: 0 }}>
          {sessionActive ? (
            <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.3)", fontStyle: "italic" }}>Belum check-in</span>
          ) : (
            <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 600 }}>Absen</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function SesiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const sesiId = params.sesiId as string;
  const { classes: allClasses } = useClasses();

  const kelas = allClasses.find((c) => c.id === classId);
  const session = getSessionsByClass(classId).find((s) => s.id === sesiId);
  const summaries = computeStudentSummaries(classId);

  const [attendances, setAttendances] = useState<Attendance[]>([...MOCK_ATTENDANCES]);
  const [isLive, setIsLive] = useState(session?.is_active ?? false);
  const [newCheckIns, setNewCheckIns] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);

  // Session timer
  useEffect(() => {
    if (!isLive) return;
    const iv = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [isLive]);

  // Mock Realtime — simulate check-ins when session is live
  useEffect(() => {
    if (!isLive) return;
    const enrolledIds = summaries.map((s) => s.user.id);
    const notYet = enrolledIds.filter(
      (uid) => !attendances.some((a) => a.session_id === sesiId && a.user_id === uid)
    );
    if (notYet.length === 0) return;
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= notYet.length) { clearInterval(iv); return; }
      const uid = notYet[idx++];
      const newAtt: Attendance = {
        id: `rt_${Date.now()}`, session_id: sesiId, user_id: uid,
        status: Math.random() > 0.15 ? "hadir" : "telat",
        distance_meters: Math.floor(Math.random() * 80) + 5,
        checked_in_at: new Date().toISOString(),
        student_lat: -6.2, student_lng: 106.8,
        created_at: new Date().toISOString(),
      };
      setAttendances((prev) => [...prev, newAtt]);
      setNewCheckIns((prev) => {
        const next = new Set(prev);
        next.add(uid);
        setTimeout(() => setNewCheckIns((p) => { const n = new Set(p); n.delete(uid); return n; }), 3000);
        return next;
      });
    }, 3500);
    return () => clearInterval(iv);
  }, [isLive, sesiId, summaries.length]);

  if (!kelas || !session) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0fdf4" }}>Sesi tidak ditemukan.</div>
  );

  const sessAtts = attendances.filter((a) => a.session_id === sesiId);
  const hadirCount = sessAtts.filter((a) => a.status === "hadir" || a.status === "telat").length;
  const pct = summaries.length > 0 ? Math.round(hadirCount / summaries.length * 100) : 0;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => router.push(`/dashboard/kelas/${classId}`)}
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(134,239,172,0.5)", fontSize: "13px", background: "none", border: "none", cursor: "pointer", marginBottom: "12px", padding: 0 }}>
          <ArrowLeft size={14} /> {kelas.name}
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0fdf4" }}>{session.title}</h1>
              <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.45)" }}>
                {new Date(session.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              {isLive && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} /> LIVE {fmt(elapsed)}
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "rgba(134,239,172,0.45)" }}>
              <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{session.location} · Radius {session.radius_meters}m · {session.duration_minutes} menit
            </p>
          </div>
          {/* Activate/Deactivate button */}
          <button
            onClick={() => setIsLive(!isLive)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", border: "none",
              background: isLive ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#15803d,#22c55e)",
              color: "#fff", boxShadow: isLive ? "0 0 20px rgba(239,68,68,0.3)" : "0 0 20px rgba(34,197,94,0.3)" }}>
            {isLive ? <><Square size={14} /> Hentikan Absensi</> : <><Play size={14} /> Aktifkan Absensi</>}
          </button>
        </div>
      </div>

      {/* Live Status Banner */}
      {isLive && (
        <div style={{ padding: "14px 18px", borderRadius: "14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Radio size={16} style={{ color: "#f87171", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#f87171" }}>Absensi Sedang Berlangsung</p>
            <p style={{ fontSize: "12px", color: "rgba(239,96,96,0.6)", marginTop: "2px" }}>
              Mahasiswa bisa melakukan check-in via aplikasi · Link: <span style={{ fontFamily: "monospace", color: "#f87171" }}>presenslab.app/{sesiId}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#f87171", fontVariantNumeric: "tabular-nums" }}>{hadirCount}</p>
              <p style={{ fontSize: "10px", color: "rgba(239,96,96,0.5)" }}>Hadir</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "rgba(134,239,172,0.5)", fontVariantNumeric: "tabular-nums" }}>{summaries.length - hadirCount}</p>
              <p style={{ fontSize: "10px", color: "rgba(134,239,172,0.3)" }}>Belum</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }} className="sesi-stat-grid">
        {[
          { label: "Total Terdaftar", value: summaries.length, icon: <Users size={14} style={{ color: "#4ade80" }} /> },
          { label: isLive ? "Check-in Sejauh Ini" : "Total Hadir", value: hadirCount, icon: <CheckCircle size={14} style={{ color: "#4ade80" }} /> },
          { label: "Persentase", value: `${pct}%`, icon: <Zap size={14} style={{ color: pct >= kelas.min_attendance_pct ? "#4ade80" : "#f87171" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.5)" }}>{s.label}</span>
            </div>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="glass rounded-2xl" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4" }}>Progress Kehadiran</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>{hadirCount}/{summaries.length} ({pct}%)</span>
        </div>
        <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#15803d,#22c55e,#4ade80)", borderRadius: 5, transition: "width 0.5s ease",
            boxShadow: pct > 0 ? "0 0 10px rgba(34,197,94,0.4)" : "none" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "10px", color: "rgba(134,239,172,0.35)" }}>Batas min: {kelas.min_attendance_pct}%</span>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ fontSize: "10px", color: "rgba(134,239,172,0.35)" }}>
              Hadir: {sessAtts.filter((a) => a.status === "hadir").length}
            </span>
            <span style={{ fontSize: "10px", color: "rgba(234,179,8,0.5)" }}>
              Telat: {sessAtts.filter((a) => a.status === "telat").length}
            </span>
            <span style={{ fontSize: "10px", color: "rgba(239,68,68,0.5)" }}>
              Ditolak: {sessAtts.filter((a) => a.status === "ditolak").length}
            </span>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(34,197,94,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4", flex: 1 }}>
            {isLive ? "Live Feed Absensi" : "Daftar Kehadiran"}
          </h2>
          {isLive && (
            <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)", display: "flex", alignItems: "center", gap: "5px" }}>
              <RefreshCw size={11} style={{ animation: "spin 2s linear infinite" }} /> Auto-update
            </span>
          )}
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "70vh", overflowY: "auto" }}>
          {/* Checked in first, then pending */}
          {summaries.map((s) => {
            const att = attendances.find((a) => a.session_id === sesiId && a.user_id === s.user.id) ?? null;
            const isNew = newCheckIns.has(s.user.id);
            return (
              <div key={s.user.id} style={{ transition: "all 0.4s ease", transform: isNew ? "scale(1.01)" : "scale(1)", filter: isNew ? "brightness(1.15)" : "brightness(1)" }}>
                <LiveRow user={s.user} att={att} sessionActive={isLive} isNew={isNew} />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) { .sesi-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
