"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { outer: 20, inner: 14, stroke: 2 },
  md: { outer: 36, inner: 26, stroke: 3 },
  lg: { outer: 56, inner: 42, stroke: 4 },
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const s = sizes[size];

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: s.outer, height: s.outer }}
    >
      <svg
        width={s.outer}
        height={s.outer}
        viewBox={`0 0 ${s.outer} ${s.outer}`}
        style={{ animation: "spin-ring 0.9s linear infinite" }}
      >
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={(s.outer - s.stroke * 2) / 2}
          fill="none"
          stroke="rgba(34, 197, 94, 0.15)"
          strokeWidth={s.stroke}
        />
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={(s.outer - s.stroke * 2) / 2}
          fill="none"
          stroke="url(#spinnerGradient)"
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * (s.outer - s.stroke * 2) * 0.7} ${
            Math.PI * (s.outer - s.stroke * 2) * 0.3
          }`}
        />
        <defs>
          <linearGradient
            id="spinnerGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
