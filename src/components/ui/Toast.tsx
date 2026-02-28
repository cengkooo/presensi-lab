"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
};

const styles: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: {
    border: "rgba(34,197,94,0.3)",
    icon: "#4ade80",
    bg: "rgba(5,46,22,0.9)",
  },
  error: {
    border: "rgba(239,68,68,0.3)",
    icon: "#f87171",
    bg: "rgba(30,5,5,0.9)",
  },
  warning: {
    border: "rgba(234,179,8,0.3)",
    icon: "#facc15",
    bg: "rgba(30,25,5,0.9)",
  },
};

export function Toast({ id, message, type, onDismiss, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[type];
  const s = styles[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300",
        visible ? "animate-slide-in-right opacity-100" : "opacity-0 translate-x-4"
      )}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        backdropFilter: "blur(12px)",
        minWidth: "280px",
        maxWidth: "360px",
      }}
    >
      <Icon size={18} style={{ color: s.icon, flexShrink: 0, marginTop: 1 }} />
      <p className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
        {message}
      </p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ============================================================
   Toast Container — taruh di root layout
   ============================================================ */
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
      style={{ pointerEvents: "none" }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <Toast
            id={t.id}
            message={t.message}
            type={t.type}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
}
