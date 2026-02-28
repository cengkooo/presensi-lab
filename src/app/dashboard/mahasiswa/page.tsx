"use client";

import { useState, useMemo } from "react";
import {
  Search, Users, UserCheck,
  ChevronLeft, ChevronRight, BarChart3,
  Download, Plus, MoreVertical, Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

/* ── TYPES ── */
interface Student {
  id: string;
  name: string;
  email: string;
  nim: string;
  initial: string;
  role: "mahasiswa" | "dosen";
  status: "active" | "inactive";
  totalSessions: number;
  attended: number;
  lastSeen: string;
}

/* ── MOCK DATA ── */
const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "Jordan Dika", email: "jordan.d@presenslab.com", nim: "2021001", initial: "JD", role: "mahasiswa", status: "active", totalSessions: 24, attended: 22, lastSeen: "28 Feb 2026" },
  { id: "2", name: "Amira Safira", email: "amira.s@presenslab.com", nim: "2021002", initial: "AS", role: "mahasiswa", status: "active", totalSessions: 24, attended: 20, lastSeen: "28 Feb 2026" },
  { id: "3", name: "Budi Waluyo", email: "budi.w@presenslab.com", nim: "2021003", initial: "BW", role: "mahasiswa", status: "inactive", totalSessions: 24, attended: 6, lastSeen: "10 Feb 2026" },
  { id: "4", name: "Cindy Rahma", email: "cindy.r@presenslab.com", nim: "2021004", initial: "CR", role: "mahasiswa", status: "active", totalSessions: 24, attended: 24, lastSeen: "28 Feb 2026" },
  { id: "5", name: "Deni Susanto", email: "deni.s@presenslab.com", nim: "2021005", initial: "DS", role: "mahasiswa", status: "active", totalSessions: 24, attended: 18, lastSeen: "27 Feb 2026" },
  { id: "6", name: "Eka Putri", email: "eka.p@presenslab.com", nim: "2021006", initial: "EP", role: "mahasiswa", status: "active", totalSessions: 24, attended: 21, lastSeen: "28 Feb 2026" },
  { id: "7", name: "Fajar Nugroho", email: "fajar.n@presenslab.com", nim: "2021007", initial: "FN", role: "mahasiswa", status: "active", totalSessions: 24, attended: 23, lastSeen: "28 Feb 2026" },
  { id: "8", name: "Gita Lestari", email: "gita.l@presenslab.com", nim: "2021008", initial: "GL", role: "mahasiswa", status: "active", totalSessions: 24, attended: 19, lastSeen: "26 Feb 2026" },
  { id: "9", name: "Hendra Putra", email: "hendra.p@presenslab.com", nim: "2021009", initial: "HP", role: "mahasiswa", status: "active", totalSessions: 24, attended: 22, lastSeen: "28 Feb 2026" },
  { id: "10", name: "Indi Maharani", email: "indi.m@presenslab.com", nim: "2021010", initial: "IM", role: "mahasiswa", status: "inactive", totalSessions: 24, attended: 4, lastSeen: "05 Feb 2026" },
  { id: "11", name: "Joko Santoso", email: "joko.s@presenslab.com", nim: "2021011", initial: "JS", role: "mahasiswa", status: "active", totalSessions: 24, attended: 20, lastSeen: "27 Feb 2026" },
  { id: "12", name: "Alex Rivera", email: "alex.r@presenslab.com", nim: "D001", initial: "AR", role: "dosen", status: "active", totalSessions: 24, attended: 24, lastSeen: "28 Feb 2026" },
];

const PAGE_SIZE = 8;

