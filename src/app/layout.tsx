import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PresensLab — Sistem Absensi Praktikum",
  description:
    "Sistem absensi digital berbasis GPS untuk praktikum laboratorium. Catat kehadiran mahasiswa secara real-time dengan verifikasi lokasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B1F1A" />
      </head>
      <body className="antialiased" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        {/* Self-XSS warning — tampil di console browser production */}
        <script dangerouslySetInnerHTML={{ __html: `
if (typeof window !== 'undefined') {
  console.log('%cSTOP!', 'color:#ef4444;font-size:64px;font-weight:900;');
  console.log('%cIni adalah fitur browser untuk developer.\\nJangan masukkan atau tempelkan kode apapun di sini.\\nIni bisa membahayakan akun dan data kamu (Self-XSS Attack).', 'font-size:16px;color:#1a1a1a;');
}
        ` }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
