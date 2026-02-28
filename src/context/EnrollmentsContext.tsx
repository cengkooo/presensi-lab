"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { MOCK_ENROLLMENTS } from "@/lib/mockData";
import type { Enrollment } from "@/types";

const STORAGE_KEY = "presenslab_enrollments_v1";

interface EnrollmentsContextType {
  enrollments: Enrollment[];
  addEnrollment: (classId: string, userId: string) => void;
  removeEnrollment: (classId: string, userId: string) => void;
  updateEnrollmentPeran: (classId: string, userId: string, peran: Enrollment["peran"]) => void;
}

const EnrollmentsContext = createContext<EnrollmentsContextType | null>(null);

export function EnrollmentsProvider({ children }: { children: ReactNode }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    if (typeof window === "undefined") return [...MOCK_ENROLLMENTS];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<Omit<Enrollment, "peran"> & { peran?: Enrollment["peran"] }>;
        // Migrate: add peran:"mahasiswa" to old entries that lack it
        return parsed.map((e) => ({ ...e, peran: e.peran ?? "mahasiswa" })) as Enrollment[];
      }
    } catch {}
    return [...MOCK_ENROLLMENTS];
  });

  const persist = (list: Enrollment[]) => {
    setEnrollments(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  };

  const addEnrollment = (classId: string, userId: string) => {
    if (enrollments.some(e => e.class_id === classId && e.user_id === userId)) return;
    const newEnr: Enrollment = {
      id: `enr_${Date.now()}`,
      class_id: classId,
      user_id: userId,
      enrolled_at: new Date().toISOString(),
      is_eligible: null,
      peran: "mahasiswa",
    };
    persist([...enrollments, newEnr]);
  };

  const removeEnrollment = (classId: string, userId: string) => {
    persist(enrollments.filter(e => !(e.class_id === classId && e.user_id === userId)));
  };

  const updateEnrollmentPeran = (classId: string, userId: string, peran: Enrollment["peran"]) => {
    persist(enrollments.map(e =>
      e.class_id === classId && e.user_id === userId ? { ...e, peran } : e
    ));
  };

  return (
    <EnrollmentsContext.Provider value={{ enrollments, addEnrollment, removeEnrollment, updateEnrollmentPeran }}>
      {children}
    </EnrollmentsContext.Provider>
  );
}

export function useEnrollments() {
  const ctx = useContext(EnrollmentsContext);
  if (!ctx) throw new Error("useEnrollments must be used within EnrollmentsProvider");
  return ctx;
}
