import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard — PresensLab Admin",
  description: "Monitoring live practicum attendance and session performance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      <Sidebar />
      {/* Main content — offset for sidebar */}
      <div className="md:ml-[220px] min-h-screen pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
}
