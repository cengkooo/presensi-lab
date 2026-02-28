"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Users, UserCheck, ChevronLeft, ChevronRight,
  BarChart3, Download, Plus, MoreVertical, Calendar,
  X, AlertTriangle, BookOpen, ExternalLink,
} from "lucide-react";
import {
  MOCK_USERS, MOCK_CLASSES,
  getStudentClassSummaries, getStudentClassBadges, getLowAttendanceAlerts,
} from "@/lib/mockData";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useClasses } from "@/context/ClassesContext";
import type { User } from "@/types";

const PAGE_SIZE = 8;

/* ── ATTENDANCE BAR ── */
function AttBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#34D399" : pct >= 60 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", minWidth: "60px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color, minWidth: "32px", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

/* ── QUICK DRAWER ── */
function QuickDrawer({ user, onClose }: { user: User; onClose: () => void }) {
  const router = useRouter();
  const { enrollments, addEnrollment } = useEnrollments();
  const { classes: allClasses } = useClasses();
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // Static summaries for attendance % display (reads MOCK data)
  const staticSummaries = useMemo(() => getStudentClassSummaries(user.id), [user.id]);

  // Dynamic enrolled class IDs from context
  const enrolledClassIds = useMemo(
    () => enrollments.filter((e) => e.user_id === user.id).map((e) => e.class_id),
    [enrollments, user.id]
  );

  // Combined class rows: context enrollment list + static attendance data overlay
  const classRows = useMemo(() => enrolledClassIds.map((cid) => {
    const cls = allClasses.find((c) => c.id === cid);
    const summary = staticSummaries.find((s) => s.kelas.id === cid);
    if (!cls) return null;
    return { kelas: cls, attendance_pct: summary?.attendance_pct ?? 0, is_eligible: summary?.is_eligible ?? false };
  }).filter(Boolean), [enrolledClassIds, allClasses, staticSummaries]);

  // Classes not yet enrolled
  const availableClasses = useMemo(
    () => allClasses.filter((c) => !enrolledClassIds.includes(c.id)),
    [allClasses, enrolledClassIds]
  );
  const filteredAvailable = availableClasses.filter((c) =>
    c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const lastAtt = useMemo(() => {
    const { getStudentAttendanceHistory } = require("@/lib/mockData");
    const hist = getStudentAttendanceHistory(user.id);
    return hist.find((h: { attendance: { status: string } | null }) => h.attendance !== null);
  }, [user.id]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49, backdropFilter: "blur(2px)" }}
      />
      {/* Drawer */}
      <div
        style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 340, zIndex: 50,
          background: "rgba(8,24,20,0.98)", borderLeft: "1px solid rgba(16,185,129,0.2)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.6)", padding: "24px", overflowY: "auto",
          animation: "slide-right 0.25s ease-out" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
              {user.initial}
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4" }}>{user.name}</p>
              <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>NIM {user.nim}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>

        {/* Kelas header + tambah button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", letterSpacing: "0.08em" }}>KELAS YANG DIIKUTI</p>
          <button onClick={() => setShowClassPicker(true)}
            style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#34D399",
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px",
              padding: "3px 9px", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.08)"; }}>
            <Plus size={11} /> Tambah ke Kelas
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {classRows.map((cr) => (
            <div key={cr!.kelas.id} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4" }}>{cr!.kelas.code}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: cr!.is_eligible ? "#34D399" : "#f87171" }}>
                  {cr!.attendance_pct}% {cr!.is_eligible ? "✓" : "⚠"}
                </span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${cr!.attendance_pct}%`, borderRadius: 2,
                  background: cr!.is_eligible ? "#34D399" : "#f87171", transition: "width 0.5s" }} />
              </div>
              <p style={{ fontSize: "10px", color: "rgba(110,231,183,0.35)", marginTop: "4px" }}>{cr!.kelas.name}</p>
            </div>
          ))}
          {classRows.length === 0 && (
            <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.25)", textAlign: "center", padding: "12px 0" }}>
              Belum terdaftar di kelas manapun.
            </p>
          )}
        </div>

        {/* Last attendance */}
        {lastAtt && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", letterSpacing: "0.08em", marginBottom: "10px" }}>ABSENSI TERAKHIR</p>
            <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginBottom: "20px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4" }}>
                {lastAtt.kelas.code} — {lastAtt.session.title}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.5)", marginTop: "3px" }}>
                {new Date(lastAtt.session.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                {lastAtt.attendance?.checked_in_at
                  ? `, ${new Date(lastAtt.attendance.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
                  : ""}
              </p>
            </div>
          </>
        )}

        <button
          onClick={() => { onClose(); router.push(`/dashboard/mahasiswa/${user.id}`); }}
          className="btn-primary rounded-xl"
          style={{ width: "100%", gap: "8px", padding: "11px" }}>
          <ExternalLink size={14} /> Lihat Detail Lengkap
        </button>
      </div>

      {/* Class picker modal (z-index above drawer) */}
      {showClassPicker && (
        <div onClick={(e) => e.target === e.currentTarget && setShowClassPicker(false)}
          style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: 400, borderRadius: "20px", padding: "22px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(16,185,129,0.25)", boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>Tambah ke Kelas</h3>
                <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>{user.name}</p>
              </div>
              <button onClick={() => { setShowClassPicker(false); setPickerSearch(""); }}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={13} />
              </button>
            </div>
            <input className="input-glass" placeholder="Cari nama atau kode kelas..."
              value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} style={{ marginBottom: "10px" }} />
            {availableClasses.length === 0 ? (
              <p style={{ textAlign: "center", color: "rgba(110,231,183,0.4)", fontSize: "13px", padding: "20px 0" }}>
                Sudah terdaftar di semua kelas.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
                {filteredAvailable.map((cls) => (
                  <button key={cls.id}
                    onClick={() => { addEnrollment(cls.id, user.id); setShowClassPicker(false); setPickerSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left", background: "transparent", border: "1px solid rgba(16,185,129,0.1)", color: "#f0fdf4", transition: "all 0.15s", width: "100%" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.1)"; }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{cls.name}</p>
                      <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>{cls.code} · {cls.semester} · {cls.lecturer}</p>
                    </div>
                    <Plus size={14} style={{ color: "#34D399", flexShrink: 0 }} />
                  </button>
                ))}
                {filteredAvailable.length === 0 && (
                  <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(110,231,183,0.3)", padding: "16px" }}>Tidak ada hasil.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes slide-right { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

const USERS_STORAGE_KEY = "presenslab_users_v1";

const EMPTY_FORM = { name: "", email: "", nim: "", role: "mahasiswa" as "mahasiswa" | "dosen" };

/* ── MAIN PAGE ── */
export default function MahasiswaPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "mahasiswa" | "dosen">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [classFilter, setClassFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const [drawerUser, setDrawerUser] = useState<User | null>(null);
  const [addClassForUser, setAddClassForUser] = useState<User | null>(null);
  const [addClassSearch, setAddClassSearch] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState(EMPTY_FORM);
  const [addUserError, setAddUserError] = useState("");
  const [addedUsers, setAddedUsers] = useState<User[]>(() => {
    if (typeof window === "undefined") return [];
    try { const s = localStorage.getItem(USERS_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const { enrollments, addEnrollment } = useEnrollments();
  const { classes: allClasses } = useClasses();

  // All users = mock + newly added
  const allUsers = useMemo(() => [...MOCK_USERS, ...addedUsers], [addedUsers]);

  const addUser = () => {
    const { name, email, nim, role } = addUserForm;
    if (!name.trim() || !email.trim() || !nim.trim()) { setAddUserError("Nama, email, dan NIM wajib diisi."); return; }
    if (allUsers.some((u) => u.nim === nim.trim())) { setAddUserError("NIM sudah terdaftar."); return; }
    if (allUsers.some((u) => u.email === email.trim())) { setAddUserError("Email sudah terdaftar."); return; }
    const initial = name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const newUser: User = { id: `u_${Date.now()}`, name: name.trim(), email: email.trim(), nim: nim.trim(), initial, role, avatar_url: null };
    const next = [...addedUsers, newUser];
    setAddedUsers(next);
    try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
    setAddUserForm(EMPTY_FORM);
    setAddUserError("");
    setShowAddUserModal(false);
  };

  // Map userId → enrolled class IDs (reactive from context)
  const enrolledIdsByUser = useMemo(() => {
    const m = new Map<string, Set<string>>();
    enrollments.forEach((e) => {
      if (!m.has(e.user_id)) m.set(e.user_id, new Set());
      m.get(e.user_id)!.add(e.class_id);
    });
    return m;
  }, [enrollments]);

  // Compute per-user data once
  const userDataMap = useMemo(() => {
    const map = new Map<string, { badges: ReturnType<typeof getStudentClassBadges>; summaries: ReturnType<typeof getStudentClassSummaries>; avgPct: number; lastSeen: string }>();
    allUsers.forEach((u) => {
      const badges = getStudentClassBadges(u.id);
      const summaries = getStudentClassSummaries(u.id);
      const avgPct = summaries.length > 0
        ? Math.round(summaries.reduce((a, s) => a + s.attendance_pct, 0) / summaries.length)
        : 0;
      // Find last attendance date
      const { getStudentAttendanceHistory } = require("@/lib/mockData");
      const hist: { session: { date: string }; attendance: object | null }[] = getStudentAttendanceHistory(u.id);
      const last = hist.find((h) => h.attendance !== null);
      const lastSeen = last ? new Date(last.session.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
      map.set(u.id, { badges, summaries, avgPct, lastSeen });
    });
    return map;
  }, [allUsers]);

  // Low attendance alerts
  const alerts = useMemo(() => getLowAttendanceAlerts(), []);

  // Filter students
  const filtered = useMemo(() =>
    allUsers.filter((u) => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) || u.nim.includes(search);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || (statusFilter === "active");
      const matchClass = classFilter === "all" ||
        (userDataMap.get(u.id)?.badges.some((b) => b.id === classFilter) ?? false);
      return matchSearch && matchRole && matchStatus && matchClass;
    }), [search, roleFilter, statusFilter, classFilter, userDataMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = ["Nama", "Email", "NIM", "Role", "Kelas", "Rata-rata %"];
    const rows = filtered.map((u) => {
      const d = userDataMap.get(u.id)!;
      return [`"${u.name}"`, `"${u.email}"`, `"${u.nim}"`, `"${u.role}"`, `"${d.badges.map((b) => b.code).join(", ")}"`, `"${d.avgPct}%"`];
    });
    const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    Object.assign(document.createElement("a"), { href: url, download: "mahasiswa.csv" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Mahasiswa</h1>
          <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>Manajemen data dan rekap kehadiran per kelas</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "10px 16px" }} onClick={exportCSV}>
            <Download size={14} /> Export
          </button>
          <button className="btn-primary rounded-xl" style={{ gap: "8px", padding: "10px 16px" }}
            onClick={() => { setAddUserForm(EMPTY_FORM); setAddUserError(""); setShowAddUserModal(true); }}>
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>

      {/* Low attendance warning banner */}
      {alerts.length > 0 && (
        <div style={{ padding: "14px 18px", borderRadius: "14px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <AlertTriangle size={15} style={{ color: "#facc15" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#facc15" }}>
              {alerts.length} Mahasiswa Butuh Perhatian — Kehadiran Di Bawah Batas Minimum
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "9px", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(234,179,8,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#facc15", flexShrink: 0 }}>
                  {a.user.initial}
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4", flex: 1 }}>{a.user.name}</span>
                <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>{a.kelas.code}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#f87171" }}>{a.attendance_pct}%</span>
                <span style={{ fontSize: "10px", color: "rgba(110,231,183,0.3)" }}>min. {a.min_pct}%</span>
                <Link href={`/dashboard/mahasiswa/${a.user.id}`} style={{ color: "#facc15", fontSize: "11px", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Lihat &rarr;
                </Link>
              </div>
            ))}
            {alerts.length > 3 && (
              <p style={{ fontSize: "11px", color: "rgba(234,179,8,0.5)", marginTop: "2px" }}>
                + {alerts.length - 3} mahasiswa lainnya di bawah batas minimum
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Mahasiswa", value: allUsers.filter((u) => u.role === "mahasiswa").length, icon: <Users size={15} style={{ color: "#34D399" }} /> },
          { label: "Perlu Perhatian", value: alerts.length, icon: <AlertTriangle size={15} style={{ color: "#facc15" }} /> },
          { label: "Total Kelas", value: allClasses.length, icon: <BookOpen size={15} style={{ color: "#34D399" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.5)" }}>{s.label}</span>
            </div>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(110,231,183,0.3)", pointerEvents: "none" }} />
          <input className="input-glass" style={{ paddingLeft: 36 }} placeholder="Cari nama, email, NIM..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "mahasiswa", "dosen"] as const).map((f) => (
            <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
              style={{ padding: "9px 13px", borderRadius: "10px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                border: roleFilter === f ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(16,185,129,0.12)",
                background: roleFilter === f ? "rgba(16,185,129,0.12)" : "transparent",
                color: roleFilter === f ? "#34D399" : "rgba(110,231,183,0.4)", transition: "all 0.2s" }}>
              {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select className="select-glass" style={{ width: "auto", minWidth: "140px", fontSize: "12px" }}
          value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
          <option value="all">Kelas: Semua</option>
          {MOCK_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select className="select-glass" style={{ width: "auto", minWidth: "120px", fontSize: "12px" }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}>
          <option value="all">Status: Semua</option>
          <option value="active">Aktif</option>
          <option value="inactive">Non-aktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
                {["MAHASISWA", "NIM", "KELAS AKTIF", "KEHADIRAN", "TERAKHIR AKTIF", "STATUS", ""].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "13px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#10B981" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => {
                const d = userDataMap.get(u.id)!;
                return (
                  <tr key={u.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 3px 0 0 #10B981"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                    {/* Name — clickable */}
                    <td style={{ padding: "13px 16px" }}>
                      <Link href={`/dashboard/mahasiswa/${u.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#34D399", flexShrink: 0 }}>{u.initial}</div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{u.name}</p>
                            <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>{u.email}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    {/* NIM */}
                    <td style={{ padding: "13px 16px" }}>
                      <p style={{ fontSize: "12px", color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{u.nim}</p>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "20px",
                        background: u.role === "dosen" ? "rgba(234,179,8,0.12)" : "rgba(16,185,129,0.08)",
                        color: u.role === "dosen" ? "#facc15" : "#34D399", fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                    {/* Kelas Badges */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                        {(() => {
                          const enrolledIds = enrolledIdsByUser.get(u.id) ?? new Set<string>();
                          // Merge static badges + newly added (from context)
                          const staticBadgeIds = new Set(d.badges.map((b) => b.id));
                          const extraClasses = allClasses.filter((c) => enrolledIds.has(c.id) && !staticBadgeIds.has(c.id));
                          const allBadges = [
                            ...d.badges.map((b) => ({ id: b.id, code: b.code })),
                            ...extraClasses.map((c) => ({ id: c.id, code: c.code })),
                          ];
                          return (<>
                            {allBadges.map((b) => (
                              <Link key={b.id} href={`/dashboard/kelas/${b.id}`}
                                style={{ textDecoration: "none", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "rgba(16,185,129,0.08)", color: "#34D399", border: "1px solid rgba(16,185,129,0.15)", whiteSpace: "nowrap" }}>
                                {b.code}
                              </Link>
                            ))}
                            {allBadges.length === 0 && <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.25)" }}>—</span>}
                            {u.role === "mahasiswa" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setAddClassForUser(u); setAddClassSearch(""); }}
                                title="Tambah ke kelas"
                                style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(16,185,129,0.25)", color: "rgba(110,231,183,0.45)", cursor: "pointer", flexShrink: 0, transition: "all 0.15s", padding: 0 }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.12)"; (e.currentTarget as HTMLElement).style.color = "#34D399"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.5)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(110,231,183,0.45)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.25)"; }}>
                                <Plus size={10} />
                              </button>
                            )}
                          </>);
                        })()}
                      </div>
                    </td>
                    {/* Attendance */}
                    <td style={{ padding: "13px 16px", minWidth: "140px" }}>
                      <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginBottom: "5px" }}>
                        {d.summaries.reduce((a, s) => a + s.total_hadir + s.total_telat, 0)}/{d.summaries.reduce((a, s) => a + s.completed_sessions, 0)} sesi
                      </p>
                      <AttBar pct={d.avgPct} />
                    </td>
                    {/* Last seen */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Calendar size={12} style={{ color: "rgba(110,231,183,0.3)" }} />
                        <span style={{ fontSize: "12px", color: "rgba(110,231,183,0.55)" }}>{d.lastSeen}</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px",
                        background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}>
                        Aktif
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        onClick={() => setDrawerUser(u)}
                        style={{ padding: "5px", borderRadius: "8px", color: "rgba(110,231,183,0.4)", background: "transparent", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; (e.currentTarget as HTMLElement).style.color = "#34D399"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(110,231,183,0.4)"; }}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderTop: "1px solid rgba(16,185,129,0.08)" }}>
          <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>
            {filtered.length} mahasiswa · Halaman {page} dari {totalPages}
          </p>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "5px 8px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)", background: "transparent", color: "rgba(110,231,183,0.4)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1 }}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 26, height: 26, borderRadius: "7px", border: "1px solid", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  background: n === page ? "#10B981" : "transparent",
                  color: n === page ? "#fff" : "rgba(110,231,183,0.4)",
                  borderColor: n === page ? "#10B981" : "rgba(16,185,129,0.15)" }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "5px 8px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)", background: "transparent", color: "rgba(110,231,183,0.4)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1 }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Drawer */}
      {drawerUser && <QuickDrawer user={drawerUser} onClose={() => setDrawerUser(null)} />}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div onClick={() => setShowAddUserModal(false)}
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 440, borderRadius: "20px", padding: "24px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(16,185,129,0.25)", boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0fdf4" }}>Tambah Mahasiswa / Dosen</h3>
              <button onClick={() => setShowAddUserModal(false)}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Nama Lengkap *</label>
                <input className="input-glass" placeholder="cth: Budi Santoso" value={addUserForm.name}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Email *</label>
                <input className="input-glass" type="email" placeholder="cth: budi.s@stmik.ac.id" value={addUserForm.email}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>NIM / NIP *</label>
                  <input className="input-glass" placeholder="cth: 2021011" value={addUserForm.nim}
                    onChange={(e) => setAddUserForm((f) => ({ ...f, nim: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(110,231,183,0.5)", marginBottom: "5px" }}>Role *</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["mahasiswa", "dosen"] as const).map((r) => (
                      <button key={r} onClick={() => setAddUserForm((f) => ({ ...f, role: r }))}
                        style={{ flex: 1, padding: "9px 0", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          border: addUserForm.role === r ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(16,185,129,0.12)",
                          background: addUserForm.role === r ? "rgba(16,185,129,0.12)" : "transparent",
                          color: addUserForm.role === r ? "#34D399" : "rgba(110,231,183,0.4)", transition: "all 0.2s" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {addUserError && (
                <p style={{ fontSize: "12px", color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                  {addUserError}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowAddUserModal(false)} className="btn-ghost flex-1 rounded-xl" style={{ padding: "10px" }}>Batal</button>
              <button onClick={addUser} className="btn-primary flex-1 rounded-xl" style={{ gap: "8px", padding: "10px" }}>
                <Plus size={13} /> Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-to-class modal (triggered from + in kelas column) */}
      {addClassForUser && (() => {
        const enrolledIds = enrolledIdsByUser.get(addClassForUser.id) ?? new Set<string>();
        const available = allClasses.filter((c) => !enrolledIds.has(c.id));
        const filtered2 = available.filter((c) =>
          c.name.toLowerCase().includes(addClassSearch.toLowerCase()) ||
          c.code.toLowerCase().includes(addClassSearch.toLowerCase())
        );
        return (
          <div onClick={() => setAddClassForUser(null)}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", padding: "16px" }}>
            <div onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 420, borderRadius: "20px", padding: "22px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(16,185,129,0.25)", boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>Tambah ke Kelas</h3>
                  <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>
                    {addClassForUser.name} · NIM {addClassForUser.nim}
                  </p>
                </div>
                <button onClick={() => setAddClassForUser(null)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={13} />
                </button>
              </div>
              <input className="input-glass" placeholder="Cari nama atau kode kelas..."
                value={addClassSearch} onChange={(e) => setAddClassSearch(e.target.value)}
                style={{ marginBottom: "10px" }} />
              {available.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(110,231,183,0.4)", fontSize: "13px", padding: "20px 0" }}>
                  Sudah terdaftar di semua kelas.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
                  {filtered2.map((cls) => (
                    <button key={cls.id}
                      onClick={() => { addEnrollment(cls.id, addClassForUser.id); setAddClassForUser(null); }}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left", background: "transparent", border: "1px solid rgba(16,185,129,0.1)", color: "#f0fdf4", transition: "all 0.15s", width: "100%" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.28)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.1)"; }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{cls.name}</p>
                        <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>{cls.code} · {cls.semester} · {cls.lecturer}</p>
                      </div>
                      <Plus size={14} style={{ color: "#34D399", flexShrink: 0 }} />
                    </button>
                  ))}
                  {filtered2.length === 0 && (
                    <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(110,231,183,0.3)", padding: "16px" }}>Tidak ada hasil.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
