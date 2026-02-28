"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, FlaskConical, Users, Plus, X,
  CheckCircle, Radio, Clock, CalendarDays, MapPin, RefreshCw,
} from "lucide-react";

const PAGE = "kelas-detail";

interface SessionItem {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  location: string | null;
  is_active: boolean;
  expires_at: string | null;
  radius_meter: number;
  created_at: string;
}

interface ClassDetail {
  id: string;
  code: string;
  name: string;
  semester: string | null;
  description: string | null;
  location: string | null;
  min_attendance_pct: number;
  total_sessions_planned: number;
  created_at: string;
  sessions: SessionItem[];
  enrollment_count: number;
  my_peran: string | null;
}

type SessionStatusType = "active" | "done" | "upcoming";

function getSessionStatus(sess: SessionItem): SessionStatusType {
  if (sess.is_active) return "active";
  // If session_date is in the future (compared to today), it's upcoming
  if (new Date(sess.session_date + "T23:59:59") > new Date()) return "upcoming";
  return "done";
}

function SessionStatusBadge({ sess }: { sess: SessionItem }) {
  const status = getSessionStatus(sess);
  const map: Record<SessionStatusType, { label: string; color: string; bg: string; border: string }> = {
    active: { label: "LIVE", color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
    done: { label: "Selesai", color: "#34D399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
    upcoming: { label: "Mendatang", color: "#facc15", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {status === "active" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />}
      {s.label}
    </span>
  );
}

function CreateSessionModal({
  classId,
  onClose,
  onSuccess,
}: {
  classId: string;
  onClose: () => void;
  onSuccess: (sess: SessionItem) => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", session_date: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.session_date) {
      setError("Judul dan tanggal sesi wajib diisi.");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: classId, ...form, title: form.title.trim(), location: form.location.trim() || undefined, description: form.description.trim() || undefined }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.message ?? "Gagal membuat sesi."); setSubmitting(false); return; }
    onSuccess(json.data as SessionItem);
    onClose();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, borderRadius: "20px", padding: "24px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(16,185,129,0.25)", boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0fdf4" }}>Tambah Sesi Baru</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Judul Sesi *</label>
            <input className="input-glass" placeholder="cth: Sesi 1 — Pengantar Jaringan" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Tanggal Sesi *</label>
            <input className="input-glass" type="date" value={form.session_date} onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Lokasi</label>
            <input className="input-glass" placeholder="cth: Lab Komputer A" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Deskripsi</label>
            <input className="input-glass" placeholder="Opsional" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {error && <p style={{ fontSize: "12px", color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "8px 12px" }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} className="btn-ghost flex-1 rounded-xl" style={{ padding: "10px" }}>Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 rounded-xl" style={{ gap: "8px", padding: "10px", opacity: submitting ? 0.6 : 1 }}>
            <Plus size={13} /> {submitting ? "Menyimpan..." : "Buat Sesi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KelasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const [kelas, setKelas] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSession, setShowCreateSession] = useState(false);

  const fetchKelas = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/classes/${classId}`);
    const json = await res.json();
    if (!res.ok) { setError(json.message ?? "Gagal memuat kelas."); setLoading(false); return; }
    setKelas(json.data as ClassDetail);
    setLoading(false);
  }, [classId]);

  useEffect(() => { fetchKelas(); }, [fetchKelas]);

  const handleSessionCreated = (sess: SessionItem) => {
    if (!kelas) return;
    setKelas({ ...kelas, sessions: [sess, ...kelas.sessions] });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px" }}>Memuat kelas...</p>
      </div>
    );
  }

  if (error || !kelas) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px" }}>
        <Link href="/dashboard/kelas" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(110,231,183,0.5)", textDecoration: "none", marginBottom: "24px" }}>
          <ChevronLeft size={14} /> Kembali ke Kelas
        </Link>
        <p style={{ color: "#f87171" }}>{error ?? "Kelas tidak ditemukan."}</p>
      </div>
    );
  }

  const isDosen = kelas.my_peran === "dosen" || kelas.my_peran === "asisten";
  const completedSessions = kelas.sessions.filter((s) => !s.is_active && new Date(s.session_date + "T23:59:59") <= new Date());
  const activeSessions = kelas.sessions.filter((s) => s.is_active);
  const minPct = kelas.min_attendance_pct;

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/kelas" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(110,231,183,0.5)", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#34D399")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(110,231,183,0.5)")}>
          <ChevronLeft size={14} /> Kelas Praktikum
        </Link>
        <span style={{ color: "rgba(110,231,183,0.2)" }}>/</span>
        <span style={{ fontSize: "13px", color: "#f0fdf4" }}>{kelas.code}</span>
      </div>

      {/* Class Header */}
      <div className="glass rounded-2xl" style={{ padding: "24px 28px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FlaskConical size={24} style={{ color: "#34D399" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0fdf4" }}>{kelas.name}</h1>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}>
                  {kelas.code}
                </span>
                {activeSessions.length > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", animation: "pulse-dot 1.5s ease-in-out infinite", display: "inline-block" }} />
                    LIVE
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {kelas.semester && <span style={{ fontSize: "13px", color: "rgba(110,231,183,0.45)" }}>{kelas.semester}</span>}
                {kelas.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "rgba(110,231,183,0.45)" }}>
                    <MapPin size={12} /> {kelas.location}
                  </span>
                )}
                {kelas.my_peran && (
                  <span style={{ fontSize: "11px", padding: "1px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.08)", color: "#34D399", border: "1px solid rgba(16,185,129,0.15)", fontWeight: 600 }}>
                    {kelas.my_peran}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={fetchKelas} style={{ padding: "8px 12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(110,231,183,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <RefreshCw size={13} />
            </button>
            {isDosen && (
              <button onClick={() => setShowCreateSession(true)} className="btn-primary rounded-xl" style={{ gap: "8px", padding: "10px 16px", fontSize: "13px" }}>
                <Plus size={14} /> Tambah Sesi
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "20px" }}>
          {[
            {
              label: "Mahasiswa", value: kelas.enrollment_count,
              href: isDosen ? `/dashboard/kelas/${classId}/enrollments` : undefined,
              icon: <Users size={13} style={{ color: "#34D399" }} />,
            },
            { label: "Total Sesi", value: `${completedSessions.length}/${kelas.total_sessions_planned}`, icon: <CalendarDays size={13} style={{ color: "#34D399" }} /> },
            { label: "Min Kehadiran", value: `${minPct}%`, icon: <CheckCircle size={13} style={{ color: "#34D399" }} /> },
            { label: "Sesi Aktif", value: activeSessions.length, icon: <Radio size={13} style={{ color: activeSessions.length > 0 ? "#f87171" : "#34D399" }} /> },
          ].map((s) => (
            <div key={s.label} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                {s.icon}
                <span style={{ fontSize: "10px", color: "rgba(110,231,183,0.4)" }}>{s.label}</span>
              </div>
              {s.href ? (
                <Link href={s.href} style={{ fontSize: "20px", fontWeight: 700, color: "#34D399", fontVariantNumeric: "tabular-nums", textDecoration: "none" }}>
                  {s.value} →
                </Link>
              ) : (
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#10B981", letterSpacing: "0.07em" }}>
            DAFTAR SESI ({kelas.sessions.length})
          </h2>
        </div>

        {kelas.sessions.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <CalendarDays size={36} style={{ color: "rgba(74,222,128,0.2)", margin: "0 auto 12px" }} />
            <p style={{ color: "rgba(110,231,183,0.4)", fontSize: "14px" }}>
              Belum ada sesi.{isDosen && <> Klik <strong style={{ color: "#34D399" }}>Tambah Sesi</strong> untuk mulai.</>}
            </p>
          </div>
        ) : (
          <div>
            {kelas.sessions.map((sess) => (
              <Link
                key={sess.id}
                href={`/dashboard/kelas/${classId}/sesi/${sess.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s, box-shadow 0.15s", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 3px 0 0 #10B981"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{sess.title}</p>
                      <SessionStatusBadge sess={sess} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>
                        <CalendarDays size={11} />
                        {new Date(sess.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      {sess.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>
                          <MapPin size={11} /> {sess.location}
                        </span>
                      )}
                      {sess.is_active && sess.expires_at && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#f87171" }}>
                          <Clock size={11} /> Berakhir {new Date(sess.expires_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", color: "rgba(110,231,183,0.3)" }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateSession && (
        <CreateSessionModal
          classId={classId}
          onClose={() => setShowCreateSession(false)}
          onSuccess={handleSessionCreated}
        />
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
