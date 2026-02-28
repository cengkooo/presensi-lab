"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, GraduationCap, BookOpen, CheckCircle,
  AlertTriangle, Calendar, MapPin, RefreshCw,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Profile {
  id: string;
  full_name: string | null;
  nim: string | null;
  avatar_url: string | null;
  role: "mahasiswa" | "dosen" | "admin";
}

interface ClassStat {
  class_id: string;
  class_code: string;
  class_name: string;
  peran: string;
  hadir_count: number;
  total_planned: number;
  att_pct: number;
  is_eligible: boolean;
  min_pct: number;
}

interface AttendanceRow {
  id: string;
  status: "hadir" | "telat" | "absen" | "ditolak";
  checked_in_at: string | null;
  distance_meters: number | null;
  session_title: string;
  session_date: string;
  class_code: string;
  class_name: string;
}

function getInitial(name: string | null) {
  if (!name) return "?";
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function AttBar({ pct, minPct }: { pct: number; minPct: number }) {
  const eligible = pct >= minPct;
  const color = eligible ? "#34D399" : pct >= 60 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, color, minWidth: "40px", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

export default function MahasiswaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [recentAtt, setRecentAtt] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const [profRes, enrollRes, attRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, nim, avatar_url, role").eq("id", userId).single(),
      supabase
        .from("enrollments")
        .select("class_id, peran, classes(id, code, name, min_attendance_pct, total_sessions_planned)")
        .eq("user_id", userId),
      supabase
        .from("attendance")
        .select("id, status, checked_in_at, distance_meters, sessions!inner(id, title, session_date, class_id, classes!inner(id, code, name))")
        .eq("user_id", userId)
        .order("sessions.session_date", { ascending: false })
        .limit(20),
    ]);

    if (profRes.error) { setError("Pengguna tidak ditemukan."); setLoading(false); return; }
    setProfile(profRes.data as Profile);

    // Build per-class attendance counts
    const attRows = attRes.data ?? [];
    const hadirByClass = new Map<string, number>();
    for (const a of attRows) {
      const sess = a.sessions as unknown as { class_id: string };
      if ((a.status === "hadir" || a.status === "telat") && sess?.class_id) {
        hadirByClass.set(sess.class_id, (hadirByClass.get(sess.class_id) ?? 0) + 1);
      }
    }

    const stats: ClassStat[] = (enrollRes.data ?? []).map((row) => {
      const cls = row.classes as unknown as {
        id: string; code: string; name: string;
        min_attendance_pct: number; total_sessions_planned: number;
      } | null;
      const hadir = hadirByClass.get(row.class_id) ?? 0;
      const total = cls?.total_sessions_planned ?? 1;
      const pct = Math.round((hadir / total) * 100);
      const minPct = cls?.min_attendance_pct ?? 75;
      return {
        class_id: row.class_id,
        class_code: cls?.code ?? "—",
        class_name: cls?.name ?? "—",
        peran: row.peran,
        hadir_count: hadir,
        total_planned: total,
        att_pct: pct,
        is_eligible: pct >= minPct,
        min_pct: minPct,
      };
    });
    setClassStats(stats);

    const recent: AttendanceRow[] = attRows.slice(0, 15).map((a) => {
      const sess = a.sessions as unknown as {
        id: string; title: string; session_date: string; class_id: string;
        classes: { id: string; code: string; name: string };
      };
      return {
        id: a.id,
        status: a.status as AttendanceRow["status"],
        checked_in_at: a.checked_in_at,
        distance_meters: a.distance_meters,
        session_title: sess?.title ?? "—",
        session_date: sess?.session_date ?? "",
        class_code: sess?.classes?.code ?? "—",
        class_name: sess?.classes?.name ?? "—",
      };
    });
    setRecentAtt(recent);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px" }}>Memuat data mahasiswa...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px" }}>
        <Link href="/dashboard/mahasiswa" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(110,231,183,0.5)", textDecoration: "none", marginBottom: "24px" }}>
          <ChevronLeft size={14} /> Kembali ke Mahasiswa
        </Link>
        <p style={{ color: "#f87171" }}>{error ?? "Pengguna tidak ditemukan."}</p>
      </div>
    );
  }

  const avgPct = classStats.length > 0
    ? Math.round(classStats.reduce((a, s) => a + s.att_pct, 0) / classStats.length)
    : 0;
  const eligibleCount = classStats.filter((s) => s.is_eligible).length;

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <Link
          href="/dashboard/mahasiswa"
          style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(110,231,183,0.5)", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#34D399")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(110,231,183,0.5)")}
        >
          <ChevronLeft size={14} /> Mahasiswa & Dosen
        </Link>
        <span style={{ color: "rgba(110,231,183,0.2)" }}>/</span>
        <span style={{ fontSize: "13px", color: "#f0fdf4" }}>{profile.full_name ?? "Detail"}</span>
      </div>

      {/* Profile Header */}
      <div className="glass rounded-2xl" style={{ padding: "24px 28px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {getInitial(profile.full_name)}
            </div>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0fdf4", marginBottom: "4px" }}>
                {profile.full_name ?? "—"}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "rgba(110,231,183,0.5)" }}>NIM/NIP: {profile.nim ?? "—"}</span>
                <span style={{
                  fontSize: "12px", padding: "2px 9px", borderRadius: "20px", fontWeight: 700,
                  background: profile.role === "dosen" ? "rgba(234,179,8,0.12)" : "rgba(16,185,129,0.08)",
                  color: profile.role === "dosen" ? "#facc15" : "#34D399",
                  border: `1px solid ${profile.role === "dosen" ? "rgba(234,179,8,0.25)" : "rgba(16,185,129,0.2)"}`,
                }}>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(110,231,183,0.5)", cursor: "pointer", fontSize: "12px", transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.4)"; (e.currentTarget as HTMLElement).style.color = "#34D399"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(110,231,183,0.5)"; }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginTop: "20px" }}>
          {[
            { label: "Kelas Diikuti", value: classStats.length, icon: <BookOpen size={14} style={{ color: "#34D399" }} /> },
            { label: "Rata-rata Kehadiran", value: `${avgPct}%`, icon: <GraduationCap size={14} style={{ color: "#34D399" }} /> },
            { label: "Kelas Lulus", value: `${eligibleCount}/${classStats.length}`, icon: <CheckCircle size={14} style={{ color: eligibleCount === classStats.length && classStats.length > 0 ? "#34D399" : "#facc15" }} /> },
          ].map((s) => (
            <div key={s.label} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                {s.icon}
                <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Enrolled Classes */}
        <div className="glass rounded-2xl" style={{ padding: "20px 22px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#10B981", letterSpacing: "0.07em", marginBottom: "14px" }}>
            KELAS YANG DIIKUTI
          </h2>
          {classStats.length === 0 ? (
            <p style={{ fontSize: "13px", color: "rgba(110,231,183,0.3)", textAlign: "center", padding: "20px 0" }}>
              Belum terdaftar di kelas manapun.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {classStats.map((cs) => (
                <Link
                  key={cs.class_id}
                  href={`/dashboard/kelas/${cs.class_id}`}
                  style={{ textDecoration: "none", display: "block", padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.1)", transition: "border-color 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.3)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.1)")}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{cs.class_code}</p>
                      <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>{cs.class_name}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px",
                        background: "rgba(16,185,129,0.08)", color: "#34D399", border: "1px solid rgba(16,185,129,0.15)", fontWeight: 600 }}>
                        {cs.peran}
                      </span>
                      {!cs.is_eligible && (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#f87171" }}>
                          <AlertTriangle size={10} /> Di bawah min.
                        </span>
                      )}
                    </div>
                  </div>
                  <AttBar pct={cs.att_pct} minPct={cs.min_pct} />
                  <p style={{ fontSize: "10px", color: "rgba(110,231,183,0.3)", marginTop: "5px" }}>
                    {cs.hadir_count} hadir dari {cs.total_planned} sesi · min. {cs.min_pct}%
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="glass rounded-2xl" style={{ padding: "20px 22px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#10B981", letterSpacing: "0.07em", marginBottom: "14px" }}>
            RIWAYAT ABSENSI TERBARU
          </h2>
          {recentAtt.length === 0 ? (
            <p style={{ fontSize: "13px", color: "rgba(110,231,183,0.3)", textAlign: "center", padding: "20px 0" }}>
              Belum ada riwayat absensi.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentAtt.map((a) => (
                <div
                  key={a.id}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.08)" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#34D399" }}>{a.class_code}</span>
                      <span style={{ fontSize: "11px", color: "#f0fdf4" }}>{a.session_title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "rgba(110,231,183,0.4)" }}>
                        <Calendar size={10} />
                        {a.session_date ? new Date(a.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                      {a.checked_in_at && (
                        <span style={{ fontSize: "10px", color: "rgba(110,231,183,0.4)" }}>
                          {new Date(a.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      )}
                      {a.distance_meters !== null && (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "rgba(110,231,183,0.4)" }}>
                          <MapPin size={10} /> {a.distance_meters}m
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
