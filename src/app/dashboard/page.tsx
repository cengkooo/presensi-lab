"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, BarChart3, Clock, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ActivateAttendance } from "@/components/dashboard/ActivateAttendance";
import { LiveAttendanceList } from "@/components/dashboard/LiveAttendanceList";
import { AttendanceTable } from "@/components/dashboard/AttendanceTable";
import { SessionManager } from "@/components/dashboard/SessionManager";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type ActivateState = "idle" | "active" | "expired";

type DashStats = {
  totalSesi: number;
  mahasiswaCount: number;
  avgPct: number;
  hariIni: number;
};

function useDashStats() {
  const [stats, setStats]   = useState<DashStats>({ totalSesi: 0, mahasiswaCount: 0, avgPct: 0, hariIni: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const today = new Date().toISOString().split("T")[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    Promise.all([
      // Total sessions
      sb.from("sessions").select("id", { count: "exact", head: true }),
      // Mahasiswa count
      sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "mahasiswa"),
      // Attendance: hadir or telat
      sb.from("attendance").select("status") as Promise<{ data: { status: string }[] | null }>,
      // Sessions today
      sb.from("sessions").select("id", { count: "exact", head: true }).eq("session_date", today),
    ]).then(([sesi, mhs, atts, hariIni]: [{ count: number | null }, { count: number | null }, { data: { status: string }[] | null }, { count: number | null }]) => {
      const totalAtt = atts.data?.length ?? 0;
      const hadirAtt = atts.data?.filter((a) => a.status === "hadir" || a.status === "telat").length ?? 0;
      setStats({
        totalSesi:     sesi.count ?? 0,
        mahasiswaCount:mhs.count ?? 0,
        avgPct:        totalAtt > 0 ? Math.round((hadirAtt / totalAtt) * 100) : 0,
        hariIni:       hariIni.count ?? 0,
      });
    }).catch(() => {/* silent */}).finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}


export default function DashboardPage() {
  const [activateState, setActivateState] = useState<ActivateState>("idle");
  const [activeSessId,  setActiveSessId]  = useState<string | null>(null);
  const { toasts, toast, dismissToast } = useToast();
  const { stats } = useDashStats();
  const { profile } = useSupabaseSession();

  const role    = profile?.role ?? "mahasiswa";
  const isStaff = role === "dosen" || role === "asisten" || role === "admin";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 32px 48px 32px",
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              color: "#f0fdf4",
              fontSize: "28px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            Dashboard Overview
          </h1>
          <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>
            Monitoring live practicum attendance and session performance
          </p>
        </div>
        <button
          onClick={() => toast.success("Gunakan panel Manajemen Sesi di bawah.")}
          style={{
            display: isStaff ? "flex" : "none",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #059669, #10B981)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(16,185,129,0.3)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <Plus size={15} /> New Session
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
        className="stat-grid"
      >
        <StatCard icon={<Calendar size={18} style={{ color: "#34D399" }} />} label="Total Sesi" value={String(stats.totalSesi)} trend={5} />
        <StatCard icon={<Users size={18} style={{ color: "#34D399" }} />} label="Mahasiswa" value={String(stats.mahasiswaCount)} trend={2} />
        <StatCard icon={<BarChart3 size={18} style={{ color: stats.avgPct >= 70 ? "#34D399" : "#f87171" }} />} label="Rata-rata %" value={`${stats.avgPct}%`} trend={-1} />
        <StatCard icon={<Clock size={18} style={{ color: "#34D399" }} />} label="Hari Ini" value={String(stats.hariIni)} trend={8} />
      </div>

      {/* ── ACTIVATE + LIVE FEED (staff only) ── */}
      {isStaff && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
          className="two-col-grid"
        >
          <ActivateAttendance
            onStateChange={(s, sid) => {
              setActivateState(s);
              setActiveSessId(sid ?? null);
              if (s === "active") toast.success("Sesi absensi berhasil diaktifkan!");
              if (s === "expired") toast.warning("Sesi absensi telah berakhir.");
            }}
          />
          <LiveAttendanceList isActive={activateState === "active"} sessionId={activeSessId} />
        </div>
      )}

      {/* ── SESSION MANAGER (staff only) ── */}
      {isStaff && (
        <div style={{ marginBottom: "24px" }}>
          <SessionManager />
        </div>
      )}

      {/* ── ATTENDANCE TABLE ── */}
      <div>
        <div style={{ marginBottom: "12px" }}>
          <h2 style={{ color: "#f0fdf4", fontSize: "15px", fontWeight: 700 }}>
            Riwayat Absensi
          </h2>
          <p style={{ color: "rgba(110,231,183,0.4)", fontSize: "12px", marginTop: "4px" }}>
            Semua data kehadiran mahasiswa
          </p>
        </div>
        <AttendanceTable />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Responsive grid breakpoints */}
      <style>{`
        @media (max-width: 1024px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
