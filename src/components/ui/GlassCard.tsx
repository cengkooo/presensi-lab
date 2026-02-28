"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong" | "subtle";
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  hover = false,
}: GlassCardProps) {
  const variantClass =
    variant === "strong"
      ? "glass-strong"
      : variant === "subtle"
      ? "glass-subtle"
      : "glass";

  return (
    <div
      className={cn(
        variantClass,
        "rounded-2xl",
        hover && "glass-hover cursor-default",
        className
      )}
    >
      {children}
    </div>
  );
}
