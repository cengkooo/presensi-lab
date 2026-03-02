"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FlaskConical, Users, ChevronRight,
  CheckCircle, Radio, Plus, X, Pencil, Trash2,
} from "lucide-react";
import type { PraktikumClass } from "@/types";

// ── Form state shape ───────────────────────────────────────────────────────
interface NewClassForm {
  name: string;
  code: string;
  semester: string;
  lecturer: string;
  location: string;
  total_sessions_planned: string;
  min_attendance_pct: string;
}

const EMPTY_FORM: NewClassForm = {
  name: "",
  code: "",
  semester: "Genap 2025/2026",
  lecturer: "",
  location: "",
  total_sessions_planned: "14",
  min_attendance_pct: "75",
};

// ── Input component ───────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = "text", required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: "rgba(110,231,183,0.6)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "1" : undefined}
        style={{
          background: "rgba(20,51,30,0.6)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 10,
          padding: "9px 13px",
          color: "#f0fdf4",
          fontSize: 14,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {hint && <p style={{ fontSize: 11, color: "rgba(110,231,183,0.4)", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function KelasPage() {
  const [allClasses, setAllClasses] = useState<PraktikumClass[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewClassForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<NewClassForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Edit & Delete state
  const [editingClass, setEditingClass] = useState<PraktikumClass | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<NewClassForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<Partial<NewClassForm>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editModalRef = useRef<HTMLDivElement>(null);

  const [deletingClass, setDeletingClass] = useState<PraktikumClass | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // ── Fetch classes from API ────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes", { credentials: "same-origin" });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAllClasses(json.data.map((raw: any): PraktikumClass => ({
        id:                     raw.id,
        code:                   raw.code ?? "",
        name:                   raw.name ?? "",
        semester:               raw.semester ?? "",
        lecturer:               raw.lecturer ?? raw.dosen ?? "",
        location:               raw.location ?? "",
        total_sessions_planned: raw.total_sessions_planned ?? 14,
        min_attendance_pct:     raw.min_attendance_pct ?? 75,
        created_at:             raw.created_at ?? "",
      })));
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const setField = (key: keyof NewClassForm) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Close on backdrop click / Escape — create modal
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setShowModal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModal]);
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showModal]);

  // Close on backdrop click / Escape — edit modal
  useEffect(() => {
    if (!showEditModal) return;
    const handler = (e: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(e.target as Node)) setShowEditModal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEditModal]);
  useEffect(() => {
    if (!showEditModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowEditModal(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showEditModal]);

  // Close on backdrop click / Escape — delete modal
  useEffect(() => {
    if (!showDeleteModal) return;
    const handler = (e: MouseEvent) => {
      if (deleteModalRef.current && !deleteModalRef.current.contains(e.target as Node)) setShowDeleteModal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDeleteModal]);
  useEffect(() => {
    if (!showDeleteModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowDeleteModal(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showDeleteModal]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  function openEditModal(kelas: PraktikumClass) {
    setEditingClass(kelas);
    setEditForm({
      name:                   kelas.name,
      code:                   kelas.code,
      semester:               kelas.semester,
      lecturer:               kelas.lecturer,
      location:               kelas.location,
      total_sessions_planned: String(kelas.total_sessions_planned),
      min_attendance_pct:     String(kelas.min_attendance_pct),
    });
    setEditErrors({});
    setShowEditModal(true);
  }

  function validateEdit(): boolean {
    const errs: Partial<NewClassForm> = {};
    if (!editForm.name.trim())     errs.name     = "Nama kelas wajib diisi";
    if (!editForm.code.trim())     errs.code     = "Kode kelas wajib diisi";
    if (!editForm.semester.trim()) errs.semester = "Semester wajib diisi";
    if (!editForm.lecturer.trim()) errs.lecturer = "Nama dosen wajib diisi";
    if (!editForm.location.trim()) errs.location = "Lokasi wajib diisi";
    const sesi = parseInt(editForm.total_sessions_planned, 10);
    if (!sesi || sesi < 1)         errs.total_sessions_planned = "Jumlah sesi minimal 1";
    const minPct = parseInt(editForm.min_attendance_pct, 10);
    if (!minPct || minPct < 1 || minPct > 100) errs.min_attendance_pct = "Masukkan nilai 1–100";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleEditSubmit() {
    if (!editingClass || !validateEdit()) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${editingClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                   editForm.name.trim(),
          code:                   editForm.code.trim().toUpperCase(),
          semester:               editForm.semester.trim(),
          lecturer:               editForm.lecturer.trim(),
          location:               editForm.location.trim(),
          total_sessions_planned: parseInt(editForm.total_sessions_planned, 10),
          min_attendance_pct:     parseInt(editForm.min_attendance_pct, 10),
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchClasses();
        setShowEditModal(false);
      } else {
        alert(json.message ?? "Gagal memperbarui kelas.");
      }
    } catch {
      alert("Gagal terhubung ke server.");
    } finally {
      setEditSubmitting(false);
    }
  }

  // ── Delete helpers ─────────────────────────────────────────────────────────
  function openDeleteModal(kelas: PraktikumClass) {
    setDeletingClass(kelas);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!deletingClass) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${deletingClass.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchClasses();
        setShowDeleteModal(false);
      } else {
        alert(json.message ?? "Gagal menghapus kelas.");
      }
    } catch {
      alert("Gagal terhubung ke server.");
    } finally {
      setDeleting(false);
    }
  }

  const setEditField = (key: keyof NewClassForm) => (val: string) =>
    setEditForm((f) => ({ ...f, [key]: val }));

  function validate(): boolean {
    const errs: Partial<NewClassForm> = {};
    if (!form.name.trim())     errs.name     = "Nama kelas wajib diisi";
    if (!form.code.trim())     errs.code     = "Kode kelas wajib diisi";
    if (!form.semester.trim()) errs.semester = "Semester wajib diisi";
    if (!form.lecturer.trim()) errs.lecturer = "Nama dosen wajib diisi";
    if (!form.location.trim()) errs.location = "Lokasi wajib diisi";
    const sesi = parseInt(form.total_sessions_planned, 10);
    if (!sesi || sesi < 1)     errs.total_sessions_planned = "Jumlah sesi minimal 1";
    const minPct = parseInt(form.min_attendance_pct, 10);
    if (!minPct || minPct < 1 || minPct > 100) errs.min_attendance_pct = "Masukkan nilai 1–100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                   form.name.trim(),
          code:                   form.code.trim().toUpperCase(),
          semester:               form.semester.trim(),
          lecturer:               form.lecturer.trim(),
          location:               form.location.trim(),
          total_sessions_planned: parseInt(form.total_sessions_planned, 10),
          min_attendance_pct:     parseInt(form.min_attendance_pct, 10),
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchClasses();
      } else {
        alert(json.message ?? "Gagal membuat kelas.");
      }
    } catch {
      alert("Gagal terhubung ke server.");
    } finally {
      setSubmitting(false);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }

  // Classes display — no mock data needed, all from API via context
  const classes = useMemo(() =>
    allClasses.map((kelas) => ({
      kelas,
      // These are placeholders until detail page fetches real data
      sessionCount: 0,
      enrolledCount: 0,
      avgPct: 0,
      eligibleCount: 0,
      isActive: false,
    })),
    [allClasses]
  );

  const totalStats = {
    totalKelas:   classes.length,
    totalMhs:     0,
    avgKehadiran: 0,
    activeCount:  0,
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
            Kelas Praktikum
          </h1>
          <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>
            Kelola kelas, sesi, dan rekap absensi seluruh mahasiswa
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.15))",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: 12, padding: "10px 18px",
            color: "#34D399", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(135deg,rgba(16,185,129,0.4),rgba(16,185,129,0.25))")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(16,185,129,0.15))")}
        >
          <Plus size={16} />
          Buat Kelas Baru
        </button>
      </div>

      {/* Global Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "28px" }}
        className="kelas-stat-grid">
        {[
          { label: "Total Kelas", value: totalStats.totalKelas, icon: <FlaskConical size={16} style={{ color: "#34D399" }} /> },
          { label: "Total Mahasiswa", value: totalStats.totalMhs, icon: <Users size={16} style={{ color: "#34D399" }} /> },
          { label: "Rata-rata Kehadiran", value: `${totalStats.avgKehadiran}%`, icon: <CheckCircle size={16} style={{ color: "#34D399" }} /> },
          { label: "Sesi Aktif Sekarang", value: totalStats.activeCount, icon: <Radio size={16} style={{ color: "#f87171" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "8px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.5)" }}>{s.label}</span>
            </div>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Class Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {classes.length === 0 && (
          <div className="glass rounded-2xl" style={{ padding: "48px 24px", textAlign: "center" }}>
            <FlaskConical size={40} style={{ color: "rgba(74,222,128,0.3)", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(110,231,183,0.5)", fontSize: 15 }}>Belum ada kelas. Klik <strong style={{ color: "#34D399" }}>Buat Kelas Baru</strong> untuk memulai.</p>
          </div>
        )}
        {classes.map(({ kelas }) => (
          <div key={kelas.id} className="glass rounded-2xl"
            style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: "20px" }}>

            {/* Clickable area → detail page */}
            <Link href={`/dashboard/kelas/${kelas.id}`}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "20px", flex: 1, minWidth: 0 }}
              className="kelas-card-link">
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: "14px", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FlaskConical size={22} style={{ color: "#34D399" }} />
              </div>
              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>{kelas.name}</h3>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}>
                    {kelas.code}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.45)" }}>
                  {kelas.lecturer} · {kelas.semester} · {kelas.location}
                </p>
              </div>
              <ChevronRight size={18} style={{ color: "rgba(110,231,183,0.3)", flexShrink: 0 }} />
            </Link>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                onClick={(e) => { e.preventDefault(); openEditModal(kelas); }}
                title="Edit kelas"
                style={{
                  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(16,185,129,0.22)";
                  e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(16,185,129,0.08)";
                  e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)";
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); openDeleteModal(kelas); }}
                title="Hapus kelas"
                style={{
                  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.22)";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)";
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal: Buat Kelas Baru ─────────────────────────────────────────*/}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div
            ref={modalRef}
            className="glass rounded-2xl"
            style={{
              width: "100%", maxWidth: 540,
              padding: "28px 28px 24px",
              border: "1px solid rgba(16,185,129,0.2)",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FlaskConical size={18} style={{ color: "#34D399" }} />
                </div>
                <div>
                  <h2 style={{ color: "#f0fdf4", fontSize: 17, fontWeight: 700, margin: 0 }}>Buat Kelas Baru</h2>
                  <p style={{ color: "rgba(110,231,183,0.45)", fontSize: 12, margin: 0 }}>Isi detail kelas praktikum</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(110,231,183,0.5)", lineHeight: 1, padding: 4, borderRadius: 6 }}>
                <X size={20} />
              </button>
            </div>

            {/* Form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Row: Nama Kelas */}
              <Field label="Nama Kelas" required value={form.name} onChange={setField("name")}
                placeholder="cth: Praktikum Jaringan Komputer" />
              {errors.name && <p style={{ fontSize: 11, color: "#f87171", marginTop: -10 }}>{errors.name}</p>}

              {/* Row: Kode + Semester */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Field label="Kode Kelas" required value={form.code} onChange={setField("code")}
                    placeholder="cth: JK-A1" />
                  {errors.code && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{errors.code}</p>}
                </div>
                <div>
                  <Field label="Semester" required value={form.semester} onChange={setField("semester")}
                    placeholder="cth: Genap 2025/2026" />
                  {errors.semester && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{errors.semester}</p>}
                </div>
              </div>

              {/* Row: Dosen */}
              <div>
                <Field label="Nama Dosen" required value={form.lecturer} onChange={setField("lecturer")}
                  placeholder="cth: Dr. Alex Rivera" />
                {errors.lecturer && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{errors.lecturer}</p>}
              </div>

              {/* Row: Lokasi */}
              <div>
                <Field label="Lokasi Lab" required value={form.location} onChange={setField("location")}
                  placeholder="cth: Lab Komputer A, Gedung 4" />
                {errors.location && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{errors.location}</p>}
              </div>

              {/* Row: Jumlah Sesi + Min Kehadiran */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Field
                    label="Jumlah Sesi" required type="number" value={form.total_sessions_planned}
                    onChange={setField("total_sessions_planned")}
                    placeholder="cth: 14"
                    hint="Penyebut perhitungan % kehadiran"
                  />
                  {errors.total_sessions_planned && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{errors.total_sessions_planned}</p>}
                </div>
                <div>
                  <Field
                    label="Min Kehadiran %" required type="number" value={form.min_attendance_pct}
                    onChange={setField("min_attendance_pct")}
                    placeholder="cth: 75"
                    hint="Batas lulus (1–100)"
                  />
                  {errors.min_attendance_pct && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{errors.min_attendance_pct}</p>}
                </div>
              </div>

              {/* Formula preview */}
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={14} style={{ color: "#34D399", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "rgba(110,231,183,0.7)", margin: 0 }}>
                  % Kehadiran = <strong style={{ color: "#34D399" }}>Sesi Dihadiri / {form.total_sessions_planned || "?"} × 100</strong>
                  {" "}· Lulus jika ≥ <strong style={{ color: "#34D399" }}>{form.min_attendance_pct || "?"}%</strong>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "9px 18px", borderRadius: 10, background: "none", border: "1px solid rgba(110,231,183,0.2)", color: "rgba(110,231,183,0.6)", fontSize: 13, cursor: "pointer" }}>
                Batal
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: "9px 22px", borderRadius: 10, background: "linear-gradient(135deg,rgba(16,185,129,0.35),rgba(16,185,129,0.2))", border: "1px solid rgba(16,185,129,0.35)", color: "#34D399", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Menyimpan..." : <><Plus size={13} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />Buat Kelas</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Kelas ──────────────────────────────────────────────*/}
      {showEditModal && editingClass && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div
            ref={editModalRef}
            className="glass rounded-2xl"
            style={{
              width: "100%", maxWidth: 540,
              padding: "28px 28px 24px",
              border: "1px solid rgba(16,185,129,0.2)",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={16} style={{ color: "#34D399" }} />
                </div>
                <div>
                  <h2 style={{ color: "#f0fdf4", fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Kelas</h2>
                  <p style={{ color: "rgba(110,231,183,0.45)", fontSize: 12, margin: 0 }}>{editingClass.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(110,231,183,0.5)", lineHeight: 1, padding: 4, borderRadius: 6 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Nama Kelas" required value={editForm.name} onChange={setEditField("name")}
                placeholder="cth: Praktikum Jaringan Komputer" />
              {editErrors.name && <p style={{ fontSize: 11, color: "#f87171", marginTop: -10 }}>{editErrors.name}</p>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Field label="Kode Kelas" required value={editForm.code} onChange={setEditField("code")}
                    placeholder="cth: JK-A1" />
                  {editErrors.code && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{editErrors.code}</p>}
                </div>
                <div>
                  <Field label="Semester" required value={editForm.semester} onChange={setEditField("semester")}
                    placeholder="cth: Genap 2025/2026" />
                  {editErrors.semester && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{editErrors.semester}</p>}
                </div>
              </div>

              <div>
                <Field label="Nama Dosen" required value={editForm.lecturer} onChange={setEditField("lecturer")}
                  placeholder="cth: Dr. Alex Rivera" />
                {editErrors.lecturer && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{editErrors.lecturer}</p>}
              </div>

              <div>
                <Field label="Lokasi Lab" required value={editForm.location} onChange={setEditField("location")}
                  placeholder="cth: Lab Komputer A, Gedung 4" />
                {editErrors.location && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{editErrors.location}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Field label="Jumlah Sesi" required type="number" value={editForm.total_sessions_planned}
                    onChange={setEditField("total_sessions_planned")} placeholder="cth: 14"
                    hint="Penyebut perhitungan % kehadiran" />
                  {editErrors.total_sessions_planned && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{editErrors.total_sessions_planned}</p>}
                </div>
                <div>
                  <Field label="Min Kehadiran %" required type="number" value={editForm.min_attendance_pct}
                    onChange={setEditField("min_attendance_pct")} placeholder="cth: 75"
                    hint="Batas lulus (1–100)" />
                  {editErrors.min_attendance_pct && <p style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{editErrors.min_attendance_pct}</p>}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={() => setShowEditModal(false)}
                style={{ padding: "9px 18px", borderRadius: 10, background: "none", border: "1px solid rgba(110,231,183,0.2)", color: "rgba(110,231,183,0.6)", fontSize: 13, cursor: "pointer" }}>
                Batal
              </button>
              <button onClick={handleEditSubmit} disabled={editSubmitting}
                style={{ padding: "9px 22px", borderRadius: 10, background: "linear-gradient(135deg,rgba(16,185,129,0.35),rgba(16,185,129,0.2))", border: "1px solid rgba(16,185,129,0.35)", color: "#34D399", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: editSubmitting ? 0.6 : 1 }}>
                {editSubmitting ? "Menyimpan..." : <><Pencil size={13} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Konfirmasi Hapus ────────────────────────────────────────────*/}
      {showDeleteModal && deletingClass && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div
            ref={deleteModalRef}
            className="glass rounded-2xl"
            style={{
              width: "100%", maxWidth: 440,
              padding: "28px 28px 24px",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trash2 size={18} style={{ color: "#f87171" }} />
              </div>
              <div>
                <h2 style={{ color: "#f0fdf4", fontSize: 17, fontWeight: 700, margin: 0 }}>Hapus Kelas?</h2>
                <p style={{ color: "rgba(110,231,183,0.45)", fontSize: 12, margin: 0 }}>Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p style={{ color: "rgba(240,253,244,0.75)", fontSize: 14, marginBottom: 6, lineHeight: 1.6 }}>
              Kelas <strong style={{ color: "#f0fdf4" }}>{deletingClass.name}</strong>
              {" "}(<span style={{ color: "#34D399" }}>{deletingClass.code}</span>) beserta seluruh sesi dan data kehadiran terkait akan dihapus permanen.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteModal(false)}
                style={{ padding: "9px 18px", borderRadius: 10, background: "none", border: "1px solid rgba(110,231,183,0.2)", color: "rgba(110,231,183,0.6)", fontSize: 13, cursor: "pointer" }}>
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 22px", borderRadius: 10, background: "linear-gradient(135deg,rgba(248,113,113,0.3),rgba(248,113,113,0.15))", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Menghapus..." : <><Trash2 size={13} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />Hapus Kelas</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .kelas-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        input:focus { border-color: rgba(16,185,129,0.5) !important; box-shadow: 0 0 0 2px rgba(16,185,129,0.08); }
        .kelas-card-link:hover + div button, .kelas-card-link:hover { opacity: 1; }
      `}</style>
    </div>
  );
}

