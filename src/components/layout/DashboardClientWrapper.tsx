"use client";

import { ClassesProvider } from "@/context/ClassesContext";
import { EnrollmentsProvider } from "@/context/EnrollmentsContext";
import type { ReactNode } from "react";

export function DashboardClientWrapper({ children }: { children: ReactNode }) {
  return (
    <ClassesProvider>
      <EnrollmentsProvider>{children}</EnrollmentsProvider>
    </ClassesProvider>
  );
}
