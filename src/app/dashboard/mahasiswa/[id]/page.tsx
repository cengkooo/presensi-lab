"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical, Users, ChevronRight,
  CheckCircle, Radio, Plus, X,
} from "lucide-react";
import {
  getSessionsByClass, getEnrolledUsers, computeStudentSummaries,
} from "@/lib/mockData";
import { useClasses } from "@/context/ClassesContext";
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
  const { classes: allClasses, addClass } = useClasses();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewClassForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<NewClassForm>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  const setField = (key: keyof NewClassForm) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Close on backdrop click
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setShowModal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModal]);

  // Close on Escape
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showModal]);

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

  function handleSubmit() {
    if (!validate()) return;
    const newKelas: PraktikumClass = {
      id: `c_${Date.now()}`,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      semester: form.semester.trim(),
      lecturer: form.lecturer.trim(),
      location: form.location.trim(),
      total_sessions_planned: parseInt(form.total_sessions_planned, 10),
      min_attendance_pct: parseInt(form.min_attendance_pct, 10),
      created_at: new Date().toISOString(),
    };
    addClass(newKelas);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  const classes = useMemo(() =>
    allClasses.map((kelas) => {
      const sessions = getSessionsByClass(kelas.id);
      const enrolled = getEnrolledUsers(kelas.id);
      const summaries = computeStudentSummaries(kelas.id);
      const completedSessions = sessions.filter((s) => !s.is_active);
      const avgPct = summaries.length > 0
        ? Math.round(summaries.reduce((a, s) => a + s.attendance_pct, 0) / summaries.length)
        : 0;
      const eligibleCount = summaries.filter((s) => s.is_eligible).length;
      const activeSession = sessions.find((s) => s.is_active);
      return { kelas, sessions, enrolled, completedSessions, avgPct, eligibleCount, activeSession };
    }),
    [allClasses]
  );

  const totalStats = {
    totalKelas: classes.length,
    totalMhs: new Set(classes.flatMap((c) => c.enrolled.map((u) => u.id))).size,
    avgKehadiran: classes.length > 0
      ? Math.round(classes.reduce((a, c) => a + c.avgPct, 0) / classes.length)
      : 0,
    activeCount: classes.filter((c) => c.activeSession).length,
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
        {classes.map(({ kelas, sessions, enrolled, completedSessions, avgPct, eligibleCount, activeSession }) => (
          <Link key={kelas.id} href={`/dashboard/kelas/${kelas.id}`}
            style={{ textDecoration: "none" }}>
            <div
              className="glass glass-hover rounded-2xl"
              style={{ padding: "20px 22px", cursor: "pointer", display: "flex", alignItems: "center", gap: "20px" }}
            >
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
                  {activeSession && (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
                      LIVE
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.45)" }}>
                  {kelas.lecturer} · {kelas.semester} · {kelas.location}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "28px", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{enrolled.length}</p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>Mahasiswa</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>
                    {completedSessions.length}<span style={{ fontSize: "13px", color: "rgba(110,231,183,0.4)" }}>/{kelas.total_sessions_planned}</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>Sesi</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: avgPct >= kelas.min_attendance_pct ? "#34D399" : avgPct >= 60 ? "#facc15" : "#f87171" }}>
                    {avgPct}%
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>Rata-rata</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#34D399", fontVariantNumeric: "tabular-nums" }}>
                    {eligibleCount}<span style={{ fontSize: "13px", color: "rgba(110,231,183,0.4)" }}>/{enrolled.length}</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>Lulus</p>
                </div>
              </div>

              <ChevronRight size={18} style={{ color: "rgba(110,231,183,0.3)", flexShrink: 0 }} />
            </div>
          </Link>
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
              <button onClick={handleSubmit}
                style={{ padding: "9px 22px", borderRadius: 10, background: "linear-gradient(135deg,rgba(16,185,129,0.35),rgba(16,185,129,0.2))", border: "1px solid rgba(16,185,129,0.35)", color: "#34D399", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <Plus size={13} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />
                Buat Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .kelas-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        input:focus { border-color: rgba(16,185,129,0.5) !important; box-shadow: 0 0 0 2px rgba(16,185,129,0.08); }
      `}</style>
    </div>
  );
}

