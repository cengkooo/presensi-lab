"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronRight, Download, Radio, CalendarDays, Percent, Award,
  Edit2, Save, X, MapPin,
} from "lucide-react";
import {
  MOCK_ATTENDANCES, MOCK_USERS,
  getSessionsByClass, computeStudentSummaries,
} from "@/lib/mockData";
import { useClasses } from "@/context/ClassesContext";
import type { Attendance, AttendanceStatus, Session } from "@/types";

type Tab = "sesi" | "mahasiswa" | "rekap";
type OverrideKey = `${string}_${string}`; // `${userId}_${sessionId}`

const STATUS_OPTIONS: { status: AttendanceStatus; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { status: "hadir",   label: "Hadir",   color: "#4ade80", bg: "rgba(34,197,94,0.15)",   icon: <CheckCircle size={13} /> },
  { status: "telat",   label: "Telat",   color: "#facc15", bg: "rgba(234,179,8,0.15)",   icon: <Clock size={13} /> },
  { status: "absen",   label: "Absen",   color: "#f87171", bg: "rgba(239,68,68,0.15)",   icon: <XCircle size={13} /> },
  { status: "ditolak", label: "Ditolak", color: "#fb923c", bg: "rgba(249,115,22,0.15)",  icon: <AlertTriangle size={13} /> },
];


/* ── ICON-ONLY STATUS CELL with mini dropdown ── */
const STATUS_CYCLE: AttendanceStatus[] = ["hadir", "telat", "absen", "ditolak"];

const STATUS_META: Record<AttendanceStatus, { icon: React.ReactNode; color: string; bg: string }> = {
  hadir:   { icon: <CheckCircle size={14} />,   color: "#4ade80", bg: "rgba(34,197,94,0.18)" },
  telat:   { icon: <Clock size={14} />,          color: "#facc15", bg: "rgba(234,179,8,0.18)" },
  absen:   { icon: <XCircle size={14} />,        color: "#f87171", bg: "rgba(239,68,68,0.18)" },
  ditolak: { icon: <AlertTriangle size={14} />,  color: "#fb923c", bg: "rgba(249,115,22,0.18)" },
};

