"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, CalendarDays, MapPin, Radio, Clock,
  Users, CheckCircle, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface SessionData {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  session_date: string;
  location: string | null;
  is_active: boolean;
  expires_at: string | null;
  radius_meter: number;
  classes: { id: string; code: string; name: string } | null;
}

interface AttendanceData {
  id: string;
  user_id: string;
  status: "hadir" | "telat" | "absen" | "ditolak";
  checked_in_at: string;
  distance_meter: number | null;
  profiles: { id: string; full_name: string | null; nim: string | null } | null;
}

function getInitial(name: string | null) {
  if (!name) return "?";
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function DistanceBadge({ meters }: { meters: number | null }) {
  if (meters === null) return null;
  const color = meters <= 50 ? "#1A6B4A" : meters <= 100 ? "#facc15" : "#C0392B";
  return (
    <span style={{ fontSize: "10px", fontWeight: 600, color, background: `${color}1a`, border: `1px solid ${color}40`, borderRadius: "20px", padding: "1px 7px" }}>
      {meters}m
    </span>
  );
}

export default function SesiDetailPage({ params }: { params: Promise<{ id: string; sesiId: string }> }) {
  const { id: classId, sesiId } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendances, setAttendances] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createSupabaseBrowserClient() as any;

    const [sessRes, attRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, class_id, title, description, session_date, location, is_active, expires_at, radius_meter, classes(id, code, name)")
        .eq("id", sesiId)
        .single(),
      supabase
        .from("attendance")
        .select("id, user_id, status, checked_in_at, distance_meter, profiles(id, full_name, nim)")
        .eq("session_id", sesiId)
        .order("checked_in_at", { ascending: true }),
    ]);

    if (sessRes.error || !sessRes.data) {
      setError("Sesi tidak ditemukan.");
      setLoading(false);
      return;
    }

    setSession(sessRes.data as unknown as SessionData);
    setAttendances((attRes.data as unknown as AttendanceData[]) ?? []);
    setLoading(false);
  }, [sesiId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Memuat data sesi...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px" }}>
        <Link href={`/dashboard/kelas/${classId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px" }}>
          <ChevronLeft size={14} /> Kembali ke Kelas
        </Link>
        <p style={{ color: "#C0392B" }}>{error ?? "Sesi tidak ditemukan."}</p>
      </div>
    );
  }

  const cls = session.classes;
  const total = attendances.length;
  const hadir = attendances.filter((a) => a.status === "hadir" || a.status === "telat").length;
  const absen = attendances.filter((a) => a.status === "absen").length;
  const ditolak = attendances.filter((a) => a.status === "ditolak").length;

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Link href="/dashboard/kelas" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1A6B4A")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
          Kelas
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <Link href={`/dashboard/kelas/${classId}`} style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1A6B4A")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
          {cls?.code ?? classId}
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{session.title}</span>
      </div>

      {/* Session Header */}
      <div className="glass rounded-2xl" style={{ padding: "22px 26px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>{session.title}</h1>
              {session.is_active ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#C0392B", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B", animation: "pulse-dot 1.5s ease-in-out infinite", display: "inline-block" }} />
                  LIVE
                </span>
              ) : (
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 9px", borderRadius: "20px", background: "rgba(230,245,239,0.8)", color: "#1A6B4A", border: "1px solid rgba(168,216,196,0.5)" }}>
                  Selesai
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                <CalendarDays size={12} />
                {new Date(session.session_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              {session.location && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <MapPin size={12} /> {session.location}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                <Radio size={12} /> Radius {session.radius_meter}m
              </span>
              {session.is_active && session.expires_at && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#C0392B" }}>
                  <Clock size={12} />
                  Berakhir {new Date(session.expires_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </span>
              )}
            </div>
          </div>
          <button onClick={fetchData} style={{ padding: "8px 12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(168,216,196,0.5)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", flexShrink: 0 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { label: "Total", value: total, icon: <Users size={13} style={{ color: "#1A6B4A" }} />, color: "var(--text-primary)" },
            { label: "Hadir", value: hadir, icon: <CheckCircle size={13} style={{ color: "#1A6B4A" }} />, color: "#1A6B4A" },
            { label: "Absen", value: absen, icon: <XCircle size={13} style={{ color: "var(--text-muted)" }} />, color: "var(--text-muted)" },
            { label: "Ditolak", value: ditolak, icon: <AlertTriangle size={13} style={{ color: "#C0392B" }} />, color: "#C0392B" },
          ].map((s) => (
            <div key={s.label} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(180,200,220,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                {s.icon}
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance List */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(180,200,220,0.3)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#2D9B6F", letterSpacing: "0.07em" }}>
            DAFTAR ABSENSI ({total})
          </h2>
        </div>

        {total === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <Users size={32} style={{ color: "rgba(74,222,128,0.2)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Belum ada data absensi untuk sesi ini.</p>
          </div>
        ) : (
          <div>
            {attendances.map((att) => {
              const prof = att.profiles;
              return (
                <div
                  key={att.id}
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(168,216,196,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#1A6B4A", flexShrink: 0 }}>
                    {getInitial(prof?.full_name ?? null)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{prof?.full_name ?? "—"}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>NIM {prof?.nim ?? "—"}</p>
                  </div>
                  <DistanceBadge meters={att.distance_meter} />
                  <div style={{ textAlign: "right" }}>
                    {att.checked_in_at && (
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "3px" }}>
                        {new Date(att.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </p>
                    )}
                    <StatusBadge status={att.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
