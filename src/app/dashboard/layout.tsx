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
    <div style={{ background: "#020d06", minHeight: "100vh", display: "flex" }}>
      <Sidebar />
      {/* Spacer untuk desktop sidebar — inline style, tidak bergantung Tailwind arbitrary value */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          // Pada desktop: beri ruang 220px dari kiri untuk sidebar fixed
          // Pada mobile: tidak ada offset (sidebar jadi drawer + bottom nav)
        }}
        className="dashboard-main"
      >
        {children}
      </div>

      {/* CSS untuk handle responsive dengan media query langsung */}
      <style>{`
        @media (min-width: 768px) {
          .dashboard-main {
            margin-left: 220px;
          }
        }
        @media (max-width: 767px) {
          .dashboard-main {
            margin-left: 0;
            padding-bottom: 64px;
          }
        }
      `}</style>
    </div>
  );
}