function AttendanceOverrideCell({
  att, sessionActive, overrideStatus, onOverride,
}: {
  att: Attendance | null;
  sessionActive: boolean;
  overrideStatus: AttendanceStatus | null;
  onOverride: (s: AttendanceStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const effectiveStatus: AttendanceStatus | null = overrideStatus ?? (att?.status ?? null);
  const meta = effectiveStatus ? STATUS_META[effectiveStatus] : null;

  return (
    <div ref={ref} style={{ display: "flex", justifyContent: "center", position: "relative" }}>
      {/* Trigger button — icon only */}
      <button
        onClick={() => setOpen((p) => !p)}
        title={effectiveStatus ?? "belum absen"}
        style={{
          width: 28, height: 28, borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: meta ? meta.bg : "transparent",
          border: `1px solid ${meta ? meta.color + "44" : "transparent"}`,
          color: meta?.color ?? "rgba(134,239,172,0.2)",
          cursor: "pointer", position: "relative", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.3)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
      >
        {meta
          ? meta.icon
          : sessionActive
            ? <span style={{ fontSize: 11, color: "rgba(134,239,172,0.2)" }}>·</span>
            : <XCircle size={13} style={{ color: "#f87171", opacity: 0.3 }} />}
      </button>

      {/* Mini icon-only dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: 32, left: "50%", transform: "translateX(-50%)", zIndex: 200,
          background: "rgba(4,14,8,0.97)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "10px", padding: "5px", boxShadow: "0 6px 24px rgba(0,0,0,0.7)",
          display: "flex", gap: "3px",
        }}>
          {STATUS_CYCLE.map((s) => {
            const m = STATUS_META[s];
            const isActive = effectiveStatus === s;
            return (
              <button key={s}
                onClick={() => { onOverride(s); setOpen(false); }}
                title={s}
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? m.bg : "transparent",
                  border: `1px solid ${isActive ? m.color + "66" : "transparent"}`,
                  color: m.color, cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = m.bg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? m.bg : "transparent"; }}
              >
                {m.icon}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ── SESSION MODAL ── */
function SessionModal({ initial, onSave, onClose }: {
  initial?: Partial<Session>;
  onSave: (f: { title: string; date: string; location: string; radius_meters: number; duration_minutes: number }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    date: initial?.date ?? "",
    location: initial?.location ?? "",
    radius_meters: initial?.radius_meters ?? 100,
    duration_minutes: initial?.duration_minutes ?? 90,
  });
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: "20px", padding: "24px", background: "rgba(4,14,8,0.98)", border: "1px solid rgba(34,197,94,0.25)", boxShadow: "0 0 60px rgba(34,197,94,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0fdf4" }}>{initial ? "Edit Sesi" : "Buat Sesi Baru"}</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(134,239,172,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(134,239,172,0.5)", marginBottom: "5px" }}>Nama Sesi *</label>
            <input className="input-glass" placeholder="cth: Sesi 7" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(134,239,172,0.5)", marginBottom: "5px" }}>Tanggal *</label>
              <input type="date" className="input-glass" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(134,239,172,0.5)", marginBottom: "5px" }}>Durasi (menit)</label>
              <input type="number" className="input-glass" min={15} max={240} value={form.duration_minutes} onChange={(e) => set("duration_minutes", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(134,239,172,0.5)", marginBottom: "5px" }}>Lokasi *</label>
            <input className="input-glass" placeholder="cth: Lab Komputer A" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(134,239,172,0.5)", marginBottom: "5px" }}>Radius GPS (meter)</label>
            <input type="number" className="input-glass" min={10} max={500} value={form.radius_meters} onChange={(e) => set("radius_meters", Number(e.target.value))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} className="btn-ghost flex-1 rounded-xl" style={{ padding: "10px" }}>Batal</button>
          <button
            onClick={() => { if (form.title && form.date && form.location) { onSave(form); onClose(); } }}
            className="btn-primary flex-1 rounded-xl" style={{ gap: "8px" }}>
            <Save size={13} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function KelasDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { classes: allClasses } = useClasses();

  const kelas = allClasses.find((c) => c.id === classId);
  const initialSessions = getSessionsByClass(classId);
  const completedSessions = initialSessions.filter((s) => !s.is_active);

  const [activeTab, setActiveTab] = useState<Tab>("sesi");
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [summaries, setSummaries] = useState(() => computeStudentSummaries(classId));
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([...MOCK_ATTENDANCES]);
  const [showModal, setShowModal] = useState(false);
  const [editSess, setEditSess] = useState<Session | null>(null);
  // Manual override state: key = `${userId}_${sessionId}` → overridden status
  const [manualOverrides, setManualOverrides] = useState<Record<OverrideKey, AttendanceStatus>>({});
  const overrideCount = Object.keys(manualOverrides).length;

  const setOverride = (userId: string, sessionId: string, status: AttendanceStatus) => {
    setManualOverrides((prev) => ({ ...prev, [`${userId}_${sessionId}` as OverrideKey]: status }));
  };
  const resetOverride = (userId: string, sessionId: string) => {
    setManualOverrides((prev) => {
      const next = { ...prev };
      delete next[`${userId}_${sessionId}` as OverrideKey];
      return next;
    });
  };
  const resetAllOverrides = () => setManualOverrides({});

  // Mock realtime — add check-ins to active sessions every 5 seconds
  useEffect(() => {
    const activeSess = sessions.find((s) => s.is_active);
    if (!activeSess) return;
    const enrolledIds = summaries.map((s) => s.user.id);
    let notYet = enrolledIds.filter(
      (uid) => !allAttendances.some((a) => a.session_id === activeSess.id && a.user_id === uid)
    );
    if (notYet.length === 0) return;
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= notYet.length) { clearInterval(iv); return; }
      const uid = notYet[idx++];
      const newAtt: Attendance = {
        id: `rt_${Date.now()}`, session_id: activeSess.id, user_id: uid,
        status: Math.random() > 0.15 ? "hadir" : "telat",
        distance_meters: Math.floor(Math.random() * 80) + 5,
        checked_in_at: new Date().toISOString(),
        student_lat: -6.2, student_lng: 106.8,
        created_at: new Date().toISOString(),
      };
      setAllAttendances((prev) => [...prev, newAtt]);
    }, 5000);
    return () => clearInterval(iv);
  }, [sessions]);

  if (!kelas) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0fdf4" }}>Kelas tidak ditemukan.</div>
  );

  // Live per-student stats: recompute pct using overrides + total_sessions_planned as denominator
  const liveStudentStats = summaries.map((s) => {
    const effectiveHadir = sessions.filter((sess) => {
      const override = manualOverrides[`${s.user.id}_${sess.id}` as OverrideKey] ?? null;
      const status = override ?? s.attendanceMap[sess.id]?.status ?? null;
      return status === "hadir" || status === "telat";
    }).length;
    const pct = kelas.total_sessions_planned > 0
      ? Math.round((effectiveHadir / kelas.total_sessions_planned) * 100)
      : 0;
    return { userId: s.user.id, pct, eligible: pct >= kelas.min_attendance_pct, effectiveHadir };
  });

  const avgPct = liveStudentStats.length > 0
    ? Math.round(liveStudentStats.reduce((a, s) => a + s.pct, 0) / liveStudentStats.length)
    : 0;
  const eligibleCount = liveStudentStats.filter((s) => s.eligible).length;
  const activeSession = sessions.find((s) => s.is_active);

  const handleSaveSession = (form: { title: string; date: string; location: string; radius_meters: number; duration_minutes: number }) => {
    if (editSess) {
      setSessions((prev) => prev.map((s) => s.id === editSess.id ? { ...s, ...form } : s));
    } else {
      const next: Session = {
        id: `new_${Date.now()}`, class_id: classId, is_active: false, expires_at: null,
        location_lat: null, location_lng: null, created_at: new Date().toISOString(),
        ...form,
      };
      setSessions((prev) => [...prev, next]);
    }
    setEditSess(null);
  };

  const TAB_STYLE = (active: boolean) => ({
    padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
    background: "transparent", border: "none", borderBottom: `2px solid ${active ? "#22c55e" : "transparent"}`,
    color: active ? "#4ade80" : "rgba(134,239,172,0.4)", transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box", maxWidth: "100%" }}>
      {/* Breadcrumb + Back */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => router.push("/dashboard/kelas")}
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(134,239,172,0.5)", fontSize: "13px", background: "none", border: "none", cursor: "pointer", marginBottom: "12px", padding: 0 }}>
          <ArrowLeft size={14} /> Kelas Praktikum
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h1 style={{ color: "#f0fdf4", fontSize: "22px", fontWeight: 700 }}>{kelas.name}</h1>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>{kelas.code}</span>
              {activeSession && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} /> LIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "rgba(134,239,172,0.45)" }}>
              {kelas.lecturer} · {kelas.semester} · {summaries.length} mahasiswa · Min. kehadiran: {kelas.min_attendance_pct}%
            </p>
          </div>
          <button onClick={() => { const csv = generateCSV(summaries, sessions); downloadFile(csv, `rekap_${kelas.code}_${new Date().toISOString().split("T")[0]}.csv`); }}
            className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "9px 16px", flexShrink: 0 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }} className="kd-stat-grid">
        {[
          { label: "Sesi Selesai", value: `${completedSessions.length}/${kelas.total_sessions_planned}`, icon: <CalendarDays size={14} style={{ color: "#4ade80" }} /> },
          { label: "Sesi Aktif", value: activeSession ? 1 : 0, icon: <Radio size={14} style={{ color: activeSession ? "#f87171" : "#4ade80" }} /> },
          { label: "Rata-rata Hadir", value: `${avgPct}%`, icon: <Percent size={14} style={{ color: avgPct >= kelas.min_attendance_pct ? "#4ade80" : "#f87171" }} /> },
          { label: "Lulus Min. Hadir", value: `${eligibleCount}/${summaries.length}`, icon: <Award size={14} style={{ color: "#4ade80" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <span style={{ fontSize: "10px", color: "rgba(134,239,172,0.5)", lineHeight: 1.3 }}>{s.label}</span>
            </div>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: "1px solid rgba(34,197,94,0.1)", marginBottom: "20px", display: "flex", gap: "4px" }}>
        {([
          { key: "sesi", label: "Sesi" },
          { key: "mahasiswa", label: "Mahasiswa" },
          { key: "rekap", label: "Rekap Kehadiran" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={TAB_STYLE(activeTab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: SESI ── */}
      {activeTab === "sesi" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
            <button className="btn-primary rounded-xl" style={{ gap: "8px", padding: "9px 16px" }}
              onClick={() => { setEditSess(null); setShowModal(true); }}>
              <Plus size={14} /> Buat Sesi
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[...sessions].reverse().map((sess) => {
              const sessAtts = allAttendances.filter((a) => a.session_id === sess.id);
              const hadirCount = sessAtts.filter((a) => a.status === "hadir" || a.status === "telat").length;
              return (
                <div key={sess.id} className="glass rounded-2xl"
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.25)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.08)"; }}>
                  {/* Live dot */}
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: sess.is_active ? "#f87171" : "#22c55e",
                    animation: sess.is_active ? "pulse-dot 1.5s ease-in-out infinite" : "none" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4" }}>{sess.title}</span>
                      {sess.is_active && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.12)", padding: "1px 7px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.2)" }}>LIVE</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.45)" }}>
                        {new Date(sess.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(134,239,172,0.45)" }}>
                        <MapPin size={11} /> {sess.location}
                      </span>
                      <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.45)" }}>
                        {sess.duration_minutes} menit
                      </span>
                      {!sess.is_active && (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#4ade80" }}>
                          {hadirCount}/{summaries.length} hadir
                        </span>
                      )}
                      {sess.is_active && (
                        <span style={{ fontSize: "12px", color: "#facc15" }}>
                          {sessAtts.length} check-in sejauh ini
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {!sess.is_active && (
                      <div style={{ height: 5, width: 60, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round(hadirCount / Math.max(1, summaries.length) * 100)}%`, background: "#22c55e", borderRadius: 3 }} />
                      </div>
                    )}
                    <button onClick={() => { setEditSess(sess); setShowModal(true); }}
                      style={{ padding: "6px 8px", borderRadius: 8, background: "transparent", border: "1px solid rgba(34,197,94,0.12)", color: "rgba(134,239,172,0.4)", cursor: "pointer" }}>
                      <Edit2 size={13} />
                    </button>
                    <Link href={`/dashboard/kelas/${classId}/sesi/${sess.id}`}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: 9, background: sess.is_active ? "linear-gradient(135deg,#dc2626,#f87171)" : "rgba(34,197,94,0.1)", border: `1px solid ${sess.is_active ? "rgba(220,38,38,0.4)" : "rgba(34,197,94,0.25)"}`, color: sess.is_active ? "#fff" : "#4ade80", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
                      {sess.is_active ? (<><Radio size={12} /> Masuk</>) : (<>Detail <ChevronRight size={12} /></>)}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: MAHASISWA ── */}
      {activeTab === "mahasiswa" && (
        <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                {["MAHASISWA", "HADIR", "% KEHADIRAN", "STATUS"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 18px", fontSize: "11px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.user.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                  onClick={() => router.push(`/dashboard/mahasiswa/${s.user.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{s.user.initial}</div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{s.user.name}</p>
                        <p style={{ fontSize: "11px", color: "rgba(134,239,172,0.4)" }}>{s.user.nim}</p>
                      </div>
                    </div>
                  </td>
                  {(() => { const ls = liveStudentStats.find((x) => x.userId === s.user.id)!; return (<>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>
                      {ls.effectiveHadir}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(134,239,172,0.35)" }}>/{kelas.total_sessions_planned}</span>
                  </td>
                  <td style={{ padding: "12px 18px", minWidth: "150px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${ls.pct}%`, borderRadius: 3, transition: "width 0.5s",
                          background: ls.pct >= kelas.min_attendance_pct ? "#4ade80" : ls.pct >= 60 ? "#facc15" : "#f87171" }} />
                        <div style={{ position: "absolute", top: 0, height: "100%", width: 1.5, left: `${kelas.min_attendance_pct}%`, background: "rgba(255,255,255,0.25)" }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, minWidth: "36px", fontVariantNumeric: "tabular-nums",
                        color: ls.pct >= kelas.min_attendance_pct ? "#4ade80" : ls.pct >= 60 ? "#facc15" : "#f87171" }}>
                        {ls.pct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px",
                      background: ls.eligible ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                      color: ls.eligible ? "#4ade80" : "#f87171",
                      border: ls.eligible ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)" }}>
                      {ls.eligible ? "Lulus" : "Perlu Perhatian"}
                    </span>
                  </td>
                  </>); })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: REKAP KEHADIRAN (cross-table) ── */}
      {activeTab === "rekap" && (
        <div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
            {[
              { icon: <CheckCircle size={12} style={{ color: "#4ade80" }} />, label: "Hadir" },
              { icon: <Clock size={12} style={{ color: "#facc15" }} />, label: "Telat" },
              { icon: <XCircle size={12} style={{ color: "#f87171" }} />, label: "Absen" },
              { icon: <AlertTriangle size={12} style={{ color: "#fb923c" }} />, label: "Ditolak" },
            ].map((l) => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(134,239,172,0.45)" }}>
                {l.icon} {l.label}
              </span>
            ))}
          </div>
          {/* Legend only, no banner */}
          <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "#22c55e", position: "sticky", left: 0, background: "rgba(4,14,8,0.97)", zIndex: 1, minWidth: "150px" }}>MAHASISWA</th>
                    {sessions.map((s) => (
                      <th key={s.id} style={{ textAlign: "center", padding: "10px 10px", fontSize: "10px", fontWeight: 700, color: s.is_active ? "#f87171" : "#22c55e", minWidth: "55px" }}>
                        <div>{s.title}</div>
                        <div style={{ fontSize: "9px", fontWeight: 400, color: "rgba(134,239,172,0.35)", marginTop: "1px" }}>
                          {new Date(s.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </div>
                        {s.is_active && <div style={{ fontSize: "9px", color: "#f87171", fontWeight: 700 }}>● LIVE</div>}
                      </th>
                    ))}
                    <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#22c55e", minWidth: "65px" }}>%</th>
                    <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#22c55e", minWidth: "75px" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.user.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                      onClick={() => router.push(`/dashboard/mahasiswa/${s.user.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.04)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <td style={{ padding: "10px 16px", position: "sticky", left: 0, background: "rgba(4,14,8,0.97)", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{s.user.initial}</div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4", whiteSpace: "nowrap" }}>{s.user.name}</p>
                            <p style={{ fontSize: "10px", color: "rgba(134,239,172,0.4)" }}>{s.user.nim}</p>
                          </div>
                        </div>
                      </td>
                      {sessions.map((sess) => {
                        const key = `${s.user.id}_${sess.id}` as OverrideKey;
                        const override = manualOverrides[key] ?? null;
                        return (
                          <td key={sess.id} style={{ padding: "6px 8px", textAlign: "center" }}
                            onClick={(e) => e.stopPropagation()}>
                            <AttendanceOverrideCell
                              att={s.attendanceMap[sess.id] ?? null}
                              sessionActive={sess.is_active}
                              overrideStatus={override}
                              onOverride={(status) => setOverride(s.user.id, sess.id, status)}
                              onReset={() => resetOverride(s.user.id, sess.id)}
                            />
                          </td>
                        );
                      })}
                      {(() => { const ls = liveStudentStats.find((x) => x.userId === s.user.id)!; return (<>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ marginBottom: "3px", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                          color: ls.pct >= kelas.min_attendance_pct ? "#4ade80" : ls.pct >= 60 ? "#facc15" : "#f87171" }}>
                          {ls.pct}%
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${ls.pct}%`, borderRadius: 2, transition: "width 0.5s",
                            background: ls.pct >= kelas.min_attendance_pct ? "#4ade80" : "#f87171" }} />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px",
                          background: ls.eligible ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                          color: ls.eligible ? "#4ade80" : "#f87171",
                          border: ls.eligible ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)" }}>
                          {ls.eligible ? "Lulus" : "Tidak"}
                        </span>
                      </td>
                      </>); })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showModal && (
        <SessionModal
          initial={editSess ?? undefined}
          onSave={handleSaveSession}
          onClose={() => { setShowModal(false); setEditSess(null); }}
        />
      )}

      <style>{`
        @media (max-width: 900px) { .kd-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}

// Helpers for export
function generateCSV(summaries: ReturnType<typeof computeStudentSummaries>, sessions: Session[]): string {
  const BOM = "\uFEFF";
  const sesHeaders = sessions.map((s) => `"${s.title} (${s.date})"`);
  const header = ["Nama", "NIM", ...sesHeaders, "Total Hadir", "% Kehadiran", "Status"];
  const rows = summaries.map((s) => [
    `"${s.user.name}"`, `"${s.user.nim}"`,
    ...sessions.map((sess) => {
      const att = s.attendanceMap[sess.id];
      return att ? `"${att.status}"` : `"absen"`;
    }),
    `"${s.total_hadir + s.total_telat}"`,
    `"${s.attendance_pct}%"`,
    `"${s.is_eligible ? "Lulus" : "Tidak Lulus"}"`,
  ]);
  return BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function downloadFile(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}
