"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, RadioTower, CheckCircle, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isActive: boolean;
}

const INITIAL_SESSIONS: Session[] = [
  { id: "s1", title: "Praktikum Jaringan - A1", description: "Konfigurasi routing dan switching", date: "2026-02-28", location: "Lab Komputer A, Gedung 4", isActive: true },
  { id: "s2", title: "Basis Data - B2", description: "Normalisasi dan SQL lanjut", date: "2026-02-27", location: "Lab Komputer 01", isActive: false },
  { id: "s3", title: "Sistem Operasi - C1", description: "Proses dan manajemen memori", date: "2026-02-25", location: "Lab Komputer 05", isActive: false },
];

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });

  const handleSubmit = () => {
    if (!form.title || !form.date || !form.location) return;
    if (editId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === editId ? { ...s, ...form } : s))
      );
      setEditId(null);
    } else {
      setSessions((prev) => [
        { id: `s${Date.now()}`, ...form, isActive: false },
        ...prev,
      ]);
    }
    setForm({ title: "", description: "", date: "", location: "" });
    setShowForm(false);
    // TODO: call POST /api/sessions/create or PATCH /api/sessions/{id}
  };

  const handleEdit = (s: Session) => {
    setForm({ title: s.title, description: s.description, date: s.date, location: s.location });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    // TODO: call DELETE /api/sessions/{id}
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Manajemen Sesi
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Kelola sesi praktikum
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: "", description: "", date: "", location: "" }); }}
          className="text-xs px-3 py-2"
        >
          <Plus size={13} /> Buat Sesi
        </GlassButton>
      </div>

      {/* Form */}
      {showForm && (
        <div
          className="mb-4 p-4 rounded-xl space-y-3 animate-fade-slide-down"
          style={{
            background: "rgba(5,20,10,0.5)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--green-brand)" }}>
            {editId ? "✏ Edit Sesi" : "➕ Buat Sesi Baru"}
          </p>
          <input
            className="input-glass"
            placeholder="Judul sesi (contoh: Praktikum Jaringan - A1)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="input-glass"
            placeholder="Deskripsi (opsional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="input-glass"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <input
              className="input-glass"
              placeholder="Lokasi"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <GlassButton variant="ghost" onClick={() => setShowForm(false)} className="flex-1 text-xs py-2">
              Batal
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSubmit} className="flex-1 text-xs py-2 rounded-xl">
              {editId ? "Update Sesi" : "Simpan Sesi"}
            </GlassButton>
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-2">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className="flex items-start gap-3 px-3 py-3 rounded-xl transition-colors"
            style={{
              background: sess.isActive ? "rgba(5,46,22,0.3)" : "rgba(5,20,10,0.3)",
              border: `1px solid ${sess.isActive ? "rgba(34,197,94,0.25)" : "var(--border-subtle)"}`,
            }}
          >
            <div className="mt-0.5">
              {sess.isActive ? (
                <div
                  className="w-2 h-2 rounded-full mt-1.5"
                  style={{
                    background: "#22c55e",
                    animation: "pulse-dot 1.5s ease-in-out infinite",
                  }}
                />
              ) : (
                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: "var(--text-muted)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {sess.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {sess.date} · {sess.location}
              </p>
              {sess.description && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                  {sess.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleEdit(sess)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => handleDelete(sess.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: "var(--text-muted)" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
