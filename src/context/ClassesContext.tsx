"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { MOCK_CLASSES } from "@/lib/mockData";
import type { PraktikumClass } from "@/types";

// ── Storage key ──────────────────────────────────────────────
const STORAGE_KEY = "presenslab_classes_v2";

// ── Context shape ────────────────────────────────────────────
interface ClassesContextValue {
  classes: PraktikumClass[];
  addClass: (kelas: PraktikumClass) => void;
  updateClass: (id: string, patch: Partial<PraktikumClass>) => void;
  deleteClass: (id: string) => void;
}

const ClassesContext = createContext<ClassesContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<PraktikumClass[]>(() => {
    if (typeof window === "undefined") return MOCK_CLASSES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as PraktikumClass[];
    } catch {/* ignore */}
    return MOCK_CLASSES;
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch {/* ignore */}
  }, [classes]);

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
    <ClassesContext.Provider value={{ classes, addClass, updateClass, deleteClass }}>
      {children}
    </ClassesContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within <ClassesProvider>");
  return ctx;
}
