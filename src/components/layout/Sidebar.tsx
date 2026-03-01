"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const navMain = [
  { href: "/dashboard",           label: "Dashboard",        icon: LayoutDashboard, staffOnly: false },
  { href: "/dashboard/kelas",     label: "Kelas Praktikum",  icon: BookOpen,        staffOnly: false },
  { href: "/dashboard/mahasiswa", label: "Mahasiswa",        icon: Users,           staffOnly: true  },
  { href: "/dashboard/export",    label: "Export Data",      icon: Download,        staffOnly: true  },
];

const navMgmt = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings, staffOnly: true },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, profile } = useSupabaseSession();

  const displayName    = profile?.full_name ?? user?.email?.split("@")[0] ?? "User";
  const role           = profile?.role ?? "mahasiswa";
  const isStaff        = role === "dosen" || role === "asisten" || role === "admin";
  const displayRole    = role === "dosen" ? "Dosen / Koordinator" : role === "asisten" ? "Asisten Dosen" : role === "admin" ? "Admin" : "Mahasiswa";
  const displayInitial = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const visibleMain = navMain.filter((item) => !item.staffOnly || isStaff);
  const visibleMgmt = navMgmt.filter((item) => !item.staffOnly || isStaff);

  const handleSignOut = useCallback(async () => {
    // Hapus session client-side (localStorage/cookie Supabase)
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // Hapus session server-side (cookie HTTP-only)
    await fetch("/api/auth/signout", { method: "POST" });
    // Hard redirect — bersihkan semua state React & cache, paksa login ulang
    window.location.replace("/login");
  }, []);

  const NavItem = ({
    href,
    label,
    Icon,
  }: {
    href: string;
    label: string;
    Icon: React.ElementType;
  }) => {
    const active =
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        style={
          active
            ? {
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.09))",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#34D399",
              }
            : {
                color: "rgba(110,231,183,0.5)",
                border: "1px solid transparent",
              }
        }
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.color = "#34D399";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.04)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(110,231,183,0.5)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        <Icon size={17} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(7,22,18,0.96)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(16,185,129,0.12)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.1)" }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #059669, #10B981)",
            boxShadow: "0 0 16px rgba(16,185,129,0.35)",
          }}
        >
          <FlaskConical size={17} color="#fff" />
        </div>
        <div>
          <p
            className="font-bold text-sm leading-tight"
            style={{
              background: "linear-gradient(135deg, #10B981, #A7F3D0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            PresensLab
          </p>
          <p
            className="text-xs tracking-widest font-semibold leading-tight mt-0.5"
            style={{ color: "rgba(110,231,183,0.4)", fontSize: "9px" }}
          >
            ADMIN CONTROL
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleMain.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
        {visibleMgmt.length > 0 && (
          <div
            className="pt-5 mt-4"
            style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}
          >
            <p
              className="px-3 pb-2 text-xs font-bold tracking-widest uppercase"
              style={{ color: "rgba(110,231,183,0.3)", fontSize: "9px" }}
            >
              Management
            </p>
            {visibleMgmt.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
            ))}
          </div>
        )}
      </nav>

      {/* User */}
      <div
        className="px-3 py-4"
        style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl"
          style={{ background: "rgba(16,185,129,0.05)" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0f2d27, #164035)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#34D399",
            }}
          >
            {displayInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#e2f5e8" }}>
              {displayName}
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(110,231,183,0.4)" }}>
              {displayRole}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "rgba(110,231,183,0.4)" }}
            title="Keluar"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useSupabaseSession();

  const role    = profile?.role ?? "mahasiswa";
  const isStaff = role === "dosen" || role === "asisten" || role === "admin";
  const visibleMain = navMain.filter((item) => !item.staffOnly || isStaff);

  return (
    <>
      {/* === DESKTOP SIDEBAR === */}
      <aside
        className="hidden md:block fixed top-0 left-0 h-screen z-40"
        style={{ width: "220px" }}
      >
        <SidebarContent />
      </aside>

      {/* === MOBILE HAMBURGER === */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-xl"
        onClick={() => setMobileOpen(true)}
        style={{
          background: "rgba(7,22,18,0.9)",
          border: "1px solid rgba(16,185,129,0.2)",
          color: "#34D399",
        }}
      >
        <Menu size={18} />
      </button>

      {/* === MOBILE OVERLAY === */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* === MOBILE DRAWER === */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-screen z-50 transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: "220px" }}
      >
        <button
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg"
          onClick={() => setMobileOpen(false)}
          style={{
            background: "rgba(16,185,129,0.1)",
            color: "#34D399",
          }}
        >
          <X size={14} />
        </button>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* === MOBILE BOTTOM NAV === */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: "rgba(7,22,18,0.96)",
          borderTop: "1px solid rgba(16,185,129,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex justify-around py-2">
          {visibleMain.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl"
                style={{ color: active ? "#34D399" : "rgba(110,231,183,0.4)" }}
              >
                <Icon size={19} />
                <span className="text-xs">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
