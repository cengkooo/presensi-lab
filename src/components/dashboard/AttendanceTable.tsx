"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Download, ChevronLeft, ChevronRight, MoreVertical, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassButton } from "@/components/ui/GlassButton";

type Status = "hadir" | "telat" | "absen" | "ditolak";

interface AttendanceRow {
  id: string;
  name: string;
  email: string;
  initial: string;
  session: string;
  lab: string;
  date: string;
  time: string;
  distance: number | null;
  status: Status;
}

const MOCK_DATA: AttendanceRow[] = [
  { id: "1", name: "Jordan Dika", email: "jordan.d@presenslab.com", initial: "JD", session: "Algoritma Lanjut - A1", lab: "Lab Komputer 03", date: "24 Oct 2023", time: "08:15 AM", distance: 18, status: "hadir" },
  { id: "2", name: "Amira Safira", email: "amira.s@presenslab.com", initial: "AS", session: "Basis Data - B2", lab: "Lab Komputer 01", date: "24 Oct 2023", time: "08:35 AM", distance: 45, status: "telat" },
  { id: "3", name: "Budi Waluyo", email: "budi.w@presenslab.com", initial: "BW", session: "Sistem Operasi - C1", lab: "Lab Komputer 05", date: "24 Oct 2023", time: "--:--", distance: null, status: "absen" },
  { id: "4", name: "Cindy Rahma", email: "cindy.r@presenslab.com", initial: "CR", session: "Kecerdasan Buatan - A2", lab: "Lab Riset", date: "24 Oct 2023", time: "08:02 AM", distance: 12, status: "hadir" },
  { id: "5", name: "Deni Susanto", email: "deni.s@presenslab.com", initial: "DS", session: "Jaringan - A3", lab: "Lab Komputer 02", date: "24 Oct 2023", time: "08:55 AM", distance: 87, status: "telat" },
  { id: "6", name: "Eka Putri", email: "eka.p@presenslab.com", initial: "EP", session: "Algoritma Lanjut - A1", lab: "Lab Komputer 03", date: "24 Oct 2023", time: "--:--", distance: null, status: "ditolak" },
  { id: "7", name: "Fajar Nugroho", email: "fajar.n@presenslab.com", initial: "FN", session: "Basis Data - B2", lab: "Lab Komputer 01", date: "24 Oct 2023", time: "08:11 AM", distance: 5, status: "hadir" },
  { id: "8", name: "Gita Lestari", email: "gita.l@presenslab.com", initial: "GL", session: "Sistem Operasi - C1", lab: "Lab Komputer 05", date: "24 Oct 2023", time: "08:48 AM", distance: 67, status: "telat" },
  { id: "9", name: "Hendra Putra", email: "hendra.p@presenslab.com", initial: "HP", session: "Jaringan - A3", lab: "Lab Komputer 02", date: "24 Oct 2023", time: "08:05 AM", distance: 22, status: "hadir" },
  { id: "10", name: "Indi Maharani", email: "indi.m@presenslab.com", initial: "IM", session: "Kecerdasan Buatan - A2", lab: "Lab Riset", date: "24 Oct 2023", time: "--:--", distance: null, status: "absen" },
  { id: "11", name: "Joko Santoso", email: "joko.s@presenslab.com", initial: "JS", session: "Algoritma Lanjut - A1", lab: "Lab Komputer 03", date: "24 Oct 2023", time: "08:20 AM", distance: 31, status: "hadir" },
  { id: "12", name: "Karina Dewi", email: "karina.d@presenslab.com", initial: "KD", session: "Basis Data - B2", lab: "Lab Komputer 01", date: "24 Oct 2023", time: "09:10 AM", distance: 110, status: "ditolak" },
];

const PAGE_SIZE = 10;
const ALL_SESSIONS = ["All Sessions", ...Array.from(new Set(MOCK_DATA.map((d) => d.session)))];
const ALL_STATUSES: string[] = ["All", "hadir", "telat", "absen", "ditolak"];

function exportCSV(data: AttendanceRow[]) {
  const BOM = "\uFEFF";
  const header = ["Nama", "Email", "Sesi", "Tanggal", "Jam Check-in", "Status", "Jarak (meter)"];
  const rows = data.map((r) => [
    `"${r.name}"`,
    `"${r.email}"`,
    `"${r.session}"`,
    `"${r.date}"`,
    `"${r.time}"`,
    `"${r.status}"`,
    `"${r.distance ?? '-'}"`,
  ]);
  const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `absensi_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AttendanceTable() {
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("All Sessions");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_DATA.filter((row) => {
      const matchSearch =
        !search ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase());
      const matchSession =
        sessionFilter === "All Sessions" || row.session === sessionFilter;
      const matchStatus = statusFilter === "All" || row.status === statusFilter;
      return matchSearch && matchSession && matchStatus;
    });
  }, [search, sessionFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPage = (n: number) => setPage(Math.max(1, Math.min(totalPages, n)));

  return (
    <GlassCard className="overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border-glass)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search students, sessions, or ID..."
              className="input-glass pl-9 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <select
                className="select-glass text-sm pr-7 min-w-[130px]"
                value={sessionFilter}
                onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
              >
                {ALL_SESSIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                className="select-glass text-sm pr-7 min-w-[110px]"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>Status: {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors"
              style={{
                border: "1px solid var(--border-glass)",
                color: "var(--text-muted)",
                background: "transparent",
              }}
            >
              <Calendar size={13} /> Date Range
            </button>
            <GlassButton
              variant="primary"
              onClick={() => exportCSV(filtered)}
              className="text-sm px-3 py-2"
            >
              <Download size={13} /> Export CSV
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
              {["STUDENT NAME", "SESSION", "DATE & TIME", "STATUS", "ACTIONS"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-xs font-bold tracking-wider"
                  style={{ color: "var(--green-brand)" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr
                key={row.id}
                className="transition-all group"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.04)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "inset 3px 0 0 var(--green-brand)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Student */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #1e3a1e, #2d5a2d)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        color: "#4ade80",
                      }}
                    >
                      {row.initial}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {row.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {row.email}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Session */}
                <td className="px-5 py-3.5">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {row.session}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {row.lab}
                  </p>
                </td>
                {/* Date & Time */}
                <td className="px-5 py-3.5">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {row.date}
                  </p>
                  <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {row.time}
                    {row.distance !== null && (
                      <span className="ml-2" style={{ color: "var(--text-dim)" }}>
                        · {row.distance}m
                      </span>
                    )}
                  </p>
                </td>
                {/* Status */}
                <td className="px-5 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                {/* Actions */}
                <td className="px-5 py-3.5">
                  <button
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-t"
        style={{ borderColor: "var(--border-glass)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{
              border: "1px solid var(--border-glass)",
              color: "var(--text-muted)",
            }}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .map((n, idx, arr) => (
              <span key={n}>
                {idx > 0 && arr[idx - 1] !== n - 1 && (
                  <span className="px-1 text-xs" style={{ color: "var(--text-muted)" }}>...</span>
                )}
                <button
                  onClick={() => goPage(n)}
                  className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                  style={
                    n === page
                      ? {
                          background: "var(--green-brand)",
                          color: "#fff",
                        }
                      : {
                          color: "var(--text-muted)",
                          border: "1px solid var(--border-glass)",
                        }
                  }
                >
                  {n}
                </button>
              </span>
            ))}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{
              border: "1px solid var(--border-glass)",
              color: "var(--text-muted)",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
