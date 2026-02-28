"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

interface AttendeeItem {
  id: string;
  name: string;
  nim: string;
  initial: string;
  time: string;
  distance: number | null;
  status: string;
}

// Color for distance badge
function DistanceBadge({ distance }: { distance: number | null }) {
  if (distance == null) return null;
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
      {distance}m
    </span>
  );
}

interface Props {
  isActive?: boolean;
  sessionId?: string | null;
}

export function LiveAttendanceList({ isActive = false, sessionId }: Props) {
  const [items,        setItems]        = useState<AttendeeItem[]>([]);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [loading,      setLoading]      = useState(false);
  const [connStatus,   setConnStatus]   = useState<"connected" | "disconnected" | "reconnecting">("connected");
  const [retryCount,   setRetryCount]   = useState(0);
  const channelRef        = useRef<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef     = useRef<"connected" | "disconnected" | "reconnecting">("connected");
  const { toasts, toast, dismissToast } = useToast();

  const addItem = (item: AttendeeItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [item, ...prev];
    });
    setAnimatingIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAnimatingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    }, 600);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapItem = (row: any): AttendeeItem => ({
    id:       row.id,
    name:     row.profiles?.full_name ?? row.user_id?.slice(0, 8) ?? "—",
    nim:      row.profiles?.nim ?? "",
    initial:  (row.profiles?.full_name ?? "U").split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
    time:     row.checked_in_at
                ? new Date(row.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "--:--",
    distance: row.distance_meter ?? null,
    status:   row.status ?? "hadir",
  });

  useEffect(() => {
    if (!isActive || !sessionId) {
      setItems([]);
      setConnStatus("connected");
      prevStatusRef.current = "connected";
      if (channelRef.current) { channelRef.current.unsubscribe(); channelRef.current = null; }
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
      return;
    }

    const supabase = createSupabaseBrowserClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Initial load
    setLoading(true);
    Promise.resolve(
      sb.from("attendance")
        .select("id, status, checked_in_at, distance_meter, profiles ( full_name, nim )")
        .eq("session_id", sessionId)
        .order("checked_in_at", { ascending: false })
    ).then(({ data }: { data: unknown[] | null }) => {
      if (data) setItems(data.map(mapItem));
    }).catch(() => {}).finally(() => setLoading(false));

    // Realtime subscription
    if (channelRef.current) channelRef.current.unsubscribe();

    const channel = supabase
      .channel(`attendance:${sessionId}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "attendance",
        filter: `session_id=eq.${sessionId}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, async (payload: any) => {
        const newRow = payload.new;
        if (!newRow) return;
        const { data: profile } = await Promise.resolve(
          sb.from("profiles").select("full_name, nim").eq("id", newRow.user_id).single()
        ) as { data: { full_name: string; nim: string } | null };
        addItem(mapItem({ ...newRow, profiles: profile }));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (prevStatusRef.current !== "connected") {
            toast.success("Koneksi realtime kembali normal.");
          }
          prevStatusRef.current = "connected";
          setConnStatus("connected");
          if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (prevStatusRef.current === "connected") {
            toast.error("Koneksi Realtime terputus. Mencoba sambung ulang...");
          }
          prevStatusRef.current = "disconnected";
          setConnStatus("disconnected");
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              setConnStatus("reconnecting");
              setRetryCount((c) => c + 1);
            }, 4000);
          }
        }
      });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, sessionId, retryCount]);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Live Attendance Feed
            </h3>
            {connStatus === "reconnecting" && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(234,179,8,0.12)", color: "#facc15", border: "1px solid rgba(234,179,8,0.25)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#facc15", animation: "pulse-dot 1.5s ease-in-out infinite", display: "inline-block" }} />
                Menyambung ulang...
              </span>
            )}
            {connStatus === "disconnected" && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                Terputus
              </span>
            )}
          </div>
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

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
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
                  {item.nim}
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
      {/* Reconnect toasts (B6.6) */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              id={t.id}
              message={t.message}
              type={t.type}
              onDismiss={dismissToast}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
