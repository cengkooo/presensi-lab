"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ClassOption {
  id: string;
  code: string;
  name: string;
}

export interface EnrollPopoverProps {
  targetUserId: string;
  targetUserName: string | null;
  enrolledClassIds: Set<string>;
  allClasses: ClassOption[];
  /** DOMRect of the anchor button — used for fixed positioning */
  anchorRect: DOMRect;
  onSuccess: (classId: string, classCode: string, className: string) => void;
  onClose: () => void;
}

export function EnrollPopover({
  targetUserId,
  enrolledClassIds,
  allClasses,
  anchorRect,
  onSuccess,
  onClose,
}: EnrollPopoverProps) {
  const [search, setSearch] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const available = allClasses.filter((c) => !enrolledClassIds.has(c.id));
  const filtered = available.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  // Position: fixed, below the anchor button, left-aligned
  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 6,
    left: anchorRect.left,
    zIndex: 9999,
    background: "rgba(10,25,15,0.97)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(74,222,128,0.2)",
    borderRadius: "12px",
    padding: "12px",
    minWidth: "220px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // defer slightly so the button-click that opened us isn't also the close-click
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleEnroll = useCallback(async (cls: ClassOption) => {
    setEnrolling(cls.id);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createSupabaseBrowserClient() as any;
      const { error: dbErr } = await supabase
        .from("enrollments")
        .insert({ class_id: cls.id, user_id: targetUserId, peran: "mahasiswa" });
      if (dbErr) {
        setError(dbErr.message ?? "Gagal mendaftarkan mahasiswa.");
      } else {
        onSuccess(cls.id, cls.code, cls.name);
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setEnrolling(null);
    }
  }, [targetUserId, onSuccess]);

  return (
    <div ref={ref} style={style}>
      {/* Title */}
      <p style={{ fontSize: "10px", fontWeight: 700, color: "#10B981", marginBottom: "8px", letterSpacing: "0.08em" }}>
        DAFTARKAN KE KELAS
      </p>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "8px" }}>
        <Search
          size={11}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(110,231,183,0.35)", pointerEvents: "none" }}
        />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kelas..."
          style={{
            width: "100%",
            padding: "6px 8px 6px 26px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "8px",
            color: "#f0fdf4",
            fontSize: "12px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: "11px", color: "#f87171", marginBottom: "6px", padding: "4px 6px", background: "rgba(239,68,68,0.08)", borderRadius: "6px" }}>
          {error}
        </p>
      )}

      {/* Class list */}
      {available.length === 0 ? (
        <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.35)", textAlign: "center", padding: "10px 0" }}>
          Sudah terdaftar di semua kelas.
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.3)", textAlign: "center", padding: "8px 0" }}>
          Tidak ada hasil.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxHeight: "200px", overflowY: "auto" }}>
          {filtered.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleEnroll(cls)}
              disabled={!!enrolling}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 8px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(16,185,129,0.08)",
                color: "#f0fdf4",
                cursor: enrolling ? "not-allowed" : "pointer",
                textAlign: "left",
                width: "100%",
                opacity: enrolling === cls.id ? 0.5 : 1,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!enrolling) (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0fdf4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cls.name}
                </p>
                <p style={{ fontSize: "10px", color: "rgba(110,231,183,0.4)" }}>{cls.code}</p>
              </div>
              {enrolling === cls.id ? (
                <RefreshCw size={12} style={{ color: "#34D399", flexShrink: 0, animation: "spin 0.8s linear infinite" }} />
              ) : (
                <Plus size={12} style={{ color: "#34D399", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
