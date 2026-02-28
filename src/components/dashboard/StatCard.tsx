"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number; // percent, positive = up, negative = down
  className?: string;
}

export function StatCard({ icon, label, value, trend, className }: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        "glass glass-hover rounded-2xl p-5 flex flex-col gap-3",
        className
      )}
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
            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={
              trendUp
                ? {
                    color: "#4ade80",
                    background: "rgba(34,197,94,0.1)",
                  }
                : {
                    color: "#f87171",
                    background: "rgba(239,68,68,0.1)",
                  }
            }
          >
            {trendUp ? (
              <TrendingUp size={10} />
            ) : (
              <TrendingDown size={10} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
