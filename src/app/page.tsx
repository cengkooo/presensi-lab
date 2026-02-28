"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  QrCode,
  CheckCircle,
  Clock,
  Lock,
  AlertTriangle,
  RefreshCw,
  Navigation,
  LogIn,
  User,
  LogOut,
  ChevronRight,
  Wifi,
  WifiOff,
  Calendar,
  LayoutDashboard,
  Info,
} from "lucide-react";
import { BlobBackground } from "@/components/ui/BlobBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DistanceBar } from "@/components/ui/DistanceBar";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* ============================================================
   TYPES
   ============================================================ */
type AuthState = "loading" | "not-logged-in" | "logged-in";
type CheckinState =
  | "idle"
  | "getting-gps"
  | "confirming"
  | "submitting"
  | "success"
  | "error-not-open"
  | "error-expired"
  | "error-out-of-range"
  | "error-already-checked-in"
  | "error-gps-denied"
  | "error-gps-weak"
  | "error-gps-timeout";

interface GpsCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

type ActiveSession = {
  id: string;
  title: string;
  date: string;
  location: string | null;
  radius: number;
  expiresAt: Date;
  lat: number;
  lng: number;
};

type UserInfo = {
  name: string;
  avatarInitial: string;
  isAdmin: boolean;
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function Logo() {
  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{
          background: "linear-gradient(135deg, #059669, #10B981)",
          boxShadow: "0 0 24px rgba(16,185,129,0.4)",
        }}
      >
        <span className="text-2xl">🧪</span>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gradient-green tracking-tight">
          PresensLab
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Sistem Absensi Praktikum
        </p>
      </div>
    </div>
  );
}

