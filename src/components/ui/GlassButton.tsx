"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

export function GlassButton({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  loading = false,
  className,
  type = "button",
  fullWidth = false,
}: GlassButtonProps) {
  const variantClass =
    variant === "ghost"
      ? "btn-ghost"
      : variant === "danger"
      ? "btn-danger"
      : "btn-primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(variantClass, fullWidth && "w-full", className)}
    >
      {loading && (
        <Loader2
          size={16}
          className="animate-spin"
          style={{ animation: "spin-ring 0.8s linear infinite" }}
        />
      )}
      {children}
    </button>
  );
}
