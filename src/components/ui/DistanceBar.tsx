"use client";

import { cn } from "@/lib/utils";

interface DistanceBarProps {
  actual: number;
  max: number;
  className?: string;
}

export function DistanceBar({ actual, max, className }: DistanceBarProps) {
  const pct = Math.min(100, (actual / max) * 100);
  const isOver = actual > max;

  const barColor = isOver
    ? "#ef4444"
    : pct > 80
    ? "#f97316"
    : pct > 60
    ? "#eab308"
    : "#22c55e";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium" style={{ color: barColor }}>
          {actual}m dari titik absen
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          maks {max}m
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #22c55e, ${barColor})`,
            boxShadow: `0 0 8px ${barColor}60`,
          }}
        />
      </div>
      {isOver && (
        <p className="mt-1.5 text-xs text-red-400 font-medium">
          ⚠ Posisi kamu {actual - max}m melewati batas radius
        </p>
      )}
    </div>
  );
}
