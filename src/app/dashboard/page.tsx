"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  BarChart3,
  Clock,
  Plus,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivateAttendance } from "@/components/dashboard/ActivateAttendance";
import { LiveAttendanceList } from "@/components/dashboard/LiveAttendanceList";
import { AttendanceTable } from "@/components/dashboard/AttendanceTable";
import { SessionManager } from "@/components/dashboard/SessionManager";
import { GlassButton } from "@/components/ui/GlassButton";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

type ActivateState = "idle" | "active" | "expired";

export default function DashboardPage() {
  const [activateState, setActivateState] = useState<ActivateState>("idle");
  const { toasts, toast, dismissToast } = useToast();

  const handleActivateStateChange = (state: ActivateState) => {
    setActivateState(state);
    if (state === "active") {
      toast.success("Sesi absensi berhasil diaktifkan!");
    } else if (state === "expired") {
      toast.warning("Sesi absensi telah berakhir.");
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Dashboard Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Monitoring live practicum attendance and session performance
          </p>
        </div>
        <GlassButton
          variant="primary"
          className="hidden sm:flex gap-2 px-4 py-2.5 rounded-xl text-sm"
          onClick={() => toast.success("Fitur buat sesi tersedia di panel Manajemen Sesi di bawah.")}
        >
          <Plus size={15} /> New Session
        </GlassButton>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Calendar size={18} style={{ color: "var(--green-brand)" }} />}
          label="Total Sesi"
          value="124"
          trend={5}
        />
        <StatCard
          icon={<Users size={18} style={{ color: "var(--green-brand)" }} />}
          label="Mahasiswa"
          value="850"
          trend={2}
        />
        <StatCard
          icon={<BarChart3 size={18} style={{ color: "#f87171" }} />}
          label="Rata-rata %"
          value="92%"
          trend={-1}
        />
        <StatCard
          icon={<Clock size={18} style={{ color: "var(--green-brand)" }} />}
          label="Hari Ini"
          value="12"
          trend={8}
        />
      </div>

      {/* Main Grid: Activate Panel + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ActivateAttendance onStateChange={handleActivateStateChange} />
        <LiveAttendanceList isActive={activateState === "active"} />
      </div>

      {/* Session Manager */}
      <div className="mb-6">
        <SessionManager />
      </div>

      {/* Attendance Table */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Riwayat Absensi
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Semua data kehadiran mahasiswa
          </p>
        </div>
        <AttendanceTable />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
