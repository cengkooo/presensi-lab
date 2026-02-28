"use client";

import Link from "next/link";
import { QrCode, LayoutDashboard, FlaskConical, ArrowRight } from "lucide-react";
import { BlobBackground } from "@/components/ui/BlobBackground";
import { GlassButton } from "@/components/ui/GlassButton";

/* ================================================================
   LANDING PAGE — Halaman utama pengenal laboratorium program studi
   Akan dikustomisasi lebih lanjut di Fase 3
   ================================================================ */
export default function LandingPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-base)" }}
    >
      <BlobBackground />

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-slide-up">
        {/* ── Hero ── */}
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mx-auto"
            style={{
              background: "linear-gradient(135deg, #047857, #10B981)",
              boxShadow: "0 0 40px rgba(16,185,129,0.35)",
            }}
          >
            <FlaskConical size={38} color="#fff" />
          </div>

          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {/* Ganti dengan nama lab yang sebenarnya */}
              Laboratorium Teknik Informatika
            </h1>
            <p
              className="text-base mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {/* Ganti dengan nama prodi / institusi */}
              Program Studi Teknik Informatika
            </p>
          </div>

          <p
            className="text-sm max-w-xs mx-auto leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Sistem informasi dan presensi praktikum laboratorium berbasis lokasi.
          </p>
        </div>

        {/* ── CTA Cards ── */}
        <div className="space-y-3">
          {/* Presensi Mahasiswa */}
          <Link
            href="/presensi"
            className="block rounded-2xl glass p-5 hover:border-green-500/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}
              >
                <QrCode size={22} style={{ color: "#34D399" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Presensi Mahasiswa
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Catat kehadiran praktikum via GPS
                </p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 group-hover:translate-x-1 transition-transform"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </Link>

          {/* Login Dosen / Asisten */}
          <Link
            href="/login"
            className="block rounded-2xl glass p-5 hover:border-green-500/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                style={{
                  background: "rgba(5,150,105,0.1)",
                  border: "1px solid rgba(5,150,105,0.2)",
                }}
              >
                <LayoutDashboard size={22} style={{ color: "#6EE7B7" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Dashboard Dosen / Asisten
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Kelola kelas, sesi, dan data kehadiran
                </p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 group-hover:translate-x-1 transition-transform"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </Link>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Laboratorium Teknik Informatika
        </p>
      </div>
    </main>
  );
}
