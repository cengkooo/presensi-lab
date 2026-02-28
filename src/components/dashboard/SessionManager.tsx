"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Edit2, Radio, MapPin, ChevronRight, X, Save } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface DashSession {
  id: string;
  title: string;
  classCode: string;
  className: string;
  classId: string;
  date: string;
  location: string;
  isActive: boolean;
  hadirCount: number;
  enrolledCount: number;
}

export function SessionManager() {
  const [sessions, setSessions]   = useState<DashSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({ title: "", date: "", location: "" });
  const [saving, setSaving]       = useState(false);

  const fetchSessions = useCallback(() => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createSupabaseBrowserClient() as any;
    Promise.all([
      supabase
        .from("sessions")
        .select("id, title, session_date, location, is_active, class_id, classes ( id, code, name )")
        .order("session_date", { ascending: false })
        .limit(20),
      supabase
        .from("attendance")
        .select("session_id, status")
        .in("status", ["hadir", "telat"]),
      supabase
        .from("enrollments")
        .select("class_id"),
    ]).then(([{ data: sess }, { data: atts }, { data: enrls }]: [{ data: any[] | null }, { data: any[] | null }, { data: any[] | null }]) => {
      if (!sess) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: DashSession[] = sess.map((s: any) => {
        const hadirCount    = atts?.filter((a) => a.session_id === s.id).length ?? 0;
        const enrolledCount = enrls?.filter((e) => e.class_id === s.class_id).length ?? 0;
        return {
          id:            s.id,
          title:         s.title,
          classCode:     s.classes?.code ?? "",
          className:     s.classes?.name ?? "",
          classId:       s.classes?.id ?? s.class_id,
          date:          s.session_date,
          location:      s.location ?? "",
          isActive:      s.is_active,
          hadirCount,
          enrolledCount,
        };
      });
      setSessions(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleEdit = (s: DashSession) => {
    setForm({ title: s.title, date: s.date, location: s.location });
    setEditId(s.id);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date || !editId) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createSupabaseBrowserClient() as any;
    try {
      await supabase
        .from("sessions")
        .update({ title: form.title, session_date: form.date, location: form.location })
        .eq("id", editId);
    } catch {/* silent */}
    setSaving(false);
    setEditId(null);
    fetchSessions();
  };

  const activeCount = sessions.filter((s) => s.isActive).length;

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4" }}>Manajemen Sesi</h3>
          <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.45)", marginTop: "2px" }}>
            {loading ? "Memuat..." : activeCount > 0 ? `${activeCount} sesi aktif sekarang` : `${sessions.length} sesi terdaftar`}
          </p>
        </div>
        <Link href="/dashboard/kelas"
          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: 10, fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", border: "1px solid rgba(16,185,129,0.12)", background: "transparent", textDecoration: "none" }}>
          Semua <ChevronRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 24px" }}>
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <>
          {/* Edit Form */}
          {editId && (
            <div style={{ margin: "0 16px 12px", padding: "14px", borderRadius: 12, background: "rgba(7,22,18,0.5)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#34D399" }}>✏ Edit Sesi</p>
                <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", color: "rgba(110,231,183,0.4)", cursor: "pointer" }}><X size={13} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input className="input-glass" placeholder="Judul sesi" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={{ fontSize: "12px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input type="date" className="input-glass" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={{ fontSize: "12px" }} />
                  <input className="input-glass" placeholder="Lokasi" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} style={{ fontSize: "12px" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setEditId(null)} style={{ flex: 1, padding: "8px", borderRadius: 9, background: "transparent", border: "1px solid rgba(16,185,129,0.15)", color: "rgba(110,231,183,0.5)", cursor: "pointer", fontSize: "12px" }}>Batal</button>
                  <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: "8px", borderRadius: 9, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    {saving ? "..." : <><Save size={12} /> Simpan</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Session List */}
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {sessions.length === 0 && (
              <p style={{ fontSize: "13px", color: "rgba(110,231,183,0.4)", textAlign: "center", padding: "12px 0" }}>Belum ada sesi. Buat sesi baru di halaman Kelas.</p>
            )}
            {sessions.slice(0, 6).map((sess) => (
              <div key={sess.id}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: 12, transition: "all 0.2s",
                  background: sess.isActive ? "rgba(5,46,22,0.3)" : "rgba(7,22,18,0.25)",
                  border: `1px solid ${sess.isActive ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.07)"}`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.22)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = sess.isActive ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.07)"; }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: sess.isActive ? "#f87171" : "#10B981",
                  animation: sess.isActive ? "pulse-dot 1.5s ease-in-out infinite" : "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{sess.title}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: "rgba(16,185,129,0.1)", color: "#34D399", border: "1px solid rgba(16,185,129,0.15)" }}>{sess.classCode}</span>
                    {sess.isActive && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "1px 7px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Radio size={9} /> LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>
                      {sess.date ? new Date(sess.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                    {sess.location && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>
                        <MapPin size={10} /> {sess.location}
                      </span>
                    )}
                    {!sess.isActive && (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#34D399" }}>{sess.hadirCount}/{sess.enrolledCount} hadir</span>
                    )}
                    {sess.isActive && (
                      <span style={{ fontSize: "11px", color: "#facc15" }}>{sess.hadirCount} check-in</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                  <button onClick={() => handleEdit(sess)}
                    style={{ padding: "5px 7px", borderRadius: 7, background: "transparent", border: "1px solid rgba(16,185,129,0.12)", color: "rgba(110,231,183,0.35)", cursor: "pointer" }}>
                    <Edit2 size={12} />
                  </button>
                  <Link href={`/dashboard/kelas/${sess.classId}`}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: 8, fontSize: "11px", fontWeight: 600, textDecoration: "none",
                      background: sess.isActive ? "linear-gradient(135deg,#dc2626,#f87171)" : "rgba(16,185,129,0.1)",
                      border: `1px solid ${sess.isActive ? "rgba(220,38,38,0.4)" : "rgba(16,185,129,0.2)"}`,
                      color: sess.isActive ? "#fff" : "#34D399",
                    }}>
                    {sess.isActive ? (<><Radio size={10} />Masuk</>) : (<>Detail <ChevronRight size={10} /></>)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}
