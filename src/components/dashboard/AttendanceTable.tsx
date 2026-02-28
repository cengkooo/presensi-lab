"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Download, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AttendanceStatus } from "@/types";

type Status = AttendanceStatus;

interface AttendanceRow {
  id: string;
  name: string;
  email: string;
  nim: string;
  initial: string;
  sessionTitle: string;
  classCode: string;
  className: string;
  lab: string;
  date: string;
  time: string;
  distance: number | null;
  status: Status;
}

const PAGE_SIZE = 10;
const ALL_STATUSES: string[] = ["Semua Status", "hadir", "telat", "absen", "ditolak"];

function exportCSV(data: AttendanceRow[]) {
  const BOM = "\uFEFF";
  const header = ["Nama", "NIM", "Email", "Sesi", "Kelas", "Tanggal", "Jam Check-in", "Status", "Jarak (meter)"];
  const rows = data.map((r) => [
    `"${r.name}"`, `"${r.nim}"`, `"${r.email}"`,
    `"${r.sessionTitle}"`, `"${r.classCode} — ${r.className}"`,
    `"${r.date}"`, `"${r.time}"`, `"${r.status}"`, `"${r.distance ?? "-"}"`,
  ]);
  const csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  Object.assign(document.createElement("a"), { href: url, download: `absensi_${new Date().toISOString().split("T")[0]}.csv` }).click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(att: any): AttendanceRow | null {
  if (!att.profiles || !att.sessions || !att.sessions.classes) return null;
  return {
    id:           att.id,
    name:         att.profiles.full_name ?? att.profiles.id.slice(0, 8),
    email:        att.profiles.email ?? "",
    nim:          att.profiles.nim ?? "",
    initial:      (att.profiles.full_name ?? "U").split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
    sessionTitle: att.sessions.title,
    classCode:    att.sessions.classes.code,
    className:    att.sessions.classes.name,
    lab:          att.sessions.location ?? "",
    date:         att.sessions.session_date ?? att.checked_in_at?.split("T")[0] ?? "",
    time:         att.checked_in_at
      ? new Date(att.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "--:--",
    distance:     att.distance_meter ?? null,
    status:       att.status as Status,
  };
}

export function AttendanceTable() {
  const [rows, setRows]         = useState<AttendanceRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [classCodes, setClassCodes] = useState<string[]>([]);
  const [search, setSearch]         = useState("");
  const [classFilter, setClassFilter] = useState("Semua Kelas");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [page, setPage]     = useState(1);

  useEffect(() => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Promise.resolve((supabase as any)
      .from("attendance")
      .select(`
        id, status, checked_in_at, distance_meter,
        profiles ( id, full_name, nim ),
        sessions ( id, title, location, session_date, classes ( id, code, name ) )
      `)
      .order("checked_in_at", { ascending: false })
      .limit(500)
    ).then(({ data }: { data: unknown[] | null }) => {
        if (data) {
          const mapped = data.map(mapRow).filter(Boolean) as AttendanceRow[];
          setRows(mapped);
          // Extract unique class codes for filter dropdown
          const codes = [...new Set(mapped.map((r) => r.classCode))].sort();
          setClassCodes(codes);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ALL_CLASSES = useMemo(() => ["Semua Kelas", ...classCodes], [classCodes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const matchSearch = !search ||
        row.name.toLowerCase().includes(q) ||
        row.nim.includes(search) ||
        row.email.toLowerCase().includes(q);
      const matchClass  = classFilter === "Semua Kelas" || row.classCode === classFilter;
      const matchStatus = statusFilter === "Semua Status" || row.status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [rows, search, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              placeholder="Cari nama, NIM, atau email..."
              className="input-glass pl-9 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select className="select-glass text-sm min-w-[130px]" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
              {ALL_CLASSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select-glass text-sm min-w-[130px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12">
          <LoadingSpinner size="md" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Memuat data absensi...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Belum ada data absensi.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                  {["MAHASISWA", "SESI", "TANGGAL & JAM", "STATUS", ""].map((col) => (
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
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.04)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "inset 3px 0 0 var(--green-brand)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Mahasiswa */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #1e3a1e, #2d5a2d)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            color: "#34D399",
                          }}
                        >
                          {row.initial}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{row.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{row.nim}</p>
                        </div>
                      </div>
                    </td>
                    {/* Sesi */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{row.sessionTitle}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{row.classCode} · {row.lab}</p>
                    </td>
                    {/* Tanggal & Jam */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {row.date ? new Date(row.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </p>
                      <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {row.time}
                        {row.distance !== null && (
                          <span className="ml-2" style={{ color: "var(--text-dim)" }}>· {row.distance}m</span>
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
              {filtered.length === 0 ? "0 data" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} dari ${filtered.length} rekaman`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ border: "1px solid var(--border-glass)", color: "var(--text-muted)" }}
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
                          ? { background: "var(--green-brand)", color: "#fff" }
                          : { color: "var(--text-muted)", border: "1px solid var(--border-glass)" }
                      }
                    >{n}</button>
                  </span>
                ))}
              <button
                onClick={() => goPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ border: "1px solid var(--border-glass)", color: "var(--text-muted)" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