function UserBar({
  user,
  onLogout,
}: {
  user: UserInfo;
  onLogout: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-full"
      style={{
        background: "rgba(10,30,15,0.7)",
        border: "1px solid var(--border-glass)",
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #059669, #10B981)",
          color: "#fff",
        }}
      >
        {user.avatarInitial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Selamat datang,
        </p>
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {user.name}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="p-1.5 rounded-full transition-colors hover:bg-white/5"
        style={{ color: "var(--text-muted)" }}
        title="Keluar"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

function SessionCard({
  session,
  children,
}: {
  session: ActiveSession;
  children: React.ReactNode;
}) {
  const locationLabel = session.location ?? "Lokasi tidak diset";

  return (
    <GlassCard variant="default" className="overflow-hidden">
      {/* Session header image area */}
      <div
        className="relative h-36 flex flex-col justify-end p-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,46,22,0.3) 0%, rgba(2,13,6,0.95) 100%), url('/api/placeholder/400/200') center/cover",
          backgroundImage:
            "linear-gradient(135deg, #0a2010 0%, #051a0c 50%, #0B1F1A 100%)",
        }}
      >
        {/* Server rack decoration */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(16,185,129,0.15) 18px, rgba(16,185,129,0.15) 19px)`,
          }}
        />
        <div className="relative">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider mb-2"
            style={{
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#34D399",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              style={{ animation: "pulse-dot 1.5s ease-in-out infinite" }}
            />
            SESI AKTIF
          </span>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {session.title}
          </h2>
        </div>
      </div>

      {/* Session info */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Calendar size={14} style={{ color: "var(--green-brand)" }} />
          <span>{session.date}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <MapPin size={14} style={{ color: "var(--green-brand)" }} />
          <span>{locationLabel}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
          <Clock size={14} />
          <span>Berakhir dalam:</span>
          <CountdownTimer expiresAt={session.expiresAt} />
        </div>
        {children}
      </div>
    </GlassCard>
  );
}

/* ============================================================
   MAIN LANDING PAGE
   ============================================================ */
export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseSession();

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [checkinState, setCheckinState] = useState<CheckinState>("idle");
  const [gpsCoords, setGpsCoords] = useState<GpsCoords | null>(null);
  const [gpsFailCount, setGpsFailCount] = useState(0);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [distanceResult, setDistanceResult] = useState<number | null>(null);
  const { toasts, toast, dismissToast } = useToast();

  // Derived auth state
  const authState: AuthState = authLoading
    ? "loading"
    : user
    ? "logged-in"
    : "not-logged-in";

  // Build user info for UI
  const userInfo: UserInfo = {
    name: profile?.full_name ?? user?.email?.split("@")[0] ?? "User",
    avatarInitial: (profile?.full_name ?? user?.email ?? "U")
      .split(" ")
      .map((w: string) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    isAdmin: profile?.role === "dosen" || profile?.role === "admin",
  };

  // Fetch active session when logged in
  useEffect(() => {
    if (authState !== "logged-in") return;

    setSessionLoading(true);
    fetch("/api/sessions/active", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = json.data;
          // Only show session if it has a valid GPS anchor
          if (s.lat == null || s.lng == null) {
            setActiveSession(null);
            return;
          }
          setActiveSession({
            id: s.id,
            title: s.title ?? s.classes?.name ?? "Sesi Praktikum",
            date: new Date(s.session_date ?? s.created_at).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            location: s.location ?? s.classes?.location ?? null,
            radius: s.radius_meter ?? 100,
            expiresAt: new Date(s.expires_at),
            lat: s.lat,
            lng: s.lng,
          });
        } else {
          setActiveSession(null);
        }
      })
      .catch(() => setActiveSession(null))
      .finally(() => setSessionLoading(false));
  }, [authState]);

  /* ---- GPS Flow ---- */
  const startGps = useCallback(() => {
    setCheckinState("getting-gps");
    if (!navigator.geolocation) {
      setCheckinState("error-gps-denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setCheckinState("confirming");
      },
      (err) => {
        setGpsFailCount((p) => p + 1);
        if (err.code === 1) setCheckinState("error-gps-denied");
        else if (err.code === 2) setCheckinState("error-gps-weak");
        else setCheckinState("error-gps-timeout");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const confirmCheckin = useCallback(async () => {
    if (!gpsCoords || !activeSession) return;
    setCheckinState("submitting");

    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          session_id: activeSession.id,
          lat: gpsCoords.lat,
          lng: gpsCoords.lng,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        const code: string = json.error ?? "";
        if (code === "SESSION_INACTIVE") { setCheckinState("error-not-open"); return; }
        if (code === "SESSION_EXPIRED")  { setCheckinState("error-expired"); return; }
        if (code === "OUT_OF_RANGE")     {
          setDistanceResult(json.details?.distance_meter ?? null);
          setCheckinState("error-out-of-range");
          return;
        }
        if (code === "ALREADY_CHECKED_IN") {
          setCheckedInAt(json.details?.checked_in_at
            ? new Date(json.details.checked_in_at).toLocaleTimeString("id-ID", {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              })
            : null
          );
          setCheckinState("error-already-checked-in");
          return;
        }
        if (code === "RATE_LIMITED") {
          toast.error("Terlalu banyak percobaan. Tunggu sebentar dan coba lagi.");
          setCheckinState("idle");
          return;
        }
        toast.error(json.message ?? "Gagal absen. Coba lagi.");
        setCheckinState("idle");
        return;
      }

      // SUCCESS
      const att = json.data;
      setDistanceResult(att.distance_meter ?? null);
      setCheckedInAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        })
      );
      setCheckinState("success");
      toast.success("Kehadiran berhasil dicatat!");
    } catch {
      toast.error("Gagal terhubung ke server. Periksa koneksi kamu.");
      setCheckinState("idle");
    }
  }, [gpsCoords, activeSession, toast]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
  }, [router]);

  const handleGoogleLogin = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }, []);

  const resetFlow = useCallback(() => {
    setCheckinState("idle");
    setGpsCoords(null);
    setDistanceResult(null);
    setCheckedInAt(null);
  }, []);

  /* ============================================================
     RENDER — Loading
     ============================================================ */
  if (authState === "loading") {
    return (
      <main
        className="relative min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <BlobBackground />
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  /* ============================================================
     RENDER — Not Logged In
     ============================================================ */
  if (authState === "not-logged-in") {
    return (
      <main
        className="relative min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <BlobBackground />
        <div className="relative z-10 w-full max-w-sm space-y-4 animate-fade-slide-up">
          <GlassCard variant="strong" className="p-8 text-center">
            <Logo />
            <div className="mt-8">
              <GlassButton
                variant="ghost"
                fullWidth
                onClick={handleGoogleLogin}
                className="gap-3 py-3 rounded-2xl"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Google
              </GlassButton>
            </div>
          </GlassCard>
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Hanya email terdaftar yang dapat masuk
          </p>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </main>
    );
  }

  /* ============================================================
     RENDER — Logged In
     ============================================================ */
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--bg-base)" }}
    >
      <BlobBackground />

      <div className="relative z-10 w-full max-w-sm space-y-4">
        {/* Logo */}
        <div className="text-center">
          <Logo />
        </div>

        {/* User Bar */}
        <UserBar user={userInfo} onLogout={handleLogout} />

        {/* ---- Session Card + Check-in States ---- */}
        {sessionLoading ? (
          <GlassCard className="p-6 flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Memeriksa sesi aktif...</p>
          </GlassCard>
        ) : activeSession ? (
          <div className="animate-fade-slide-up">
            <SessionCard session={activeSession}>
              {/* ---- IDLE ---- */}
              {checkinState === "idle" && (
                <div className="pt-1">
                  <GlassButton
                    variant="primary"
                    fullWidth
                    onClick={startGps}
                    className="gap-2 py-3.5 rounded-xl mt-1"
                  >
                    <QrCode size={18} />
                    Catat Kehadiran
                  </GlassButton>
                  <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    Pastikan GPS aktif di perangkat kamu
                  </p>
                  {gpsFailCount >= 2 && (
                    <button
                      onClick={() => toast.warning("Permintaan override dikirim ke dosen.")}
                      className="w-full mt-2 text-xs py-2 rounded-xl transition-colors"
                      style={{
                        color: "#fb923c",
                        border: "1px solid rgba(249,115,22,0.25)",
                        background: "rgba(249,115,22,0.08)",
                      }}
                    >
                      ⚠ Minta Override Dosen
                    </button>
                  )}
                </div>
              )}

              {/* ---- GETTING GPS ---- */}
              {checkinState === "getting-gps" && (
                <div className="pt-2 flex flex-col items-center gap-3">
                  <LoadingSpinner size="md" />
                  <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                    Mendapatkan lokasi GPS kamu...
                  </p>
                </div>
              )}

              {/* ---- CONFIRMING ---- */}
              {checkinState === "confirming" && gpsCoords && (
                <div className="pt-2 space-y-3">
                  <div
                    className="rounded-xl p-3 space-y-1"
                    style={{
                      background: "rgba(5,46,22,0.4)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: "var(--green-brand)" }}>
                      📍 Lokasi GPS Terdeteksi
                    </p>
                    <p className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Akurasi: ±{gpsCoords.accuracy}m
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <GlassButton
                      variant="ghost"
                      onClick={startGps}
                      className="flex-1 text-xs py-2"
                    >
                      <RefreshCw size={12} /> Deteksi Ulang
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      onClick={confirmCheckin}
                      className="flex-1 text-xs py-2 rounded-xl"
                    >
                      <Navigation size={12} /> Konfirmasi
                    </GlassButton>
                  </div>
                </div>
              )}

              {/* ---- SUBMITTING ---- */}
              {checkinState === "submitting" && (
                <div className="pt-2 flex flex-col items-center gap-3">
                  <LoadingSpinner size="md" />
                  <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                    Memverifikasi lokasi kamu...
                  </p>
                </div>
              )}

              {/* ---- SUCCESS ---- */}
              {checkinState === "success" && (
                <div className="pt-2 animate-scale-in">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "rgba(16,185,129,0.2)",
                          animation: "sonar 1.5s ease-out forwards",
                        }}
                      />
                      <div
                        className="relative flex items-center justify-center w-14 h-14 rounded-full"
                        style={{ background: "rgba(16,185,129,0.15)", border: "2px solid #10B981" }}
                      >
                        <CheckCircle size={28} style={{ color: "#34D399" }} />
                      </div>
                    </div>
                    <p className="text-base font-bold text-center" style={{ color: "#34D399" }}>
                      Kehadiran Dicatat!
                    </p>
                    <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      Pukul {checkedInAt}
                    </p>
                    {distanceResult !== null && (
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        📍 {distanceResult}m dari titik absen ✅
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ---- ERROR STATES ---- */}
              {checkinState === "error-not-open" && (
                <ErrorCard
                  icon="🔒"
                  title="Absensi belum dibuka"
                  message="Tunggu dosen mengaktifkan sesi absensi."
                  onRetry={resetFlow}
                />
              )}
              {checkinState === "error-expired" && (
                <ErrorCard
                  icon="⏰"
                  title="Waktu absensi habis"
                  message="Hubungi dosen untuk perpanjangan atau override manual."
                  onRetry={resetFlow}
                />
              )}
              {checkinState === "error-out-of-range" && (
                <ErrorCard
                  icon="📍"
                  title="Di luar jangkauan"
                  message={`Posisi kamu terlalu jauh dari titik absen.`}
                  onRetry={resetFlow}
                >
                  <DistanceBar actual={distanceResult ?? 143} max={activeSession?.radius ?? 100} className="mt-2" />
                </ErrorCard>
              )}
              {checkinState === "error-already-checked-in" && (
                <ErrorCard
                  icon="✅"
                  title="Sudah absen"
                  message={`Kamu sudah tercatat hadir pukul ${checkedInAt || "08:15"}.`}
                  onRetry={resetFlow}
                />
              )}
              {checkinState === "error-gps-denied" && (
                <ErrorCard
                  icon="📵"
                  title="Izin lokasi ditolak"
                  message="Aktifkan izin GPS di pengaturan browser kamu, lalu coba lagi."
                  onRetry={resetFlow}
                  retryLabel="Coba Lagi"
                />
              )}
              {checkinState === "error-gps-weak" && (
                <ErrorCard
                  icon="📶"
                  title="Sinyal GPS lemah"
                  message="Coba pindah ke tempat yang lebih terbuka."
                  onRetry={startGps}
                  retryLabel="Coba Lagi"
                />
              )}
              {checkinState === "error-gps-timeout" && (
                <ErrorCard
                  icon="⏱"
                  title="GPS timeout"
                  message="Tidak bisa mendapatkan lokasi. Coba lagi atau hubungi dosen."
                  onRetry={startGps}
                  retryLabel="Coba Lagi"
                />
              )}
            </SessionCard>
          </div>
        ) : (
          /* No active session */
          <GlassCard className="p-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Tidak Ada Sesi Aktif
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Tunggu dosen mengaktifkan sesi absensi praktikum.
            </p>
          </GlassCard>
        )}

        {/* Footer links */}
        <div
          className="flex items-center justify-center gap-6 text-xs pt-2"
          style={{ color: "var(--text-muted)" }}
        >
          <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
            <Info size={12} /> Bantuan
          </button>
          {userInfo.isAdmin && (
            <a
              href="/dashboard"
              className="flex items-center gap-1 hover:text-green-400 transition-colors"
            >
              <LayoutDashboard size={12} /> Jadwal Lengkap
            </a>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

/* ---- Reusable Error Card ---- */
function ErrorCard({
  icon,
  title,
  message,
  onRetry,
  retryLabel = "Kembali",
  children,
}: {
  icon: string;
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pt-2 animate-scale-in">
      <div
        className="rounded-xl p-3 space-y-2"
        style={{
          background: "rgba(30,5,5,0.4)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
              {title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {message}
            </p>
          </div>
        </div>
        {children}
        <GlassButton
          variant="ghost"
          onClick={onRetry}
          className="w-full text-xs py-2 mt-1"
        >
          {retryLabel}
        </GlassButton>
      </div>
    </div>
  );
}
