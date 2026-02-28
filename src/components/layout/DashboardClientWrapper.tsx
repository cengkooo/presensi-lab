"use client";

import { ClassesProvider } from "@/context/ClassesContext";
import type { ReactNode } from "react";

export function DashboardClientWrapper({ children }: { children: ReactNode }) {
  return <ClassesProvider>{children}</ClassesProvider>;
}
