"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface AttendeeItem {
  id: string;
  name: string;
  email: string;
  initial: string;
  time: string;
  distance: number;
}

// Color for distance badge
function DistanceBadge({ distance }: { distance: number }) {
  const label = `${distance}m`;
  const style =
    distance < 30
      ? { bg: "rgba(16,185,129,0.15)", color: "#34D399", border: "rgba(16,185,129,0.25)" }
      : distance < 80
      ? { bg: "rgba(234,179,8,0.15)", color: "#facc15", border: "rgba(234,179,8,0.25)" }
      : { bg: "rgba(249,115,22,0.15)", color: "#fb923c", border: "rgba(249,115,22,0.25)" };

  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
}

// Mock seed data
const SEED_DATA: AttendeeItem[] = [
  { id: "1", name: "Jordan Dika", email: "jordan.d@presenslab.com", initial: "JD", time: "08:15 AM", distance: 18 },
  { id: "2", name: "Amira Safira", email: "amira.s@presenslab.com", initial: "AS", time: "08:32 AM", distance: 45 },
  { id: "3", name: "Budi Waluyo", email: "budi.w@presenslab.com", initial: "BW", time: "08:47 AM", distance: 92 },
];

export function LiveAttendanceList({ isActive = false }: { isActive?: boolean }) {
  const [items, setItems] = useState<AttendeeItem[]>([]);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Simulate incoming data when active
  useEffect(() => {
    if (!isActive) {
      setItems([]);
      return;
    }
    // Add seed items with delay
    SEED_DATA.forEach((item, i) => {
      setTimeout(() => {
        setItems((prev) => [item, ...prev]);
        setAnimatingIds((prev) => new Set(prev).add(item.id));
        setTimeout(() => {
          setAnimatingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }, 600);
      }, i * 1500);
    });
  }, [isActive]);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Live Attendance Feed
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Update otomatis saat mahasiswa check-in
          </p>
        </div>
        {items.length > 0 && (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "#34D399",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            {items.length} hadir
          </span>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "rgba(16,185,129,0.15)",
                animation: "sonar 2s ease-out infinite",
              }}
            />
            <span
              className="absolute inset-2 rounded-full"
              style={{
                background: "rgba(16,185,129,0.2)",
                animation: "sonar 2s ease-out infinite 0.5s",
              }}
            />
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: "var(--green-brand)" }}
            />
          </div>
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            Menunggu mahasiswa check in...
          </p>
        </div>
      )}

      {/* Attendee list */}
      {items.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(5,46,22,0.25)",
                border: "1px solid rgba(16,185,129,0.12)",
                animation: animatingIds.has(item.id)
                  ? "fadeSlideDown 0.5s ease forwards"
                  : "none",
              }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #1e3a1e, #2d5a2d)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: "#34D399",
                }}
              >
                {item.initial}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {item.name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {item.email}
                </p>
              </div>
              {/* Time + Distance */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <DistanceBadge distance={item.distance} />
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
