"use client";

import { useState, useMemo } from "react";
import {
  Plus, Search, Edit2, Trash2, Radio, ChevronDown,
  Calendar, MapPin, Clock, Users, MoreVertical, X, Save, Pencil,
} from "lucide-react";

/* ── TYPES ── */
interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isActive: boolean;
  attendeeCount: number;
  radius: number;
  duration: number;
}

/* ── MOCK DATA ── */
const INITIAL: Session[] = [
  { id: "s1", title: "Praktikum Jaringan - A1", description: "Konfigurasi routing dan switching jaringan komputer", date: "2026-02-28", location: "Lab Komputer A, Gedung 4", isActive: true, attendeeCount: 28, radius: 100, duration: 90 },
  { id: "s2", title: "Basis Data - B2", description: "Normalisasi dan query SQL lanjut", date: "2026-02-27", location: "Lab Komputer 01", isActive: false, attendeeCount: 32, radius: 80, duration: 120 },
  { id: "s3", title: "Sistem Operasi - C1", description: "Proses dan manajemen memori serta scheduling", date: "2026-02-25", location: "Lab Komputer 05", isActive: false, attendeeCount: 25, radius: 100, duration: 90 },
  { id: "s4", title: "Kecerdasan Buatan - A2", description: "Machine learning dan neural network dasar", date: "2026-02-24", location: "Lab Riset", isActive: false, attendeeCount: 20, radius: 120, duration: 90 },
  { id: "s5", title: "Algoritma Lanjut - A1", description: "Dynamic programming dan graph algorithms", date: "2026-02-21", location: "Lab Komputer 03", isActive: false, attendeeCount: 30, radius: 100, duration: 120 },
  { id: "s6", title: "Web Development - D1", description: "Full-stack web development dengan React dan Node", date: "2026-02-20", location: "Lab Komputer 02", isActive: false, attendeeCount: 35, radius: 100, duration: 90 },
];

const EMPTY_FORM = { title: "", description: "", date: "", location: "", radius: 100, duration: 90 };

/* ── STATUS PILL ── */
function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={
        active
          ? { background: "rgba(16,185,129,0.15)", color: "#34D399", border: "1px solid rgba(16,185,129,0.3)" }
          : { background: "rgba(255,255,255,0.04)", color: "rgba(110,231,183,0.4)", border: "1px solid rgba(255,255,255,0.06)" }
      }
    >
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400"
          style={{ animation: "pulse-dot 1.5s ease-in-out infinite" }} />
      )}
      {active ? "Aktif" : "Selesai"}
    </span>
  );
}

