"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { BlobBackground } from "@/components/ui/BlobBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseSession();

  // Dev-only email+password login
  const [devEmail, setDevEmail] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  const handleDevLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setDevError(null);
    setDevLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    });
    setDevLoading(false);
    if (error) {
      setDevError(error.message);
    } else {
      router.replace("/dashboard");
    }
  }, [devEmail, devPassword, router]);

  // Jika sudah login, langsung ke dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const handleGoogleLogin = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });
  }, []);

  if (loading) {
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

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <BlobBackground />

      <div className="relative z-10 w-full max-w-sm space-y-4 animate-fade-slide-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{
              background: "linear-gradient(135deg, #047857, #059669)",
              boxShadow: "0 0 30px rgba(5,150,105,0.35)",
            }}
          >
            <LayoutDashboard size={26} color="#fff" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            PresensLab
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Portal Dosen & Asisten
          </p>
        </div>

        {/* Login Card */}
        <GlassCard variant="strong" className="p-8">
          <div className="space-y-5">
            <div className="text-center">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Masuk untuk mengelola kelas, sesi, dan data presensi mahasiswa.
              </p>
            </div>

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

            <div
              className="rounded-xl px-3 py-2.5 text-xs text-center"
              style={{
                background: "rgba(5,46,22,0.3)",
                border: "1px solid rgba(16,185,129,0.15)",
                color: "var(--text-muted)",
              }}
            >
              Hanya akun dosen dan asisten yang terdaftar yang dapat mengakses dashboard.
            </div>

            {/* DEV-ONLY: email+password login */}
            {process.env.NODE_ENV === "development" && (
              <form onSubmit={handleDevLogin} className="space-y-3 pt-2">
                <div
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#FBBF24" }}
                  >
                    DEV
                  </span>
                  Login Dummy
                </div>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)",
                  }}
                />
                {devError && (
                  <p className="text-xs" style={{ color: "#F87171" }}>{devError}</p>
                )}
                <GlassButton
                  variant="ghost"
                  fullWidth
                  type="submit"
                  disabled={devLoading}
                  className="py-2.5 rounded-xl text-sm"
                >
                  {devLoading ? "Masuk..." : "Login (Dev)"}
                </GlassButton>
              </form>
            )}
          </div>
        </GlassCard>

        {/* Back link */}
        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          <Link href="/" className="hover:text-green-400 transition-colors">
            ← Kembali ke Beranda
          </Link>
          {" · "}
          <Link href="/presensi" className="hover:text-green-400 transition-colors">
            Presensi Mahasiswa
          </Link>
        </p>
      </div>
    </main>
  );
}
