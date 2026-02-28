"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
}

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "rgba(8,22,12,0.7)",
        border: "1px solid rgba(34,197,94,0.15)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 0 30px rgba(34,197,94,0.12), 0 8px 32px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.15)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
            style={
              trendUp
                ? { color: "#4ade80", background: "rgba(34,197,94,0.12)" }
                : { color: "#f87171", background: "rgba(239,68,68,0.12)" }
            }
          >
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendUp ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div>
        <p
          className="font-bold tabular-nums"
          style={{ color: "#f0fdf4", fontSize: "30px", lineHeight: 1.1 }}
        >
          {value}
        </p>
        <p className="text-sm mt-1" style={{ color: "rgba(134,239,172,0.5)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