/* ── MODAL FORM ── */
function SessionModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Session>;
  onSave: (data: typeof EMPTY_FORM) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof typeof EMPTY_FORM, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-scale-in w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "rgba(8,24,20,0.97)",
          border: "1px solid rgba(16,185,129,0.25)",
          boxShadow: "0 0 60px rgba(16,185,129,0.1), 0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "17px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {initial ? <Pencil size={14} /> : <Plus size={14} />}
            {initial ? "Edit Sesi" : "Buat Sesi Baru"}
          </span>
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "rgba(110,231,183,0.4)" }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(110,231,183,0.5)" }}>Judul Sesi *</label>
            <input className="input-glass" placeholder="cth: Praktikum Jaringan - A1" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(110,231,183,0.5)" }}>Deskripsi</label>
            <input className="input-glass" placeholder="Deskripsi singkat materi praktikum" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(110,231,183,0.5)" }}>Tanggal *</label>
              <input type="date" className="input-glass" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(110,231,183,0.5)" }}>Durasi (menit)</label>
              <input type="number" className="input-glass" min={15} max={240} value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(110,231,183,0.5)" }}>Lokasi *</label>
            <input className="input-glass" placeholder="cth: Lab Komputer A, Gedung 4" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(110,231,183,0.5)" }}>Radius GPS (meter)</label>
            <input type="number" className="input-glass" min={10} max={500} value={form.radius} onChange={(e) => set("radius", Number(e.target.value))} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
          <button onClick={onClose}
            className="btn-ghost flex-1 rounded-xl"
            style={{ padding: "10px" }}>
            Batal
          </button>
          <button
            onClick={() => { if (form.title && form.date && form.location) { onSave(form); onClose(); } }}
            className="btn-primary flex-1 rounded-xl"
            style={{ gap: "8px" }}>
            <Save size={14} /> Simpan Sesi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function SesiPage() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "done">("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Session | null>(null);

  const filtered = useMemo(() =>
    sessions.filter((s) => {
      const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || (filterStatus === "active" && s.isActive) || (filterStatus === "done" && !s.isActive);
      return matchSearch && matchStatus;
    }), [sessions, search, filterStatus]);

  const handleSave = (form: typeof EMPTY_FORM) => {
    if (editItem) {
      setSessions((p) => p.map((s) => s.id === editItem.id ? { ...s, ...form } : s));
    } else {
      setSessions((p) => [{ id: `s${Date.now()}`, ...form, isActive: false, attendeeCount: 0 }, ...p]);
    }
    setEditItem(null);
  };

  const handleDelete = (id: string) => setSessions((p) => p.filter((s) => s.id !== id));

  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.isActive).length,
    totalAttendees: sessions.reduce((a, s) => a + s.attendeeCount, 0),
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Sesi Praktikum</h1>
          <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>Kelola semua sesi praktikum laboratorium</p>
        </div>
        <button className="btn-primary rounded-xl"
          style={{ gap: "8px", padding: "10px 18px", flexShrink: 0 }}
          onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={15} /> Buat Sesi
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Sesi", value: stats.total, icon: <Calendar size={16} style={{ color: "#34D399" }} /> },
          { label: "Sesi Aktif", value: stats.active, icon: <Radio size={16} style={{ color: "#f87171" }} /> },
          { label: "Total Hadir", value: stats.totalAttendees, icon: <Users size={16} style={{ color: "#34D399" }} /> },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
              <span style={{ fontSize: "12px", color: "rgba(110,231,183,0.5)" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(110,231,183,0.3)", pointerEvents: "none" }} />
          <input className="input-glass" style={{ paddingLeft: 36 }} placeholder="Cari sesi atau lokasi..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["all", "active", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{
                padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                border: filterStatus === f ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(16,185,129,0.12)",
                background: filterStatus === f ? "rgba(16,185,129,0.12)" : "transparent",
                color: filterStatus === f ? "#34D399" : "rgba(110,231,183,0.4)",
                transition: "all 0.2s",
              }}>
              {f === "all" ? "Semua" : f === "active" ? "Aktif" : "Selesai"}
            </button>
          ))}
        </div>
      </div>

      {/* Session Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filtered.map((sess) => (
          <div key={sess.id} className="glass glass-hover rounded-2xl"
            style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Card Header */}
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(16,185,129,0.08)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                <StatusPill active={sess.isActive} />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => { setEditItem(sess); setShowModal(true); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: "rgba(110,231,183,0.4)" }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(sess.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10"
                    style={{ color: "rgba(110,231,183,0.4)", transition: "all 0.2s" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <h3 style={{ color: "#f0fdf4", fontWeight: 700, fontSize: "15px", lineHeight: 1.3, marginBottom: "4px" }}>{sess.title}</h3>
              {sess.description && (
                <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.4)", lineHeight: 1.5 }}>{sess.description}</p>
              )}
            </div>
            {/* Card Body */}
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "rgba(110,231,183,0.65)" }}>{sess.date}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "rgba(110,231,183,0.65)" }}>{sess.location}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "rgba(110,231,183,0.65)" }}>{sess.duration} menit</span>
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(110,231,183,0.35)" }}>R: {sess.radius}m</span>
              </div>
            </div>
            {/* Card Footer */}
            <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(16,185,129,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={13} style={{ color: "#34D399" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#34D399" }}>{sess.attendeeCount}</span>
                <span style={{ fontSize: "12px", color: "rgba(110,231,183,0.4)" }}>mahasiswa hadir</span>
              </div>
              {sess.isActive && (
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#34D399", background: "rgba(16,185,129,0.1)", padding: "3px 8px", borderRadius: 6 }}>
                  LIVE
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "48px", textAlign: "center", color: "rgba(110,231,183,0.3)" }}>
            <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: "15px", fontWeight: 600 }}>Tidak ada sesi ditemukan</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>Coba ubah filter atau buat sesi baru</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <SessionModal
          initial={editItem ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
