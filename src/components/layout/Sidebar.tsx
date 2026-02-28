"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Users,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/sesi", label: "Sesi Praktikum", icon: Clock },
  { href: "/dashboard/mahasiswa", label: "Mahasiswa", icon: Users },
  { href: "/dashboard/export", label: "Export Data", icon: Download },
];

const managementItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const MOCK_ADMIN = {
  name: "Alex Rivera",
  role: "Head Coordinator",
  initial: "AR",
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
  }) => {
    const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "text-white"
            : "hover:text-green-400 hover:bg-white/5"
        )}
        style={
          isActive
            ? {
                background: "linear-gradient(135deg, rgba(22,163,74,0.3), rgba(34,197,94,0.15))",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#4ade80",
              }
            : { color: "var(--text-muted)" }
        }
        onClick={() => setMobileOpen(false)}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "var(--border-glass)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #15803d, #22c55e)",
              boxShadow: "0 0 16px rgba(34,197,94,0.35)",
            }}
          >
            <FlaskConical size={18} color="#fff" />
          </div>
          <div>
            <p className="font-bold text-base text-gradient-green leading-none">
              PresensLab
            </p>
            <p className="text-xs tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>
              ADMIN CONTROL
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        <div
          className="pt-4 mt-4 border-t"
          style={{ borderColor: "var(--border-glass)" }}
        >
          <p
            className="px-3 pb-2 text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Management
          </p>
          {managementItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* User Info */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "var(--border-glass)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #1e3a1e, #2d5a2d)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#4ade80",
            }}
          >
            {MOCK_ADMIN.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {MOCK_ADMIN.name}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {MOCK_ADMIN.role}
            </p>
          </div>
          <button
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
            title="Keluar"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen w-[220px] z-30",
          "glass-strong",
          className
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ color: "var(--text-primary)" }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 h-screen w-[220px] z-50 glass-strong transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 py-2 glass-strong"
        style={{ borderTop: "1px solid var(--border-glass)" }}
      >
        <div className="flex justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: isActive ? "var(--green-brand)" : "var(--text-muted)" }}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
