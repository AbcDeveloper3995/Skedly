"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

type ViewMode = "owner" | "employee";

interface DashboardViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isQuickAppointmentOpen: boolean;
  setIsQuickAppointmentOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  employeeName: string;
}

const DashboardViewContext = createContext<DashboardViewContextType>({
  viewMode: "owner",
  setViewMode: () => {},
  isQuickAppointmentOpen: false,
  setIsQuickAppointmentOpen: () => {},
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
  employeeName: "Mateo Ramos",
});

export function DashboardViewProvider({ children }: { children: React.ReactNode }) {
  const { membership } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("owner");
  const [isQuickAppointmentOpen, setIsQuickAppointmentOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (membership?.role === "employee") {
      setViewMode("employee");
    }
  }, [membership]);

  return (
    <DashboardViewContext.Provider
      value={{
        viewMode,
        setViewMode,
        isQuickAppointmentOpen,
        setIsQuickAppointmentOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        employeeName: "Mateo Ramos",
      }}
    >
      {children}
    </DashboardViewContext.Provider>
  );
}

export function useDashboardView() {
  return useContext(DashboardViewContext);
}
