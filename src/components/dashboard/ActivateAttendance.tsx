"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MapPin,
  Clock,
  Radio,
  Pause,
  Plus,
  ChevronDown,
  Navigation,
  Users,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type ActivateState = "idle" | "active" | "expired";

const MOCK_SESSIONS = [
  { id: "s1", title: "Praktikum Jaringan - A1" },
  { id: "s2", title: "Basis Data - B2" },
  { id: "s3", title: "Sistem Operasi - C1" },
  { id: "s4", title: "Kecerdasan Buatan - A2" },
];

interface ActivateAttendanceProps {
  onStateChange?: (state: ActivateState) => void;
}

export function ActivateAttendance({ onStateChange }: ActivateAttendanceProps) {
  const [state, setState] = useState<ActivateState>("idle");
  const [selectedSession, setSelectedSession] = useState(MOCK_SESSIONS[0].id);
  const [radius, setRadius] = useState(100);
  const [duration, setDuration] = useState(30);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date>(new Date());
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [activeSessTitle, setActiveSessTitle] = useState("");
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const getGps = useCallback(() => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung browser ini.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsLoading(false);
      },
      () => {
        // Demo fallback
        setGpsCoords({ lat: -6.914744, lng: 107.60981, accuracy: 15 });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleActivate = useCallback(() => {
    const sess = MOCK_SESSIONS.find((s) => s.id === selectedSession);
    if (!gpsCoords) {
      alert("Ambil lokasi GPS terlebih dahulu!");
      return;
    }
    const exp = new Date(Date.now() + duration * 60 * 1000);
    setExpiresAt(exp);
    setActiveSessTitle(sess?.title ?? "");
    setAttendeeCount(0);
    setState("active");
    onStateChange?.("active");
    // TODO: call POST /api/sessions/activate
  }, [gpsCoords, selectedSession, duration, onStateChange]);

  const handleExtend = useCallback(() => {
    setExpiresAt((prev) => new Date(prev.getTime() + 15 * 60 * 1000));
    // TODO: call POST /api/sessions/extend
  }, []);

  const handleDeactivate = useCallback(() => {
    setShowDeactivateConfirm(false);
    setState("expired");
    onStateChange?.("expired");
    // TODO: call POST /api/sessions/deactivate
  }, [onStateChange]);

  const handleExpired = useCallback(() => {
    setState("expired");
    onStateChange?.("expired");
  }, [onStateChange]);

  // Simulate live attendees incrementing
  useEffect(() => {
    if (state !== "active") return;
    const t = setInterval(() => {
      setAttendeeCount((p) => Math.min(p + 1, 32));
    }, 5000);
    return () => clearInterval(t);
  }, [state]);

  return (
    <GlassCard variant="strong" className="p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)" }}
        >
          <Radio size={16} style={{ color: "var(--green-brand)" }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Panel Aktivasi Absensi
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Aktifkan sesi absensi real-time
          </p>
        </div>
        {state === "active" && (
          <span
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-red-500"
              style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }}
            />
            LIVE
          </span>
        )}
      </div>

      {/* ---- IDLE STATE ---- */}
      {state === "idle" && (
        <div className="space-y-3 animate-fade-slide-up">
          {/* Session selector */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Pilih Sesi
            </label>
            <div className="relative">
              <select
                className="select-glass pr-8"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                {MOCK_SESSIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>

          {/* Radius + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Radius (meter)
              </label>
              <input
                type="number"
                className="input-glass"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                min={10}
                max={500}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Durasi (menit)
              </label>
              <input
                type="number"
                className="input-glass"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                max={180}
              />
            </div>
          </div>

          {/* GPS */}
          <div>
            <GlassButton
              variant="ghost"
              onClick={getGps}
              loading={gpsLoading}
              fullWidth
              className="text-sm py-2.5 rounded-xl"
            >
              <Navigation size={14} />
              {gpsLoading ? "Mengambil lokasi..." : "📍 Gunakan Lokasi Saya"}
            </GlassButton>
            {gpsCoords && (
              <div
                className="mt-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: "rgba(5,46,22,0.4)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: "var(--text-secondary)",
                }}
              >
                <span style={{ color: "var(--green-brand)" }}>✓</span>{" "}
                {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)} (±{gpsCoords.accuracy}m)
              </div>
            )}
          </div>

          <GlassButton
            variant="primary"
            onClick={handleActivate}
            fullWidth
            className="py-3 rounded-xl"
          >
            🟢 Aktifkan Absensi
          </GlassButton>
        </div>
      )}

      {/* ---- ACTIVE STATE ---- */}
      {state === "active" && (
        <div className="space-y-4 animate-fade-slide-up">
          {/* Session info */}
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(5,46,22,0.35)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sesi Aktif</p>
            <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>
              {activeSessTitle}
            </p>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Berakhir dalam</p>
              <CountdownTimer expiresAt={expiresAt} onExpired={handleExpired} />
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sudah hadir</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Users size={14} style={{ color: "var(--green-brand)" }} />
                <span className="text-xl font-bold tabular-nums" style={{ color: "#4ade80" }}>
                  {attendeeCount}
                </span>
              </div>
            </div>
          </div>

          {/* Coords */}
          {gpsCoords && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{
                background: "rgba(5,46,22,0.3)",
                border: "1px solid rgba(34,197,94,0.15)",
                color: "var(--text-muted)",
              }}
            >
              <MapPin size={12} style={{ color: "var(--green-brand)" }} />
              <span className="tabular-nums">
                {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
              </span>
              <span className="ml-auto">R: {radius}m</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <GlassButton
              variant="ghost"
              onClick={handleExtend}
              className="flex-1 text-xs py-2"
            >
              <Plus size={12} /> +15 Menit
            </GlassButton>
            <GlassButton
              variant="danger"
              onClick={() => setShowDeactivateConfirm(true)}
              className="flex-1 text-xs py-2"
            >
              <Pause size={12} /> Nonaktifkan
            </GlassButton>
          </div>

          {/* Deactivate confirm */}
          {showDeactivateConfirm && (
            <div
              className="rounded-xl p-3 space-y-2 animate-scale-in"
              style={{
                background: "rgba(30,5,5,0.5)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "#f87171" }}>
                ⚠ Nonaktifkan absensi?
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Mahasiswa tidak dapat lagi melakukan check-in setelah ini.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  className="flex-1 text-xs py-1.5 rounded-lg"
                  style={{
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-muted)",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleDeactivate}
                  className="flex-1 text-xs py-1.5 rounded-lg"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }}
                >
                  Ya, Nonaktifkan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- EXPIRED STATE ---- */}
      {state === "expired" && (
        <div className="space-y-4 animate-fade-slide-up">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">⏰</div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Sesi Berakhir
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Total hadir:{" "}
              <span className="font-bold" style={{ color: "#4ade80" }}>
                {attendeeCount} mahasiswa
              </span>
            </p>
          </div>
          <GlassButton
            variant="primary"
            onClick={() => {
              setState("idle");
              setGpsCoords(null);
              setAttendeeCount(0);
              onStateChange?.("idle");
            }}
            fullWidth
            className="py-3 rounded-xl"
          >
            🟢 Aktifkan Sesi Baru
          </GlassButton>
        </div>
      )}
    </GlassCard>
  );
}
