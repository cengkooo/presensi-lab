"use client";

import { useState } from "react";
import { Calendar, Users, BarChart3, Clock, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivateAttendance } from "@/components/dashboard/ActivateAttendance";
import { LiveAttendanceList } from "@/components/dashboard/LiveAttendanceList";
import { AttendanceTable } from "@/components/dashboard/AttendanceTable";
import { SessionManager } from "@/components/dashboard/SessionManager";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

type ActivateState = "idle" | "active" | "expired";

export default function DashboardPage() {
  const [activateState, setActivateState] = useState<ActivateState>("idle");
  const { toasts, toast, dismissToast } = useToast();

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
          <p style={{ color: "rgba(134,239,172,0.5)", fontSize: "14px", marginTop: "6px" }}>
            Monitoring live practicum attendance and session performance
          </p>
        </div>
        <button
          onClick={() => toast.success("Gunakan panel Manajemen Sesi di bawah.")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #15803d, #22c55e)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(34,197,94,0.3)",
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
        <StatCard icon={<Calendar size={18} style={{ color: "#4ade80" }} />} label="Total Sesi" value="124" trend={5} />
        <StatCard icon={<Users size={18} style={{ color: "#4ade80" }} />} label="Mahasiswa" value="850" trend={2} />
        <StatCard icon={<BarChart3 size={18} style={{ color: "#f87171" }} />} label="Rata-rata %" value="92%" trend={-1} />
        <StatCard icon={<Clock size={18} style={{ color: "#4ade80" }} />} label="Hari Ini" value="12" trend={8} />
      </div>

      {/* ── ACTIVATE + LIVE FEED ── */}
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
          onStateChange={(s) => {
            setActivateState(s);
            if (s === "active") toast.success("Sesi absensi berhasil diaktifkan!");
            if (s === "expired") toast.warning("Sesi absensi telah berakhir.");
          }}
        />
        <LiveAttendanceList isActive={activateState === "active"} />
      </div>

      {/* ── SESSION MANAGER ── */}
      <div style={{ marginBottom: "24px" }}>
        <SessionManager />
      </div>

      {/* ── ATTENDANCE TABLE ── */}
      <div>
        <div style={{ marginBottom: "12px" }}>
          <h2 style={{ color: "#f0fdf4", fontSize: "15px", fontWeight: 700 }}>
            Riwayat Absensi
          </h2>
          <p style={{ color: "rgba(134,239,172,0.4)", fontSize: "12px", marginTop: "4px" }}>
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
