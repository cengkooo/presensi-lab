"use client";

import { cn } from "@/lib/utils";

type Status = "hadir" | "telat" | "absen" | "ditolak";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const labels: Record<Status, string> = {
  hadir: "Hadir",
  telat: "Telat",
  absen: "Absen",
  ditolak: "Ditolak",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        `badge-${status}`,
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
