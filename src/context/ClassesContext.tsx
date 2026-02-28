"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import type { PraktikumClass } from "@/types";

// ── Context shape ─────────────────────────────────────────────
interface ClassesContextValue {
  classes:     PraktikumClass[];
  loading:     boolean;
  addClass:    (kelas: PraktikumClass) => void;
  updateClass: (id: string, patch: Partial<PraktikumClass>) => void;
  deleteClass: (id: string) => void;
  refetch:     () => void;
}

const ClassesContext = createContext<ClassesContextValue | null>(null);

// ── Adapter: API response → PraktikumClass ─────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClass(raw: any): PraktikumClass {
  return {
    id:                     raw.id,
    code:                   raw.code ?? "",
    name:                   raw.name ?? "",
    semester:               raw.semester ?? "",
    lecturer:               raw.lecturer ?? raw.dosen ?? "",
    location:               raw.location ?? "",
    total_sessions_planned: raw.total_sessions_planned ?? 14,
    min_attendance_pct:     raw.min_attendance_pct ?? 75,
    created_at:             raw.created_at ?? "",
  };
}

// ── Provider ──────────────────────────────────────────────────
export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<PraktikumClass[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tick, setTick]         = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    setLoading(true);
    fetch("/api/classes", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setClasses(json.data.map(toClass));
        }
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, [tick]);

  // Optimistic helpers — real persistence done via dedicated API routes
  const addClass = useCallback((kelas: PraktikumClass) => {
    setClasses((prev) => [...prev, kelas]);
  }, []);

  const updateClass = useCallback((id: string, patch: Partial<PraktikumClass>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <ClassesContext.Provider value={{ classes, loading, addClass, updateClass, deleteClass, refetch }}>
      {children}
    </ClassesContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within <ClassesProvider>");
  return ctx;
}
