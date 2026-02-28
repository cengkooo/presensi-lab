"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Users, BookOpen, Download, Plus, MoreVertical,
  X, ExternalLink, RefreshCw, GraduationCap,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useClasses } from "@/context/ClassesContext";

const PAGE_SIZE = 10;

interface Profile {
  id: string;
  full_name: string | null;
  nim: string | null;
  avatar_url: string | null;
  role: "mahasiswa" | "dosen" | "admin";
}

interface EnrollmentItem {
  user_id: string;
  class_id: string;
  classes: { id: string; code: string; name: string } | null;
}

interface DrawerEnrollment {
  class_id: string;
  peran: string;
  hadir: number;
  total_sessions: number;
  att_pct: number;
  is_eligible: boolean;
  class_code: string;
  class_name: string;
  min_pct: number;
}

function getInitial(name: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AttBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#34D399" : pct >= 60 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", minWidth: "60px" }}>
        <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color, minWidth: "32px", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

/* ── QUICK DRAWER ─────────────────────────────────────────── */
function QuickDrawer({
  user,
  onClose,
  onEnrollSuccess,
}: {
  user: Profile;
  onClose: () => void;
  onEnrollSuccess: () => void;
}) {
  const router = useRouter();
  const { classes: allClasses } = useClasses();
  const [enrollments, setEnrollments] = useState<DrawerEnrollment[]>([]);
  const [loadingEnroll, setLoadingEnroll] = useState(true);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setLoadingEnroll(true);
    const supabase = createSupabaseBrowserClient();

    const [enrollRes, attRes] = await Promise.all([
      supabase
        .from("enrollments")
        .select("class_id, peran, classes(id, code, name, min_attendance_pct, total_sessions_planned)")
        .eq("user_id", user.id),
      supabase
        .from("attendance")
        .select("status, sessions!inner(class_id)")
        .eq("user_id", user.id)
        .in("status", ["hadir", "telat"]),
    ]);

    const rows = enrollRes.data ?? [];
    const attRows = attRes.data ?? [];

    const hadirByClass = new Map<string, number>();
    for (const a of attRows) {
      const cid = (a.sessions as unknown as { class_id: string })?.class_id;
      if (cid) hadirByClass.set(cid, (hadirByClass.get(cid) ?? 0) + 1);
    }

    const result: DrawerEnrollment[] = rows.map((row) => {
      const cls = row.classes as unknown as {
        id: string; code: string; name: string;
        min_attendance_pct: number; total_sessions_planned: number;
      } | null;
      const hadir = hadirByClass.get(row.class_id) ?? 0;
      const total = cls?.total_sessions_planned ?? 1;
      const pct = Math.round((hadir / total) * 100);
      return {
        class_id: row.class_id,
        peran: row.peran,
        hadir,
        total_sessions: total,
        att_pct: pct,
        is_eligible: pct >= (cls?.min_attendance_pct ?? 75),
        class_code: cls?.code ?? "—",
        class_name: cls?.name ?? "—",
        min_pct: cls?.min_attendance_pct ?? 75,
      };
    });

    setEnrollments(result);
    setLoadingEnroll(false);
  }, [user.id]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const enrolledClassIds = useMemo(() => new Set(enrollments.map((e) => e.class_id)), [enrollments]);
  const availableClasses = useMemo(
    () => allClasses.filter((c) => !enrolledClassIds.has(c.id)),
    [allClasses, enrolledClassIds]
  );
  const filteredAvailable = availableClasses.filter(
    (c) =>
      c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handleEnroll = async (classId: string) => {
    setEnrolling(classId);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("enrollments").insert({ class_id: classId, user_id: user.id, peran: "mahasiswa" });
    setEnrolling(null);
    setShowClassPicker(false);
    setPickerSearch("");
    await fetchEnrollments();
    onEnrollSuccess();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49, backdropFilter: "blur(2px)" }}
      />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 340, zIndex: 50, background: "rgba(8,24,20,0.98)", borderLeft: "1px solid rgba(16,185,129,0.2)", boxShadow: "-20px 0 60px rgba(0,0,0,0.6)", padding: "24px", overflowY: "auto", animation: "slide-right 0.25s ease-out" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
              {getInitial(user.full_name)}
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#f0fdf4" }}>{user.full_name ?? "—"}</p>
              <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>NIM {user.nim ?? "—"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Kelas section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", letterSpacing: "0.08em" }}>KELAS YANG DIIKUTI</p>
          {user.role === "mahasiswa" && (
            <button
              onClick={() => setShowClassPicker(true)}
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#34D399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "3px 9px", cursor: "pointer" }}
            >
              <Plus size={11} /> Tambah ke Kelas
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {loadingEnroll && (
            <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.3)", textAlign: "center", padding: "12px 0" }}>Memuat...</p>
          )}
          {!loadingEnroll && enrollments.length === 0 && (
            <p style={{ fontSize: "12px", color: "rgba(110,231,183,0.25)", textAlign: "center", padding: "12px 0" }}>
              Belum terdaftar di kelas manapun.
            </p>
          )}
          {enrollments.map((enr) => (
            <div key={enr.class_id} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4" }}>{enr.class_code}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: enr.is_eligible ? "#34D399" : "#f87171" }}>
                  {enr.att_pct}% {enr.is_eligible ? "✓" : "⚠"}
                </span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${Math.min(100, enr.att_pct)}%`, borderRadius: 2, background: enr.is_eligible ? "#34D399" : "#f87171", transition: "width 0.5s" }} />
              </div>
              <p style={{ fontSize: "10px", color: "rgba(110,231,183,0.35)", marginTop: "4px" }}>{enr.class_name}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => { onClose(); router.push(`/dashboard/mahasiswa/${user.id}`); }}
          className="btn-primary rounded-xl"
          style={{ width: "100%", gap: "8px", padding: "11px" }}
        >
          <ExternalLink size={14} /> Lihat Detail Lengkap
        </button>
      </div>

      {/* Class picker modal */}
      {showClassPicker && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowClassPicker(false)}
          style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "16px" }}
        >
          <div style={{ width: "100%", maxWidth: 400, borderRadius: "20px", padding: "22px", background: "rgba(8,24,20,0.99)", border: "1px solid rgba(16,185,129,0.25)", boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>Tambah ke Kelas</h3>
                <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>{user.full_name}</p>
              </div>
              <button
                onClick={() => { setShowClassPicker(false); setPickerSearch(""); }}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(110,231,183,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={13} />
              </button>
            </div>
            <input
              className="input-glass"
              placeholder="Cari nama atau kode kelas..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            {availableClasses.length === 0 ? (
              <p style={{ textAlign: "center", color: "rgba(110,231,183,0.4)", fontSize: "13px", padding: "20px 0" }}>
                Sudah terdaftar di semua kelas.
              </p>
            ) : filteredAvailable.length === 0 ? (
              <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(110,231,183,0.3)", padding: "16px" }}>Tidak ada hasil.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
                {filteredAvailable.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => handleEnroll(cls.id)}
                    disabled={enrolling === cls.id}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left", background: "transparent", border: "1px solid rgba(16,185,129,0.1)", color: "#f0fdf4", transition: "all 0.15s", width: "100%", opacity: enrolling === cls.id ? 0.5 : 1 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{cls.name}</p>
                      <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)" }}>{cls.code}</p>
                    </div>
                    {enrolling === cls.id ? (
                      <RefreshCw size={14} style={{ color: "#34D399", flexShrink: 0, animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Plus size={14} style={{ color: "#34D399", flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────── */
export default function MahasiswaPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "mahasiswa" | "dosen">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [drawerUser, setDrawerUser] = useState<Profile | null>(null);

  const { classes: allClasses } = useClasses();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    const [profRes, enrollRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, nim, avatar_url, role")
        .in("role", ["mahasiswa", "dosen"])
        .order("full_name", { ascending: true }),
      supabase
        .from("enrollments")
        .select("user_id, class_id, classes(id, code, name)"),
    ]);

    setProfiles((profRes.data as Profile[]) ?? []);
    setEnrollments((enrollRes.data as unknown as EnrollmentItem[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build user_id -> class badge list
  const badgesByUser = useMemo(() => {
    const map = new Map<string, { id: string; code: string }[]>();
    for (const e of enrollments) {
      if (!e.classes) continue;
      if (!map.has(e.user_id)) map.set(e.user_id, []);
      map.get(e.user_id)!.push({
        id: e.class_id,
        code: (e.classes as unknown as { id: string; code: string }).code,
      });
    }
    return map;
  }, [enrollments]);

  const filtered = useMemo(
    () =>
      profiles.filter((u) => {
        const matchSearch =
          !search ||
          (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (u.nim ?? "").includes(search);
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const matchClass =
          classFilter === "all" ||
          (badgesByUser.get(u.id)?.some((b) => b.id === classFilter) ?? false);
        return matchSearch && matchRole && matchClass;
      }),
    [profiles, search, roleFilter, classFilter, badgesByUser]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      totalMahasiswa: profiles.filter((p) => p.role === "mahasiswa").length,
      totalDosen: profiles.filter((p) => p.role === "dosen").length,
      totalKelas: allClasses.length,
    }),
    [profiles, allClasses]
  );

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = ["Nama", "NIM", "Role", "Kelas"];
    const rows = filtered.map((u) => {
      const badges = badgesByUser.get(u.id) ?? [];
      return [
        `"${u.full_name ?? ""}"`,
        `"${u.nim ?? ""}"`,
        `"${u.role}"`,
        `"${badges.map((b) => b.code).join(", ")}"`,
      ];
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
          <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Mahasiswa & Dosen</h1>
          <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>
            Manajemen pengguna dan rekap kehadiran per kelas
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={fetchData} className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "10px 14px" }} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "10px 16px" }} onClick={exportCSV}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Mahasiswa", value: stats.totalMahasiswa, icon: <GraduationCap size={15} style={{ color: "#34D399" }} /> },
          { label: "Total Dosen", value: stats.totalDosen, icon: <Users size={15} style={{ color: "#34D399" }} /> },
          { label: "Total Kelas", value: stats.totalKelas, icon: <BookOpen size={15} style={{ color: "#34D399" }} /> },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </div>
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
          <input
            className="input-glass"
            style={{ paddingLeft: 36 }}
            placeholder="Cari nama atau NIM..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "mahasiswa", "dosen"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setRoleFilter(f); setPage(1); }}
              style={{
                padding: "9px 13px", borderRadius: "10px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                border: roleFilter === f ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(16,185,129,0.12)",
                background: roleFilter === f ? "rgba(16,185,129,0.12)" : "transparent",
                color: roleFilter === f ? "#34D399" : "rgba(110,231,183,0.4)", transition: "all 0.2s",
              }}
            >
              {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="select-glass"
          style={{ width: "auto", minWidth: "160px", fontSize: "12px" }}
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Kelas: Semua</option>
          {allClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
                {["PENGGUNA", "NIM / NIP", "KELAS AKTIF", "ROLE", ""].map((col) => (
                  <th
                    key={col}
                    style={{ textAlign: "left", padding: "13px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#10B981" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "rgba(110,231,183,0.4)", fontSize: "13px" }}>
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "rgba(110,231,183,0.4)", fontSize: "13px" }}>
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
              {paginated.map((u) => {
                const badges = badgesByUser.get(u.id) ?? [];
                return (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "all 0.15s" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.04)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "inset 3px 0 0 #10B981";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <Link href={`/dashboard/mahasiswa/${u.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#34D399", flexShrink: 0 }}>
                            {getInitial(u.full_name)}
                          </div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{u.full_name ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <p style={{ fontSize: "12px", color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{u.nim ?? "—"}</p>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                        {badges.map((b) => (
                          <Link
                            key={b.id}
                            href={`/dashboard/kelas/${b.id}`}
                            style={{ textDecoration: "none", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "rgba(16,185,129,0.08)", color: "#34D399", border: "1px solid rgba(16,185,129,0.15)", whiteSpace: "nowrap" }}
                          >
                            {b.code}
                          </Link>
                        ))}
                        {badges.length === 0 && (
                          <span style={{ fontSize: "11px", color: "rgba(110,231,183,0.25)" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{
                        fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                        background: u.role === "dosen" ? "rgba(234,179,8,0.12)" : "rgba(16,185,129,0.08)",
                        color: u.role === "dosen" ? "#facc15" : "#34D399",
                        border: `1px solid ${u.role === "dosen" ? "rgba(234,179,8,0.25)" : "rgba(16,185,129,0.2)"}`,
                        fontWeight: 600,
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        onClick={() => setDrawerUser(u)}
                        style={{ padding: "5px", borderRadius: "8px", color: "rgba(110,231,183,0.4)", background: "transparent", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; (e.currentTarget as HTMLElement).style.color = "#34D399"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(110,231,183,0.4)"; }}
                      >
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
            {filtered.length} pengguna · Halaman {page} dari {totalPages}
          </p>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)", background: "transparent", color: "rgba(110,231,183,0.4)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1, fontSize: "14px" }}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{ width: 26, height: 26, borderRadius: "7px", border: "1px solid", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  background: n === page ? "#10B981" : "transparent",
                  color: n === page ? "#fff" : "rgba(110,231,183,0.4)",
                  borderColor: n === page ? "#10B981" : "rgba(16,185,129,0.15)" }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)", background: "transparent", color: "rgba(110,231,183,0.4)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1, fontSize: "14px" }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Quick Drawer */}
      {drawerUser && (
        <QuickDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onEnrollSuccess={fetchData}
        />
      )}
    </div>
  );
}
