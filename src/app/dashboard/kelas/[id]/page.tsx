"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import {
  ChevronLeft, FlaskConical, Users, Plus, X,
  CheckCircle, Radio, Clock, CalendarDays, MapPin, RefreshCw,
  Edit2, Trash2, ZapOff, UserPlus, Search,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

interface EnrollmentItem {
  id: string;
  peran: string;
  joined_at: string;
  profiles: { id: string; full_name: string | null; nim: string | null; avatar_url: string | null; role: string } | null;
}

// userId -> sessionId -> status
type AttendanceMatrix = Record<string, Record<string, string>>;

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
    active: { label: "LIVE", color: "#C0392B", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
    done: { label: "Selesai", color: "#1A6B4A", bg: "rgba(230,245,239,0.75)", border: "rgba(168,216,196,0.6)" },
    upcoming: { label: "Mendatang", color: "#facc15", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {status === "active" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#C0392B", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />}
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
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, borderRadius: "20px", padding: "24px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(168,216,196,0.6)", boxShadow: "0 0 60px rgba(230,245,239,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Tambah Sesi Baru</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Judul Sesi *</label>
            <input className="input-glass" placeholder="cth: Sesi 1 — Pengantar Jaringan" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Tanggal Sesi *</label>
            <input className="input-glass" type="date" value={form.session_date} onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Lokasi</label>
            <input className="input-glass" placeholder="cth: Lab Komputer A" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Deskripsi</label>
            <input className="input-glass" placeholder="Opsional" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {error && <p style={{ fontSize: "12px", color: "#C0392B", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "8px 12px" }}>{error}</p>}
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

function EditSessionModal({
  sess, onClose, onSuccess,
}: {
  sess: SessionItem;
  onClose: () => void;
  onSuccess: (updated: SessionItem) => void;
}) {
  const [form, setForm] = useState({
    title: sess.title,
    description: sess.description ?? "",
    session_date: sess.session_date,
    location: sess.location ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.session_date) { setError("Judul dan tanggal sesi wajib diisi."); return; }
    setSubmitting(true); setError("");
    const res = await fetch(`/api/sessions/${sess.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() || null, session_date: form.session_date, location: form.location.trim() || null }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.message ?? "Gagal memperbarui sesi."); setSubmitting(false); return; }
    onSuccess(json.data as SessionItem);
    onClose();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, borderRadius: "20px", padding: "24px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(168,216,196,0.6)", boxShadow: "0 0 60px rgba(230,245,239,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Edit Sesi</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={13} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Judul Sesi *</label>
            <input className="input-glass" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Tanggal Sesi *</label>
            <input className="input-glass" type="date" value={form.session_date} onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Lokasi</label>
            <input className="input-glass" placeholder="cth: Lab Komputer A" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "5px" }}>Deskripsi</label>
            <input className="input-glass" placeholder="Opsional" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {error && <p style={{ fontSize: "12px", color: "#C0392B", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "8px 12px" }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} className="btn-ghost flex-1 rounded-xl" style={{ padding: "10px" }}>Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 rounded-xl" style={{ gap: "8px", padding: "10px", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteSessionModal({
  sess, onClose, onSuccess,
}: {
  sess: SessionItem;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true); setError("");
    const res = await fetch(`/api/sessions/${sess.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { setError(json.message ?? "Gagal menghapus sesi."); setDeleting(false); return; }
    onSuccess(sess.id);
    onClose();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 400, borderRadius: "20px", padding: "24px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 60px rgba(239,68,68,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={18} style={{ color: "#C0392B" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Hapus Sesi?</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
          Sesi <strong style={{ color: "var(--text-primary)" }}>{sess.title}</strong> beserta semua data absensinya akan dihapus permanen.
        </p>
        {error && <p style={{ fontSize: "12px", color: "#C0392B", marginBottom: "12px" }}>{error}</p>}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} className="btn-ghost flex-1 rounded-xl" style={{ padding: "10px" }}>Batal</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: deleting ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#C0392B", fontWeight: 700, fontSize: "13px", cursor: deleting ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
            {deleting ? "Menghapus..." : "Ya, Hapus Sesi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeactivateConfirmModal({
  sess, onClose, onSuccess,
}: {
  sess: SessionItem;
  onClose: () => void;
  onSuccess: (updated: SessionItem) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivate = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/sessions/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sess.id }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.message ?? "Gagal menonaktifkan sesi."); setLoading(false); return; }
    onSuccess(json.data as SessionItem);
    onClose();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 400, borderRadius: "20px", padding: "24px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(234,179,8,0.25)", boxShadow: "0 0 60px rgba(234,179,8,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ZapOff size={18} style={{ color: "#facc15" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Nonaktifkan Sesi?</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Absensi akan langsung ditutup.</p>
          </div>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
          Sesi <strong style={{ color: "var(--text-primary)" }}>{sess.title}</strong> sedang LIVE. Menonaktifkan sekarang akan menutup absensi meski waktu belum habis.
        </p>
        {error && <p style={{ fontSize: "12px", color: "#C0392B", marginBottom: "12px" }}>{error}</p>}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} className="btn-ghost flex-1 rounded-xl" style={{ padding: "10px" }}>Batal</button>
          <button onClick={handleDeactivate} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: loading ? "rgba(234,179,8,0.2)" : "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.35)", color: "#facc15", fontWeight: 700, fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
            {loading ? "Menonaktifkan..." : "Ya, Nonaktifkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADD MEMBER MODAL ────────────────────────────────────────────────────────
interface AdminUserRow {
  id: string;
  full_name: string | null;
  nim: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

function AddMemberModal({
  classId,
  enrolledUserIds,
  onClose,
  onSuccess,
}: {
  classId: string;
  enrolledUserIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeran, setSelectedPeran] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => { setUsers((j.data ?? []) as AdminUserRow[]); setLoadingUsers(false); })
      .catch(() => setLoadingUsers(false));
  }, []);

  const available = users.filter((u) => !enrolledUserIds.has(u.id));
  const filtered = available.filter(
    (u) =>
      !search ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.nim ?? "").includes(search)
  );

  const getPeran = (uid: string) => selectedPeran[uid] ?? "mahasiswa";
  const setPeran = (uid: string, p: string) =>
    setSelectedPeran((prev) => ({ ...prev, [uid]: p }));

  const handleAdd = async (user: AdminUserRow) => {
    setAdding(user.id);
    setAddError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createSupabaseBrowserClient() as any;
    const { error: insertErr } = await sb
      .from("enrollments")
      .insert({ class_id: classId, user_id: user.id, peran: getPeran(user.id) });
    if (insertErr) {
      setAddError(insertErr.message ?? "Gagal menambahkan anggota.");
      setAdding(null);
      return;
    }
    setAdding(null);
    onSuccess();
    onClose();
  };

  const peranColors: Record<string, { color: string; bg: string }> = {
    mahasiswa: { color: "#1A6B4A", bg: "rgba(230,245,239,0.65)" },
    asisten:   { color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
    dosen:     { color: "#facc15", bg: "rgba(234,179,8,0.1)" },
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, borderRadius: "20px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(168,216,196,0.6)", boxShadow: "0 0 60px rgba(230,245,239,0.75)", display: "flex", flexDirection: "column", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(180,200,220,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "10px", background: "rgba(230,245,239,0.8)", border: "1px solid rgba(168,216,196,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserPlus size={17} style={{ color: "#1A6B4A" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Tambah Anggota</h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>Pilih pengguna dari database untuk ditambahkan ke kelas ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: "8px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(230,245,239,0.65)", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIM..."
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 30px", borderRadius: "10px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(230,245,239,0.8)", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
            />
          </div>
          {available.length > 0 && (
            <p style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
              {filtered.length} dari {available.length} pengguna belum terdaftar
            </p>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingUsers ? (
            <div style={{ padding: "8px 0" }}>
              {[1, 2, 3].map((r) => (
                <div key={r} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(230,245,239,0.7)", flexShrink: 0, animation: "shimmer 1.5s ease-in-out infinite" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ height: 12, borderRadius: 6, background: "rgba(230,245,239,0.7)", width: "60%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                    <div style={{ height: 10, borderRadius: 6, background: "rgba(16,185,129,0.06)", width: "35%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ padding: "32px 24px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
              {available.length === 0
                ? "Semua pengguna sudah terdaftar di kelas ini."
                : "Tidak ada pengguna yang cocok dengan pencarian."}
            </p>
          ) : (
            filtered.map((user) => {
              const initials = (user.full_name ?? "?")
                .split(" ")
                .map((w) => w[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isAdding = adding === user.id;
              const peran = getPeran(user.id);
              const pc = peranColors[peran] ?? peranColors.mahasiswa;
              return (
                <div
                  key={user.id}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.12s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.04)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {/* Avatar */}
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,rgba(168,216,196,0.5),rgba(230,245,239,0.65))", border: "1px solid rgba(168,216,196,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#1A6B4A", flexShrink: 0 }}>
                    {initials}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.full_name ?? "—"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user.nim ?? "—"}</p>
                  </div>
                  {/* Peran selector */}
                  <select
                    value={peran}
                    onChange={(e) => setPeran(user.id, e.target.value)}
                    style={{
                      appearance: "none" as React.CSSProperties["appearance"],
                      WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
                      background: pc.bg,
                      border: `1px solid ${pc.color}40`,
                      borderRadius: "8px",
                      padding: "4px 26px 4px 10px",
                      color: pc.color,
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      outline: "none",
                      flexShrink: 0,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='${encodeURIComponent(pc.color)}' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 7px center",
                    }}
                  >
                    <option value="mahasiswa">mahasiswa</option>
                    <option value="asisten">asisten</option>
                    <option value="dosen">dosen</option>
                  </select>
                  {/* Add button */}
                  <button
                    onClick={() => handleAdd(user)}
                    disabled={isAdding}
                    className="btn-primary rounded-lg"
                    style={{ gap: "5px", padding: "5px 11px", fontSize: "12px", flexShrink: 0, opacity: isAdding ? 0.6 : 1, minWidth: 72, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {isAdding ? (
                      <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.6s linear infinite" }} />
                    ) : (
                      <><Plus size={11} /> Tambah</>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {addError && (
          <div style={{ padding: "10px 24px", borderTop: "1px solid rgba(239,68,68,0.15)", flexShrink: 0 }}>
            <p style={{ fontSize: "12px", color: "#C0392B" }}>{addError}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(230,245,239,0.65)", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-ghost rounded-xl" style={{ padding: "8px 20px", fontSize: "13px" }}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {[1, 2, 3, 4].map((r) => (
        <div key={r} style={{ display: "flex", gap: "16px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} style={{ height: 14, borderRadius: 6, background: "rgba(230,245,239,0.7)", flex: i === 0 ? 2 : 1, animation: "shimmer 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function KelasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const [kelas, setKelas] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Tab state
  type TabId = "sesi" | "mahasiswa" | "rekap";
  const [activeTab, setActiveTab] = useState<TabId>("sesi");
  const [fetchedTabs, setFetchedTabs] = useState<Set<TabId>>(new Set(["sesi"]));

  // Per-tab data
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [attendanceMatrix, setAttendanceMatrix] = useState<AttendanceMatrix>({});
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Tab content animation
  const [tabVisible, setTabVisible] = useState(true);

  // Session action modals
  const [editingSess, setEditingSess] = useState<SessionItem | null>(null);
  const [deletingSess, setDeletingSess] = useState<SessionItem | null>(null);
  const [deactivatingSess, setDeactivatingSess] = useState<SessionItem | null>(null);

  // Kelas Asal — localStorage only, key: kelasAsal_[userId]_[classId]
  const [kelasAsalMap, setKelasAsalMap] = useState<Record<string, string>>({});
  const kelasAsalLoaded = useRef(false);

  // Peran update — tracks which enrollmentIds are being saved
  const [updatingPeranIds, setUpdatingPeranIds] = useState<Set<string>>(new Set());

  // Attendance override — key: "userId_sessionId"
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());

  const { toasts, toast, dismissToast } = useToast();

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

  const fetchEnrollments = useCallback(async (kelasData: ClassDetail) => {
    setLoadingEnrollments(true);
    const res = await fetch(`/api/classes/${kelasData.id}/enrollments`);
    if (!res.ok) { setLoadingEnrollments(false); return; }
    const json = await res.json();
    setEnrollments(json.data ?? []);
    setLoadingEnrollments(false);
  }, []);

  const fetchMatrix = useCallback(async (kelasData: ClassDetail) => {
    if (!kelasData.sessions.length) return;
    setLoadingMatrix(true);
    const sessionIds = kelasData.sessions.map((s) => s.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createSupabaseBrowserClient() as any;
    const { data } = await Promise.resolve(
      sb.from("attendance")
        .select("session_id, user_id, status")
        .in("session_id", sessionIds)
    ) as { data: { session_id: string; user_id: string; status: string }[] | null };
    if (data) {
      const matrix: AttendanceMatrix = {};
      for (const row of data) {
        if (!matrix[row.user_id]) matrix[row.user_id] = {};
        matrix[row.user_id][row.session_id] = row.status;
      }
      setAttendanceMatrix(matrix);
    }
    setLoadingMatrix(false);
  }, []);

  const handleTabClick = (tab: "sesi" | "mahasiswa" | "rekap") => {
    if (tab === activeTab) return;
    setTabVisible(false);
    setTimeout(() => {
      setActiveTab(tab);
      setTabVisible(true);
      if (!fetchedTabs.has(tab) && kelas) {
        setFetchedTabs((prev) => new Set([...prev, tab]));
        if (tab === "mahasiswa") fetchEnrollments(kelas);
        if (tab === "rekap") { fetchEnrollments(kelas); fetchMatrix(kelas); }
      }
    }, 150);
  };

  // Load kelasAsal from localStorage once enrollments are available
  useEffect(() => {
    if (kelasAsalLoaded.current || enrollments.length === 0 || !kelas) return;
    kelasAsalLoaded.current = true;
    const map: Record<string, string> = {};
    for (const enr of enrollments) {
      if (!enr.profiles?.id) continue;
      const stored = localStorage.getItem(`kelasAsal_${enr.profiles.id}_${kelas.id}`);
      if (stored) map[enr.profiles.id] = stored;
    }
    setKelasAsalMap(map);
  }, [enrollments, kelas]);

  const handleKelasAsalChange = (userId: string, value: string) => {
    if (!kelas) return;
    if (value) localStorage.setItem(`kelasAsal_${userId}_${kelas.id}`, value);
    else localStorage.removeItem(`kelasAsal_${userId}_${kelas.id}`);
    setKelasAsalMap((prev) => ({ ...prev, [userId]: value }));
  };

  const handleAttendanceOverride = useCallback(async (
    userId: string,
    sessionId: string,
    newStatus: string,  // "" = hapus record
    oldStatus: string | undefined,
  ) => {
    // Runtime guard — same format-only regex used on the server
    // (Zod v4 .uuid() rejects non-RFC-4122-version UUIDs, so we use the loose format check)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(userId) || !UUID_RE.test(sessionId)) {
      console.error("[handleAttendanceOverride] Invalid UUID(s):", { userId, sessionId });
      toast.error(`Data tidak valid: ID bukan UUID yang valid.`);
      return;
    }
    const key = `${userId}_${sessionId}`;
    // Optimistic update
    setAttendanceMatrix((prev) => {
      const next = { ...prev, [userId]: { ...(prev[userId] ?? {}) } };
      if (!newStatus) delete next[userId][sessionId];
      else next[userId][sessionId] = newStatus;
      return next;
    });
    setUpdatingCells((prev) => new Set([...prev, key]));

    const res = await fetch("/api/attendance/override", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, session_id: sessionId, status: newStatus }),
    });
    const json = await res.json();
    setUpdatingCells((prev) => { const n = new Set(prev); n.delete(key); return n; });

    if (!res.ok) {
      // Revert
      setAttendanceMatrix((prev) => {
        const next = { ...prev, [userId]: { ...(prev[userId] ?? {}) } };
        if (!oldStatus) delete next[userId][sessionId];
        else next[userId][sessionId] = oldStatus;
        return next;
      });
      toast.error(json.message ?? "Gagal mengubah kehadiran.");
    }
  }, [toast]);

  const handlePeranChange = async (enrId: string, newPeran: string, oldPeran: string) => {
    // Optimistic update
    setEnrollments((prev) => prev.map((e) => e.id === enrId ? { ...e, peran: newPeran } : e));
    setUpdatingPeranIds((prev) => new Set([...prev, enrId]));
    const res = await fetch(`/api/enrollments/${enrId}/peran`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peran: newPeran }),
    });
    const json = await res.json();
    setUpdatingPeranIds((prev) => { const n = new Set(prev); n.delete(enrId); return n; });
    if (!res.ok) {
      // Revert
      setEnrollments((prev) => prev.map((e) => e.id === enrId ? { ...e, peran: oldPeran } : e));
      toast.error(json.message ?? "Gagal mengubah peran.");
    }
  };

  const handleSessionCreated = (sess: SessionItem) => {
    if (!kelas) return;
    setKelas({ ...kelas, sessions: [sess, ...kelas.sessions] });
  };

  const handleSessionEdited = (updated: SessionItem) => {
    if (!kelas) return;
    setKelas({ ...kelas, sessions: kelas.sessions.map((s) => s.id === updated.id ? updated : s) });
  };

  const handleSessionDeleted = (id: string) => {
    if (!kelas) return;
    setKelas({ ...kelas, sessions: kelas.sessions.filter((s) => s.id !== id) });
  };

  const handleSessionDeactivated = (updated: SessionItem) => {
    if (!kelas) return;
    setKelas({ ...kelas, sessions: kelas.sessions.map((s) => s.id === updated.id ? updated : s) });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Memuat kelas...</p>
      </div>
    );
  }

  if (error || !kelas) {
    return (
      <div style={{ minHeight: "100vh", padding: "28px 32px" }}>
        <Link href="/dashboard/kelas" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px" }}>
          <ChevronLeft size={14} /> Kembali ke Kelas
        </Link>
        <p style={{ color: "#C0392B" }}>{error ?? "Kelas tidak ditemukan."}</p>
      </div>
    );
  }

  const isDosen = kelas.my_peran === "dosen" || kelas.my_peran === "asisten";
  const completedSessions = kelas.sessions.filter((s) => !s.is_active && new Date(s.session_date + "T23:59:59") <= new Date());
  const activeSessions = kelas.sessions.filter((s) => s.is_active);
  const minPct = kelas.min_attendance_pct;
  const matrixSessions = kelas.sessions.filter((s) => s.is_active || new Date(s.session_date + "T23:59:59") <= new Date());

  const TAB_DEFS: { id: "sesi" | "mahasiswa" | "rekap"; label: string; count?: number }[] = [
    { id: "sesi", label: "Daftar Sesi", count: kelas.sessions.length },
    ...(isDosen ? [
      { id: "mahasiswa" as const, label: "Daftar Mahasiswa", count: kelas.enrollment_count },
      { id: "rekap" as const, label: "Rekap Presensi" },
    ] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/kelas" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1A6B4A")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
          <ChevronLeft size={14} /> Kelas Praktikum
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{kelas.code}</span>
      </div>

      {/* Class Header */}
      <div className="glass rounded-2xl" style={{ padding: "24px 28px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "linear-gradient(135deg,rgba(168,216,196,0.5),rgba(230,245,239,0.75))", border: "1px solid rgba(168,216,196,0.6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FlaskConical size={24} style={{ color: "#1A6B4A" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{kelas.name}</h1>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px", background: "rgba(230,245,239,0.8)", color: "#1A6B4A", border: "1px solid rgba(168,216,196,0.5)" }}>
                  {kelas.code}
                </span>
                {activeSessions.length > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#C0392B", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B", animation: "pulse-dot 1.5s ease-in-out infinite", display: "inline-block" }} />
                    LIVE
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {kelas.semester && <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{kelas.semester}</span>}
                {kelas.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--text-muted)" }}>
                    <MapPin size={12} /> {kelas.location}
                  </span>
                )}
                {kelas.my_peran && (
                  <span style={{ fontSize: "11px", padding: "1px 8px", borderRadius: "20px", background: "rgba(230,245,239,0.7)", color: "#1A6B4A", border: "1px solid rgba(168,216,196,0.45)", fontWeight: 600 }}>
                    {kelas.my_peran}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={fetchKelas} style={{ padding: "8px 12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(168,216,196,0.5)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "20px" }}>
          {[
            {
              label: "Mahasiswa", value: kelas.enrollment_count,
              href: isDosen ? `/dashboard/kelas/${classId}/enrollments` : undefined,
              icon: <Users size={13} style={{ color: "#1A6B4A" }} />,
            },
            { label: "Total Sesi", value: `${completedSessions.length}/${kelas.total_sessions_planned}`, icon: <CalendarDays size={13} style={{ color: "#1A6B4A" }} /> },
            { label: "Min Kehadiran", value: `${minPct}%`, icon: <CheckCircle size={13} style={{ color: "#1A6B4A" }} /> },
            { label: "Sesi Aktif", value: activeSessions.length, icon: <Radio size={13} style={{ color: activeSessions.length > 0 ? "#C0392B" : "#1A6B4A" }} /> },
          ].map((s) => (
            <div key={s.label} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(180,200,220,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                {s.icon}
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.label}</span>
              </div>
              {s.href ? (
                <Link href={s.href} style={{ fontSize: "20px", fontWeight: 700, color: "#1A6B4A", fontVariantNumeric: "tabular-nums", textDecoration: "none" }}>
                  {s.value} →
                </Link>
              ) : (
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabbed Container */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden", minHeight: 400 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(180,200,220,0.3)", padding: "0 20px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex" }}>
            {TAB_DEFS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    padding: "14px 16px",
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--text-primary)" : "#86efac",
                    background: "transparent",
                    border: "none",
                    borderBottom: isActive ? "2px solid #22c55e" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.06)"; } }}
                  onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = "#86efac"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span style={{ marginLeft: "6px", fontSize: "11px", padding: "1px 6px", borderRadius: "10px", background: isActive ? "rgba(34,197,94,0.15)" : "var(--text-muted)", color: isActive ? "#4ade80" : "var(--text-muted)", fontWeight: 600 }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Contextual action button */}
          {isDosen && activeTab === "sesi" && (
            <button onClick={() => setShowCreateSession(true)} className="btn-primary rounded-xl" style={{ gap: "8px", padding: "8px 14px", fontSize: "12px" }}>
              <Plus size={13} /> Tambah Sesi
            </button>
          )}
          {isDosen && activeTab === "mahasiswa" && (
            <button onClick={() => setShowAddMember(true)} className="btn-primary rounded-xl" style={{ gap: "8px", padding: "8px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center" }}>
              <UserPlus size={13} /> Tambah Anggota
            </button>
          )}
        </div>

        {/* Tab content */}
        <div style={{ opacity: tabVisible ? 1 : 0, transform: tabVisible ? "translateX(0)" : "translateX(-8px)", transition: "opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)" }}>

          {/* ── TAB: DAFTAR SESI ── */}
          {activeTab === "sesi" && (
            <div>
              {kelas.sessions.length === 0 ? (
                <div style={{ padding: "64px 24px", textAlign: "center" }}>
                  <CalendarDays size={36} style={{ color: "rgba(74,222,128,0.2)", margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    Belum ada sesi.{isDosen && <> Klik <strong style={{ color: "#1A6B4A" }}>+ Tambah Sesi</strong> di atas untuk mulai.</>}
                  </p>
                </div>
              ) : (
                <div>
                  {kelas.sessions.map((sess) => (
                    <div
                      key={sess.id}
                      style={{
                        display: "flex", alignItems: "stretch",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        borderLeft: sess.is_active ? "3px solid #ef4444" : "3px solid transparent",
                        background: sess.is_active ? "rgba(239,68,68,0.04)" : "transparent",
                      }}
                    >
                      {/* Clickable info area → detail page */}
                      <Link href={`/dashboard/kelas/${classId}/sesi/${sess.id}`} style={{ textDecoration: "none", flex: 1, display: "block" }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 16px 14px 20px", height: "100%", boxSizing: "border-box", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = sess.is_active ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{sess.title}</p>
                              <SessionStatusBadge sess={sess} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                                <CalendarDays size={11} />
                                {new Date(sess.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                              </span>
                              {sess.location && (
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                                  <MapPin size={11} /> {sess.location}
                                </span>
                              )}
                              {sess.is_active && sess.expires_at && (
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#C0392B" }}>
                                  <Clock size={11} /> Berakhir {new Date(sess.expires_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>→</span>
                        </div>
                      </Link>

                      {/* Action buttons — only for dosen/asisten */}
                      {isDosen && (
                        <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "0 10px", borderLeft: "1px solid rgba(16,185,129,0.07)", flexShrink: 0 }}>
                          {sess.is_active && (
                            <button
                              title="Nonaktifkan sesi"
                              onClick={() => setDeactivatingSess(sess)}
                              style={{ width: 30, height: 30, borderRadius: "8px", background: "transparent", border: "none", color: "#facc15", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(234,179,8,0.12)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              <ZapOff size={13} />
                            </button>
                          )}
                          <button
                            title="Edit sesi"
                            onClick={() => setEditingSess(sess)}
                            style={{ width: 30, height: 30, borderRadius: "8px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(230,245,239,0.75)"; (e.currentTarget as HTMLElement).style.color = "#1A6B4A"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            title={sess.is_active ? "Nonaktifkan sesi sebelum menghapus" : "Hapus sesi"}
                            onClick={() => !sess.is_active && setDeletingSess(sess)}
                            disabled={sess.is_active}
                            style={{ width: 30, height: 30, borderRadius: "8px", background: "transparent", border: "none", color: sess.is_active ? "rgba(239,68,68,0.2)" : "rgba(248,113,113,0.5)", cursor: sess.is_active ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                            onMouseEnter={(e) => { if (!sess.is_active) { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#C0392B"; } }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = sess.is_active ? "rgba(239,68,68,0.2)" : "rgba(248,113,113,0.5)"; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: DAFTAR MAHASISWA ── */}
          {activeTab === "mahasiswa" && (
            <div>
              {loadingEnrollments ? (
                <TableSkeleton cols={5} />
              ) : enrollments.length === 0 ? (
                <div style={{ padding: "64px 24px", textAlign: "center" }}>
                  <Users size={36} style={{ color: "rgba(74,222,128,0.2)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Belum ada mahasiswa terdaftar di kelas ini.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(230,245,239,0.8)" }}>
                      {["No", "Nama", "NIM", "Kelas Asal", "Peran"].map((h) => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: h === "No" ? "center" : "left", fontWeight: 700, fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr, i) => {
                      const p = enr.profiles;
                      const initials = (p?.full_name ?? "?").split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
                      const userId = p?.id ?? "";
                      const kelasAsal = userId ? (kelasAsalMap[userId] ?? "") : "";
                      const isUpdatingPeran = updatingPeranIds.has(enr.id);
                      // Only dosen (not asisten) can edit peran
                      const canEditPeran = kelas.my_peran === "dosen";
                      const peranColors: Record<string, { color: string; bg: string }> = {
                        mahasiswa: { color: "#1A6B4A", bg: "rgba(230,245,239,0.65)" },
                        asisten:   { color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
                        dosen:     { color: "#facc15", bg: "rgba(234,179,8,0.1)" },
                      };
                      const pc = peranColors[enr.peran] ?? peranColors.mahasiswa;
                      return (
                        <tr key={enr.id}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.12s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                          {/* No */}
                          <td style={{ padding: "11px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", width: 40 }}>{i + 1}</td>

                          {/* Nama */}
                          <td style={{ padding: "11px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,rgba(168,216,196,0.5),rgba(230,245,239,0.65))", border: "1px solid rgba(168,216,196,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#1A6B4A", flexShrink: 0 }}>{initials}</div>
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p?.full_name ?? "—"}</span>
                            </div>
                          </td>

                          {/* NIM */}
                          <td style={{ padding: "11px 16px", color: "var(--text-muted)", fontSize: "12px" }}>{p?.nim ?? "—"}</td>

                          {/* Kelas Asal — localStorage only */}
                          <td style={{ padding: "11px 16px" }}>
                            {isDosen ? (
                              <select
                                value={kelasAsal}
                                onChange={(e) => userId && handleKelasAsalChange(userId, e.target.value)}
                                style={{
                                  appearance: "none" as React.CSSProperties["appearance"],
                                  WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
                                  background: kelasAsal ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                                  border: kelasAsal ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: "8px",
                                  padding: "4px 28px 4px 10px",
                                  color: kelasAsal ? "#4ade80" : "var(--text-muted)",
                                  fontSize: "12px",
                                  fontWeight: kelasAsal ? 700 : 400,
                                  cursor: "pointer",
                                  outline: "none",
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234ade80' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 8px center",
                                  minWidth: 80,
                                }}
                              >
                                <option value="">— Pilih —</option>
                                {["RA","RB","RC","RD","RE","RF","RG"].map((k) => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize: "11px", color: kelasAsal ? "#4ade80" : "var(--text-muted)", fontWeight: kelasAsal ? 700 : 400 }}>{kelasAsal || "—"}</span>
                            )}
                          </td>

                          {/* Peran */}
                          <td style={{ padding: "11px 16px" }}>
                            {isUpdatingPeran ? (
                              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(34,197,94,0.3)", borderTopColor: "#1A6B4A", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                            ) : canEditPeran ? (
                              <select
                                value={enr.peran}
                                onChange={(e) => handlePeranChange(enr.id, e.target.value, enr.peran)}
                                style={{
                                  appearance: "none" as React.CSSProperties["appearance"],
                                  WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
                                  background: pc.bg,
                                  border: `1px solid ${pc.color}40`,
                                  borderRadius: "8px",
                                  padding: "4px 28px 4px 10px",
                                  color: pc.color,
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  outline: "none",
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='${encodeURIComponent(pc.color)}' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 8px center",
                                  minWidth: 100,
                                }}
                              >
                                <option value="mahasiswa">mahasiswa</option>
                                <option value="asisten">asisten</option>
                                <option value="dosen">dosen</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: pc.bg, color: pc.color, border: `1px solid ${pc.color}40`, fontWeight: 600 }}>{enr.peran}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB: REKAP PRESENSI ── */}
          {activeTab === "rekap" && (
            <div>
              {loadingMatrix || loadingEnrollments ? (
                <TableSkeleton cols={5} />
              ) : matrixSessions.length === 0 ? (
                <div style={{ padding: "64px 24px", textAlign: "center" }}>
                  <CheckCircle size={36} style={{ color: "rgba(74,222,128,0.2)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Belum ada sesi yang selesai untuk ditampilkan.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(230,245,239,0.8)", background: "rgba(8,24,20,0.98)" }}>
                        <th style={{ padding: "11px 16px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", position: "sticky", left: 0, background: "rgba(8,24,20,0.98)", minWidth: 180, zIndex: 2 }}>NAMA</th>
                        {matrixSessions.map((s, i) => (
                          <th key={s.id} title={`${s.title} — ${new Date(s.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                            style={{ padding: "11px 8px", textAlign: "center", fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap", minWidth: 52, cursor: "default" }}>
                            S{i + 1}
                          </th>
                        ))}
                        <th style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", position: "sticky", right: 0, background: "rgba(8,24,20,0.98)", minWidth: 56, zIndex: 2 }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enr) => {
                        const uid = enr.profiles?.id ?? null; // always string | null — never undefined
                        const userMatrix = uid ? (attendanceMatrix[uid] ?? {}) : {};
                        const attended = matrixSessions.filter((s) => { const st = userMatrix[s.id]; return st === "hadir" || st === "telat"; }).length;
                        const pct = matrixSessions.length > 0 ? Math.round((attended / matrixSessions.length) * 100) : 0;
                        const pctColor = pct >= minPct ? "#1A6B4A" : pct >= minPct - 15 ? "#facc15" : "#C0392B";
                        const belowMin = pct < minPct;
                        return (
                          <tr key={enr.id}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: belowMin ? "rgba(239,68,68,0.03)" : "transparent", transition: "background 0.12s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = belowMin ? "rgba(239,68,68,0.07)" : "rgba(16,185,129,0.04)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = belowMin ? "rgba(239,68,68,0.03)" : "transparent")}>
                            <td style={{ padding: "10px 16px", position: "sticky", left: 0, background: "inherit", zIndex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                {belowMin && <span style={{ fontSize: "12px" }}>⚠️</span>}
                                <div>
                                  <p style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{enr.profiles?.full_name ?? "—"}</p>
                                  <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{enr.profiles?.nim ?? ""}</p>
                                </div>
                              </div>
                            </td>
                            {matrixSessions.map((s) => {
                              const status = uid ? userMatrix[s.id] : undefined;
                              const cellKey = `${uid ?? "nouid"}_${s.id}`;
                              const isUpdatingCell = updatingCells.has(cellKey);

                              type StatusKey = "hadir" | "telat" | "absen" | "ditolak" | "";
                              const statusMeta: Record<StatusKey, { sym: string; color: string; bg: string }> = {
                                hadir:   { sym: "✓", color: "#1A6B4A", bg: "rgba(230,245,239,0.8)" },
                                telat:   { sym: "~", color: "#facc15", bg: "rgba(234,179,8,0.1)" },
                                absen:   { sym: "✗", color: "#C0392B", bg: "rgba(239,68,68,0.1)" },
                                ditolak: { sym: "✗", color: "#C0392B", bg: "rgba(239,68,68,0.1)" },
                                "": { sym: "—", color: "var(--text-muted)", bg: "transparent" },
                              };
                              const cur = (status ?? "") as StatusKey;
                              const meta = statusMeta[cur] ?? statusMeta[""];

                              return (
                                <td key={s.id} style={{ padding: "6px 8px", textAlign: "center" }}>
                                  {isUpdatingCell ? (
                                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26 }}>
                                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(34,197,94,0.25)", borderTopColor: "#1A6B4A", animation: "spin 0.6s linear infinite" }} />
                                    </div>
                                  ) : isDosen && uid !== null ? (
                                    <select
                                      value={cur}
                                      onChange={(e) => handleAttendanceOverride(uid, s.id, e.target.value, status)}
                                      title={cur ? `Status: ${cur}` : "Belum ada data — klik untuk set"}
                                      style={{
                                        appearance: "none" as React.CSSProperties["appearance"],
                                        WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
                                        width: 36,
                                        height: 30,
                                        borderRadius: "7px",
                                        background: meta.bg || "rgba(255,255,255,0.04)",
                                        border: cur ? `1px solid ${meta.color}50` : "1px dashed var(--text-muted)",
                                        color: meta.color,
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        outline: "none",
                                        textAlign: "center",
                                        textAlignLast: "center",
                                        paddingLeft: 2,
                                        paddingRight: 2,
                                      }}
                                    >
                                      <option value="">—</option>
                                      <option value="hadir">✓</option>
                                      <option value="telat">~</option>
                                      <option value="absen">✗</option>
                                      <option value="ditolak">✗/D</option>
                                    </select>
                                  ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "6px", background: meta.bg, color: meta.color, fontWeight: 700, fontSize: "13px" }}>
                                      {meta.sym}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td style={{ padding: "8px 14px", textAlign: "center", position: "sticky", right: 0, background: "inherit", zIndex: 1 }}>
                              <span style={{ fontWeight: 700, fontSize: "12px", color: pctColor }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(230,245,239,0.65)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {([["✓","#1A6B4A","rgba(230,245,239,0.8)","Hadir"],["~","#facc15","rgba(234,179,8,0.1)","Telat"],["✗","#C0392B","rgba(239,68,68,0.1)","Absen/Ditolak"],["—","var(--text-muted)","transparent","Belum ada data"]] as const).map(([sym,col,bg,label]) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "5px", background: bg, color: col, fontWeight: 700, fontSize: "11px" }}>{sym}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                    {isDosen && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Klik sel untuk ubah kehadiran secara manual
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {showCreateSession && (
        <CreateSessionModal
          classId={classId}
          onClose={() => setShowCreateSession(false)}
          onSuccess={handleSessionCreated}
        />
      )}
      {showAddMember && kelas && (
        <AddMemberModal
          classId={classId}
          enrolledUserIds={new Set(enrollments.map((e) => e.profiles?.id ?? "").filter(Boolean))}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            fetchEnrollments(kelas);
            setKelas((prev) => prev ? { ...prev, enrollment_count: prev.enrollment_count + 1 } : prev);
            toast.success("Anggota berhasil ditambahkan ke kelas.");
          }}
        />
      )}
      {editingSess && (
        <EditSessionModal
          sess={editingSess}
          onClose={() => setEditingSess(null)}
          onSuccess={(updated) => { handleSessionEdited(updated); setEditingSess(null); }}
        />
      )}
      {deletingSess && (
        <DeleteSessionModal
          sess={deletingSess}
          onClose={() => setDeletingSess(null)}
          onSuccess={(id) => { handleSessionDeleted(id); setDeletingSess(null); }}
        />
      )}
      {deactivatingSess && (
        <DeactivateConfirmModal
          sess={deactivatingSess}
          onClose={() => setDeactivatingSess(null)}
          onSuccess={(updated) => { handleSessionDeactivated(updated); setDeactivatingSess(null); }}
        />
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        select:focus { border-color: rgba(74,222,128,0.5) !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.15) !important; }
        select option { background: #0a1f1a; color: #f0fdf4; }
      `}</style>

      {/* Toast notifications */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map((t) => (
          <Toast key={t.id} id={t.id} message={t.message} type={t.type} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
}
