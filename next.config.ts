import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  // Next.js memerlukan unsafe-inline & unsafe-eval untuk hydration
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // blob: untuk export CSV, data: untuk placeholder image
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  // Supabase REST + Realtime (wss), Google OAuth
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
  // Google OAuth popup
  "frame-src https://accounts.google.com",
  // Cegah website lain embed PresensLab dalam iframe (anti-clickjacking)
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Matikan source maps di production — cegah kode asli terbaca dari browser
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: cspHeader },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
