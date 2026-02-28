"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: Date;
  onExpired?: () => void;
  className?: string;
}

function formatTime(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CountdownTimer({
  expiresAt,
  onExpired,
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const diff = expiresAt.getTime() - Date.now();
      setRemaining(Math.max(0, diff));
      if (diff <= 0) {
        onExpired?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const isWarning = remaining < 5 * 60 * 1000; // < 5 menit
  const isCritical = remaining < 60 * 1000; // < 1 menit

  return (
    <span
      className={cn(
        "tabular-nums font-bold text-xl tracking-widest",
        isCritical
          ? "text-red-400"
          : isWarning
          ? "text-yellow-400"
          : "text-green-400",
        isCritical && "animate-pulse",
        className
      )}
      style={
        isCritical
          ? { animation: "countdown-pulse 1s ease-in-out infinite" }
          : undefined
      }
    >
      {formatTime(remaining)}
    </span>
  );
}
