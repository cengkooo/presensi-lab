import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
        <meta name="theme-color" content="#020d06" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