function AttendanceBadge({ attended, total }: { attended: number; total: number }) {
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
  const color = pct >= 80 ? "#4ade80" : pct >= 60 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", minWidth: "60px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color, minWidth: "32px", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

export default function MahasiswaPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "mahasiswa" | "dosen">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    MOCK_STUDENTS.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) || s.nim.includes(search);
      const matchRole = roleFilter === "all" || s.role === roleFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    }), [search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: MOCK_STUDENTS.filter((s) => s.role === "mahasiswa").length,
    active: MOCK_STUDENTS.filter((s) => s.role === "mahasiswa" && s.status === "active").length,
    avgAttendance: Math.round(
      MOCK_STUDENTS.filter((s) => s.role === "mahasiswa")
        .reduce((a, s) => a + (s.attended / s.totalSessions) * 100, 0) /
      MOCK_STUDENTS.filter((s) => s.role === "mahasiswa").length
    ),
  };

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = ["Nama", "Email", "NIM", "Role", "Status", "Total Sesi", "Hadir", "% Kehadiran"];
    const rows = filtered.map((s) => [
      `"${s.name}"`, `"${s.email}"`, `"${s.nim}"`, `"${s.role}"`, `"${s.status}"`,
      `"${s.totalSessions}"`, `"${s.attended}"`, `"${Math.round((s.attended / s.totalSessions) * 100)}%"`,
    ]);
    const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    Object.assign(document.createElement("a"), { href: url, download: `mahasiswa_${new Date().toISOString().split("T")[0]}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Mahasiswa</h1>
          <p style={{ color: "rgba(134,239,172,0.5)", fontSize: "14px", marginTop: "6px" }}>Manajemen data mahasiswa dan kehadiran</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-ghost rounded-xl" style={{ gap: "8px", padding: "10px 16px" }} onClick={exportCSV}>
            <Download size={14} /> Export
          </button>
          <button className="btn-primary rounded-xl" style={{ gap: "8px", padding: "10px 16px", flexShrink: 0 }}>
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Mahasiswa", value: stats.total, icon: <Users size={16} style={{ color: "#4ade80" }} /> },
          { label: "Aktif", value: stats.active, icon: <UserCheck size={16} style={{ color: "#4ade80" }} /> },
          { label: "Rata-rata Kehadiran", value: `${stats.avgAttendance}%`, icon: <BarChart3 size={16} style={{ color: "#4ade80" }} /> },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
              <span style={{ fontSize: "12px", color: "rgba(134,239,172,0.5)" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(134,239,172,0.3)", pointerEvents: "none" }} />
          <input className="input-glass" style={{ paddingLeft: 36 }} placeholder="Cari nama, email, atau NIM..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["all", "mahasiswa", "dosen"] as const).map((f) => (
            <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
              style={{
                padding: "9px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                border: roleFilter === f ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(34,197,94,0.12)",
                background: roleFilter === f ? "rgba(34,197,94,0.12)" : "transparent",
                color: roleFilter === f ? "#4ade80" : "rgba(134,239,172,0.4)", transition: "all 0.2s",
              }}>
              {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select className="select-glass" style={{ width: "auto", minWidth: "120px" }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}>
          <option value="all">Status: Semua</option>
          <option value="active">Aktif</option>
          <option value="inactive">Non-aktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                {["MAHASISWA", "NIM / ROLE", "KEHADIRAN", "TERAKHIR AKTIF", "STATUS", ""].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "14px 20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#22c55e" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 3px 0 0 #22c55e"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  {/* Name */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a1e,#2d5a2d)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{s.initial}</div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4" }}>{s.name}</p>
                        <p style={{ fontSize: "12px", color: "rgba(134,239,172,0.4)" }}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* NIM */}
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#f0fdf4", fontVariantNumeric: "tabular-nums" }}>{s.nim}</p>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: s.role === "dosen" ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.08)", color: s.role === "dosen" ? "#facc15" : "#4ade80", fontWeight: 600 }}>
                      {s.role}
                    </span>
                  </td>
                  {/* Attendance */}
                  <td style={{ padding: "14px 20px", minWidth: "140px" }}>
                    <p style={{ fontSize: "12px", color: "rgba(134,239,172,0.4)", marginBottom: "6px" }}>{s.attended}/{s.totalSessions} sesi</p>
                    <AttendanceBadge attended={s.attended} total={s.totalSessions} />
                  </td>
                  {/* Last seen */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={12} style={{ color: "rgba(134,239,172,0.3)" }} />
                      <span style={{ fontSize: "13px", color: "rgba(134,239,172,0.55)" }}>{s.lastSeen}</span>
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px",
                      background: s.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                      color: s.status === "active" ? "#4ade80" : "#f87171",
                      border: s.status === "active" ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)",
                    }}>
                      {s.status === "active" ? "Aktif" : "Non-aktif"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <button style={{ padding: "6px", borderRadius: "8px", color: "rgba(134,239,172,0.4)", background: "transparent", border: "none", cursor: "pointer" }}>
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid rgba(34,197,94,0.08)" }}>
          <p style={{ fontSize: "12px", color: "rgba(134,239,172,0.4)" }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.15)", background: "transparent", color: "rgba(134,239,172,0.4)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.3 : 1 }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 28, height: 28, borderRadius: "8px", border: "1px solid", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  background: n === page ? "#22c55e" : "transparent",
                  color: n === page ? "#fff" : "rgba(134,239,172,0.4)",
                  borderColor: n === page ? "#22c55e" : "rgba(34,197,94,0.15)" }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.15)", background: "transparent", color: "rgba(134,239,172,0.4)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.3 : 1 }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
