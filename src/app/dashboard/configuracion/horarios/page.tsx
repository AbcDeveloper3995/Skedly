"use client";

import React, { Suspense, useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface ExceptionItem {
  id: string;
  title: string;
  scope: string;
  employee_id?: string | null;
  dateStr: string;
  timeStr: string;
  badge: string;
  badgeColor: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  note?: string;
  rawDate: string;
}

interface DayRow {
  weekday: number;
  name: string;
  isAvailable: boolean;
  statusLabel: string;
  startTime: string;
  endTime: string;
  hasLunch: boolean;
  lunchStart: string;
  lunchEnd: string;
}

interface StaffMember {
  id: string;
  display_name: string;
  role: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

const DEFAULT_SCHEDULE: DayRow[] = [
  { weekday: 1, name: "Lunes", isAvailable: true, statusLabel: "Laborable", startTime: "09:00", endTime: "19:00", hasLunch: true, lunchStart: "14:00", lunchEnd: "15:00" },
  { weekday: 2, name: "Martes", isAvailable: true, statusLabel: "Laborable", startTime: "09:00", endTime: "19:00", hasLunch: true, lunchStart: "14:00", lunchEnd: "15:00" },
  { weekday: 3, name: "Miércoles", isAvailable: true, statusLabel: "Laborable", startTime: "09:00", endTime: "19:00", hasLunch: true, lunchStart: "14:00", lunchEnd: "15:00" },
  { weekday: 4, name: "Jueves", isAvailable: true, statusLabel: "Laborable", startTime: "09:00", endTime: "19:00", hasLunch: true, lunchStart: "14:00", lunchEnd: "15:00" },
  { weekday: 5, name: "Viernes", isAvailable: true, statusLabel: "Laborable", startTime: "09:00", endTime: "19:00", hasLunch: true, lunchStart: "14:00", lunchEnd: "15:00" },
  { weekday: 6, name: "Sábado", isAvailable: true, statusLabel: "Laborable", startTime: "09:00", endTime: "17:00", hasLunch: false, lunchStart: "14:00", lunchEnd: "15:00" },
  { weekday: 0, name: "Domingo", isAvailable: false, statusLabel: "No laborable", startTime: "10:00", endTime: "14:00", hasLunch: false, lunchStart: "14:00", lunchEnd: "15:00" },
];

function HorariosContent() {
  const { currentBusiness } = useAuth();
  const formReasonRef = useRef<HTMLInputElement>(null);

  // Active Tab: business | staff | exceptions
  const [activeTab, setActiveTab] = useState<"business" | "staff" | "exceptions">("business");
  const [loading, setLoading] = useState(true);

  // Real Database Staff
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // Real Database Business Schedule
  const [businessSchedule, setBusinessSchedule] = useState<DayRow[]>(DEFAULT_SCHEDULE);
  const [savingBusinessSchedule, setSavingBusinessSchedule] = useState(false);
  const [savedBusinessSuccess, setSavedBusinessSuccess] = useState(false);

  // Real Database Staff Schedule
  const [staffScheduleMode, setStaffScheduleMode] = useState<"inherit" | "custom">("inherit");
  const [staffSchedule, setStaffSchedule] = useState<DayRow[]>(DEFAULT_SCHEDULE);
  const [savingStaffSchedule, setSavingStaffSchedule] = useState(false);
  const [savedStaffSuccess, setSavedStaffSuccess] = useState(false);

  // Real Database Exceptions
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [exceptionType, setExceptionType] = useState<"vacaciones" | "personal" | "festivo" | "medica">("vacaciones");
  const [scope, setScope] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [timeMode, setTimeMode] = useState<"full_day" | "specific">("full_day");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("14:00");
  const [reason, setReason] = useState("");
  const [savingException, setSavingException] = useState(false);
  const [savedExceptionSuccess, setSavedExceptionSuccess] = useState(false);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // =========================================================================
  // 1. LOAD REAL DATA FROM SUPABASE
  // =========================================================================
  useEffect(() => {
    if (!currentBusiness?.id) return;
    let isMounted = true;

    async function loadAllData() {
      setLoading(true);
      try {
        // A. Load Real Employees
        const { data: emps, error: empsErr } = await supabase
          .from("employees")
          .select("id, display_name, email, phone, avatar_url, is_active, profile_id")
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: true });

        if (!empsErr && emps && isMounted) {
          const mappedStaff: StaffMember[] = emps.map((e) => ({
            id: e.id,
            display_name: e.display_name,
            role: e.profile_id ? "Propietario / Especialista" : "Especialista",
            avatar_url: e.avatar_url || "",
            email: e.email || "",
            phone: e.phone || "",
            is_active: e.is_active ?? true,
          }));
          setStaffList(mappedStaff);
          if (mappedStaff.length > 0) {
            setSelectedStaffId((prev) => prev || mappedStaff[0].id);
          }
        }

        // B. Load General Business Working Hours (where employee_id is null)
        const { data: bHours } = await supabase
          .from("working_hours")
          .select("*")
          .eq("business_id", currentBusiness.id)
          .is("employee_id", null)
          .order("weekday", { ascending: true });

        if (bHours && bHours.length > 0 && isMounted) {
          const merged = DEFAULT_SCHEDULE.map((d) => {
            const found = bHours.find((h: any) => h.weekday === d.weekday);
            if (found) {
              return {
                ...d,
                isAvailable: Boolean(found.is_available),
                statusLabel: found.is_available ? "Laborable" : "No laborable",
                startTime: found.start_time?.slice(0, 5) || d.startTime,
                endTime: found.end_time?.slice(0, 5) || d.endTime,
              };
            }
            return d;
          });
          setBusinessSchedule(merged);
        }

        // C. Load Availability Exceptions
        const { data: excs, error: excErr } = await supabase
          .from("availability_exceptions")
          .select("*")
          .eq("business_id", currentBusiness.id)
          .order("exception_date", { ascending: true });

        if (!excErr && excs && isMounted) {
          const typeMeta = (reasonStr: string) => {
            const lower = (reasonStr || "").toLowerCase();
            if (lower.includes("vacacion")) return { title: "Vacaciones", icon: "beach_access", bg: "bg-primary-fixed", color: "text-primary", badgeColor: "bg-primary-fixed-dim text-on-primary-fixed" };
            if (lower.includes("festiv") || lower.includes("cierre")) return { title: "Festivo / Cierre", icon: "celebration", bg: "bg-error-container", color: "text-on-error-container", badgeColor: "bg-error-container text-on-error-container" };
            if (lower.includes("medic")) return { title: "Pausa médica", icon: "medical_services", bg: "bg-tertiary-fixed", color: "text-tertiary", badgeColor: "bg-tertiary-fixed text-on-tertiary-fixed" };
            return { title: "Excepción de horario", icon: "event_busy", bg: "bg-secondary-container", color: "text-on-secondary-container", badgeColor: "bg-secondary-fixed text-on-secondary-fixed" };
          };

          const mappedExcs: ExceptionItem[] = excs.map((e: any) => {
            const meta = typeMeta(e.reason);
            const targetStaff = emps?.find((emp) => emp.id === e.employee_id);
            const scopeName = e.employee_id ? targetStaff?.display_name || "Colaborador individual" : "Todo el negocio";
            const dateStr = new Date(e.exception_date + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
            const timeStr = e.start_time && e.end_time ? `${e.start_time.slice(0, 5)} - ${e.end_time.slice(0, 5)}` : "Todo el día";

            return {
              id: e.id,
              title: meta.title,
              scope: scopeName,
              employee_id: e.employee_id,
              dateStr,
              timeStr,
              badge: timeStr === "Todo el día" ? "Día bloqueado" : "Franja bloqueada",
              badgeColor: meta.badgeColor,
              icon: meta.icon,
              iconBg: meta.bg,
              iconColor: meta.color,
              note: e.reason || "",
              rawDate: e.exception_date,
            };
          });
          setExceptions(mappedExcs);
        }
      } catch (err) {
        console.error("Error loading horarios data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [currentBusiness?.id]);

  // =========================================================================
  // 2. LOAD STAFF WORKING HOURS WHEN STAFF SELECTION CHANGES
  // =========================================================================
  useEffect(() => {
    if (!currentBusiness?.id || !selectedStaffId) return;
    let isMounted = true;

    async function loadStaffHours() {
      try {
        const { data: wh } = await supabase
          .from("working_hours")
          .select("*")
          .eq("business_id", currentBusiness.id)
          .eq("employee_id", selectedStaffId)
          .order("weekday", { ascending: true });

        if (wh && wh.length > 0 && isMounted) {
          setStaffScheduleMode("custom");
          const merged = DEFAULT_SCHEDULE.map((d) => {
            const found = wh.find((h: any) => h.weekday === d.weekday);
            if (found) {
              return {
                ...d,
                isAvailable: Boolean(found.is_available),
                statusLabel: found.is_available ? "Laborable" : "No laborable",
                startTime: found.start_time?.slice(0, 5) || d.startTime,
                endTime: found.end_time?.slice(0, 5) || d.endTime,
              };
            }
            return { ...d, isAvailable: false, statusLabel: "No laborable" };
          });
          setStaffSchedule(merged);
        } else if (isMounted) {
          setStaffScheduleMode("inherit");
          setStaffSchedule(businessSchedule);
        }
      } catch (err) {
        console.warn("Error loading staff hours:", err);
      }
    }

    loadStaffHours();
    return () => {
      isMounted = false;
    };
  }, [selectedStaffId, currentBusiness?.id, businessSchedule]);

  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  // Computed Metrics
  const businessActiveDays = useMemo(() => businessSchedule.filter((d) => d.isAvailable), [businessSchedule]);
  const businessWeeklyHours = useMemo(() => {
    let total = 0;
    businessActiveDays.forEach((d) => {
      const [sh, sm] = d.startTime.split(":").map(Number);
      const [eh, em] = d.endTime.split(":").map(Number);
      let diff = eh + em / 60 - (sh + sm / 60);
      if (d.hasLunch) diff -= 1.0;
      if (diff > 0) total += diff;
    });
    return Math.round(total * 10) / 10;
  }, [businessActiveDays]);

  const staffActiveDays = useMemo(() => staffSchedule.filter((d) => d.isAvailable), [staffSchedule]);
  const staffWeeklyHours = useMemo(() => {
    let total = 0;
    staffActiveDays.forEach((d) => {
      const [sh, sm] = d.startTime.split(":").map(Number);
      const [eh, em] = d.endTime.split(":").map(Number);
      let diff = eh + em / 60 - (sh + sm / 60);
      if (d.hasLunch) diff -= 1.0;
      if (diff > 0) total += diff;
    });
    return Math.round(total * 10) / 10;
  }, [staffActiveDays]);

  // =========================================================================
  // ACTIONS: BUSINESS SCHEDULE
  // =========================================================================
  const handleToggleBusinessDay = (weekday: number) => {
    setBusinessSchedule((prev) =>
      prev.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              isAvailable: !day.isAvailable,
              statusLabel: !day.isAvailable ? "Laborable" : "No laborable",
            }
          : day
      )
    );
  };

  const handleBusinessShiftChange = (weekday: number, field: "startTime" | "endTime", val: string) => {
    setBusinessSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, [field]: val } : day))
    );
  };

  const handleCopyBusinessMonday = () => {
    const monday = businessSchedule.find((s) => s.weekday === 1) || businessSchedule[0];
    setBusinessSchedule((prev) =>
      prev.map((day) =>
        day.weekday >= 1 && day.weekday <= 5
          ? {
              ...day,
              isAvailable: monday.isAvailable,
              statusLabel: monday.statusLabel,
              startTime: monday.startTime,
              endTime: monday.endTime,
              hasLunch: monday.hasLunch,
              lunchStart: monday.lunchStart,
              lunchEnd: monday.lunchEnd,
            }
          : day
      )
    );
    showToast("Horario de Lunes copiado a Martes-Viernes.");
  };

  const handleSaveBusinessSchedule = async () => {
    if (!currentBusiness?.id) return;
    setSavingBusinessSchedule(true);
    try {
      // Delete old general business hours
      await supabase
        .from("working_hours")
        .delete()
        .eq("business_id", currentBusiness.id)
        .is("employee_id", null);

      // Insert new rows
      const inserts = businessSchedule.map((d) => ({
        business_id: currentBusiness.id,
        employee_id: null,
        weekday: d.weekday,
        start_time: d.startTime.length === 5 ? d.startTime + ":00" : d.startTime,
        end_time: d.endTime.length === 5 ? d.endTime + ":00" : d.endTime,
        is_available: d.isAvailable,
      }));

      const { error } = await supabase.from("working_hours").insert(inserts);
      if (error) throw error;

      setSavedBusinessSuccess(true);
      showToast("Horario general del negocio guardado correctamente.");
      setTimeout(() => setSavedBusinessSuccess(false), 2400);
    } catch (err) {
      console.error("Error saving business schedule:", err);
      showToast("Error al guardar el horario.");
    } finally {
      setSavingBusinessSchedule(false);
    }
  };

  // =========================================================================
  // ACTIONS: STAFF SCHEDULE
  // =========================================================================
  const handleToggleStaffDay = (weekday: number) => {
    setStaffSchedule((prev) =>
      prev.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              isAvailable: !day.isAvailable,
              statusLabel: !day.isAvailable ? "Laborable" : "No laborable",
            }
          : day
      )
    );
  };

  const handleStaffShiftChange = (weekday: number, field: "startTime" | "endTime", val: string) => {
    setStaffSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, [field]: val } : day))
    );
  };

  const handleSaveStaffSchedule = async () => {
    if (!currentBusiness?.id || !selectedStaffId) return;
    setSavingStaffSchedule(true);
    try {
      // 1. Delete previous custom hours for this employee
      await supabase
        .from("working_hours")
        .delete()
        .eq("business_id", currentBusiness.id)
        .eq("employee_id", selectedStaffId);

      if (staffScheduleMode === "custom") {
        // 2. Insert custom schedule
        const inserts = staffSchedule.map((d) => ({
          business_id: currentBusiness.id,
          employee_id: selectedStaffId,
          weekday: d.weekday,
          start_time: d.startTime.length === 5 ? d.startTime + ":00" : d.startTime,
          end_time: d.endTime.length === 5 ? d.endTime + ":00" : d.endTime,
          is_available: d.isAvailable,
        }));
        const { error } = await supabase.from("working_hours").insert(inserts);
        if (error) throw error;
        showToast(`Horario personalizado guardado para ${selectedStaff?.display_name || "el colaborador"}.`);
      } else {
        // Inheriting business schedule: hours deleted, will inherit general
        setStaffSchedule(businessSchedule);
        showToast(`${selectedStaff?.display_name || "El colaborador"} ahora hereda el horario del negocio.`);
      }

      setSavedStaffSuccess(true);
      setTimeout(() => setSavedStaffSuccess(false), 2400);
    } catch (err) {
      console.error("Error saving staff schedule:", err);
      showToast("Error al guardar la disponibilidad del colaborador.");
    } finally {
      setSavingStaffSchedule(false);
    }
  };

  // =========================================================================
  // ACTIONS: EXCEPTIONS & BLOCKS
  // =========================================================================
  const handleSaveException = async () => {
    if (!currentBusiness?.id) return;
    if (!dateFrom) {
      showToast("Por favor selecciona una fecha válida.");
      return;
    }

    setSavingException(true);
    try {
      const typeLabels = {
        vacaciones: { title: "Vacaciones", icon: "beach_access", bg: "bg-primary-fixed", color: "text-primary", badgeColor: "bg-primary-fixed-dim text-on-primary-fixed" },
        personal: { title: "Asunto personal", icon: "person", bg: "bg-secondary-container", color: "text-on-secondary-container", badgeColor: "bg-secondary-fixed text-on-secondary-fixed" },
        festivo: { title: "Festivo / Cierre", icon: "celebration", bg: "bg-error-container", color: "text-on-error-container", badgeColor: "bg-error-container text-on-error-container" },
        medica: { title: "Pausa médica", icon: "medical_services", bg: "bg-tertiary-fixed", color: "text-tertiary", badgeColor: "bg-tertiary-fixed text-on-tertiary-fixed" },
      };

      const meta = typeLabels[exceptionType];
      const targetStaff = staffList.find((s) => s.id === scope);
      const scopeLabel = scope === "all" ? "Todo el negocio" : targetStaff?.display_name || "Colaborador individual";
      const targetEmpId = scope === "all" ? null : scope;

      const startTimeVal = timeMode === "full_day" ? null : timeStart.length === 5 ? timeStart + ":00" : timeStart;
      const endTimeVal = timeMode === "full_day" ? null : timeEnd.length === 5 ? timeEnd + ":00" : timeEnd;

      const { data: inserted, error } = await supabase
        .from("availability_exceptions")
        .insert({
          business_id: currentBusiness.id,
          employee_id: targetEmpId,
          exception_date: dateFrom,
          is_available: false,
          start_time: startTimeVal,
          end_time: endTimeVal,
          reason: reason.trim() || meta.title,
        })
        .select()
        .single();

      if (error) throw error;

      const dateStr = new Date(dateFrom + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
      const timeStr = timeMode === "full_day" ? "Todo el día" : `${timeStart} - ${timeEnd}`;

      const newExcItem: ExceptionItem = {
        id: inserted?.id || `exc-${Date.now()}`,
        title: meta.title,
        scope: scopeLabel,
        employee_id: targetEmpId,
        dateStr,
        timeStr,
        badge: timeMode === "full_day" ? "Día bloqueado" : "Franja bloqueada",
        badgeColor: meta.badgeColor,
        icon: meta.icon,
        iconBg: meta.bg,
        iconColor: meta.color,
        note: reason.trim() || meta.title,
        rawDate: dateFrom,
      };

      setExceptions((prev) => [newExcItem, ...prev]);
      setSavedExceptionSuccess(true);
      setReason("");
      showToast("Excepción registrada en la base de datos.");
      setTimeout(() => setSavedExceptionSuccess(false), 2400);
    } catch (err) {
      console.error("Error saving exception:", err);
      showToast("Error al registrar la excepción.");
    } finally {
      setSavingException(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await supabase.from("availability_exceptions").delete().eq("id", id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      showToast("Excepción eliminada.");
    } catch (err) {
      console.error("Error deleting exception:", err);
      showToast("Error al eliminar la excepción.");
    }
  };

  const handleQuickExceptionClick = () => {
    setActiveTab("exceptions");
    setTimeout(() => {
      if (formReasonRef.current) {
        formReasonRef.current.focus();
        formReasonRef.current.classList.add("ring-2", "ring-primary");
        setTimeout(() => {
          formReasonRef.current?.classList.remove("ring-2", "ring-primary");
        }, 1500);
      }
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="text-sm font-semibold">Cargando disponibilidad y horarios del negocio...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 gap-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-on-surface text-surface shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-[18px] text-primary-container">
            check_circle
          </span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TOP PAGE TITLE & HEADER
      ========================================================================== */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
              <Link href="/dashboard" className="hover:text-on-surface">
                Dashboard
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-bold">Horarios y Disponibilidad</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Horarios y Disponibilidad de Agenda
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl">
              Configura los días y turnos de apertura de {currentBusiness?.name || "tu negocio"}, gestiona la disponibilidad individual de tu equipo y registra bloqueos puntuales.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleQuickExceptionClick}
              className="flex items-center gap-2 px-4 h-11 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all shadow-sm text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">event_busy</span>
              <span>+ Registrar excepción / bloqueo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-container rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "business"
                ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>Horarios del Negocio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "staff"
                ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Disponibilidad por Colaborador ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exceptions")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "exceptions"
                ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">event_busy</span>
            <span>Excepciones y Vacaciones</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${activeTab === "exceptions" ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
              {exceptions.length}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          OPERATIONAL METRIC STATS (REAL DATA)
      ========================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Apertura Semanal
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">
              {businessActiveDays.length} días
            </span>
            <span className="text-[11px] text-primary flex items-center gap-0.5 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">schedule</span> {businessWeeklyHours}h abiertas / sem.
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">storefront</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Equipo en Agenda
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">
              {staffList.length} {staffList.length === 1 ? "profesional" : "profesionales"}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {staffList.filter((s) => s.is_active).length} activos para reservas
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Excepciones Activas
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">
              {exceptions.length} {exceptions.length === 1 ? "bloqueo" : "bloqueos"}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">
              {exceptions.length > 0 ? "Días con horario especial" : "Sin bloqueos vigentes"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[24px]">event_busy</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Próximo Bloqueo
            </span>
            <span className="text-lg font-bold text-on-surface mt-0.5 truncate max-w-[160px]">
              {exceptions[0]?.dateStr || "Sin bloqueos"}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium mt-1 truncate max-w-[160px]">
              {exceptions[0]?.scope || "Horario regular activo"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: HORARIOS GENERALES DEL NEGOCIO
      ========================================================================== */}
      {activeTab === "business" && (
        <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-container">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">storefront</span>
                <h2 className="text-lg font-bold text-on-surface">Horario General de Atención del Negocio</h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Define las horas regulares en que tu establecimiento está abierto al público. Los colaboradores heredarán este horario de forma predeterminada.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyBusinessMonday}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">content_copy</span>
              <span>Copiar Lunes a toda la semana</span>
            </button>
          </div>

          {/* Grid of Days */}
          <div className="flex flex-col gap-2.5">
            {businessSchedule.map((day) => (
              <div
                key={day.weekday}
                className={`p-3.5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all border ${
                  day.isAvailable
                    ? "bg-surface-container-low hover:bg-surface-container border-outline-variant/20"
                    : "bg-surface-container/60 border-transparent opacity-75"
                }`}
              >
                <div className="flex items-center gap-3 min-w-[140px]">
                  {/* Switch toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.isAvailable}
                      onChange={() => handleToggleBusinessDay(day.weekday)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${day.isAvailable ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {day.name}
                    </span>
                    <span className={`text-[10px] font-semibold ${day.isAvailable ? "text-primary" : "text-error"}`}>
                      {day.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Shift Hours */}
                {day.isAvailable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
                      <span className="text-[11px] text-on-surface-variant font-medium">Horario de apertura:</span>
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => handleBusinessShiftChange(day.weekday, "startTime", e.target.value)}
                        className="bg-transparent text-on-surface text-xs font-bold focus:outline-none cursor-pointer"
                      />
                      <span className="text-outline text-xs font-sans">a</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleBusinessShiftChange(day.weekday, "endTime", e.target.value)}
                        className="bg-transparent text-on-surface text-xs font-bold focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant text-[11px] font-medium border border-outline-variant/20">
                      Cerrado al público • Sin agendamiento online
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Save Button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={handleSaveBusinessSchedule}
              disabled={savingBusinessSchedule}
              className={`px-6 h-11 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 ${
                savedBusinessSuccess
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-primary text-on-primary hover:bg-primary-container"
              }`}
            >
              {savingBusinessSchedule ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Guardando horario del negocio...</span>
                </>
              ) : savedBusinessSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>¡Horario Guardado Exitosamente!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Guardar horario del negocio</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DISPONIBILIDAD POR COLABORADOR
      ========================================================================== */}
      {activeTab === "staff" && (
        <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-6">
          {staffList.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-low rounded-2xl border border-surface-container">
              <span className="material-symbols-outlined text-4xl text-outline">group_off</span>
              <h3 className="text-sm font-bold text-on-surface">No hay empleados registrados</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Registra profesionales en tu negocio desde el módulo de empleados para configurar sus horarios individuales.
              </p>
              <Link
                href="/dashboard/empleados/nuevo"
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
              >
                + Registrar colaborador
              </Link>
            </div>
          ) : (
            <>
              {/* Staff Selector Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary text-on-primary flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                    {selectedStaff?.avatar_url ? (
                      <img src={selectedStaff.avatar_url} alt={selectedStaff.display_name} className="w-full h-full object-cover" />
                    ) : (
                      selectedStaff?.display_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-on-surface">{selectedStaff?.display_name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                        {selectedStaff?.role}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {selectedStaff?.email || "Sin email"} • {staffWeeklyHours}h asignadas
                    </span>
                  </div>
                </div>

                {/* Dropdown to switch staff */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Cambiar profesional:</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="h-10 pl-3 pr-8 bg-surface-container-low text-on-surface rounded-xl text-xs font-semibold focus:bg-surface-container-lowest focus:outline-none cursor-pointer border border-outline-variant/30"
                  >
                    {staffList.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.display_name} ({col.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Toggle: Inherit vs Custom */}
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-on-surface leading-tight">
                      Régimen de Horario de {selectedStaff?.display_name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Elige si este colaborador sigue las horas generales del negocio o tiene turnos propios.
                    </span>
                  </div>
                </div>

                <div className="flex bg-surface-container p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStaffScheduleMode("inherit")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      staffScheduleMode === "inherit"
                        ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Heredar horario del negocio
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffScheduleMode("custom")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      staffScheduleMode === "custom"
                        ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Horario individual personalizado
                  </button>
                </div>
              </div>

              {/* Weekly Schedule Grid */}
              <div className="flex flex-col gap-2.5">
                {staffSchedule.map((day) => (
                  <div
                    key={day.weekday}
                    className={`p-3.5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all border ${
                      day.isAvailable
                        ? "bg-surface-container-low hover:bg-surface-container border-outline-variant/20"
                        : "bg-surface-container/60 border-transparent opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={staffScheduleMode === "inherit"}
                          checked={day.isAvailable}
                          onChange={() => handleToggleStaffDay(day.weekday)}
                          className="sr-only peer disabled:opacity-50"
                        />
                        <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${day.isAvailable ? "text-on-surface" : "text-on-surface-variant"}`}>
                          {day.name}
                        </span>
                        <span className={`text-[10px] font-semibold ${day.isAvailable ? "text-primary" : "text-error"}`}>
                          {day.statusLabel}
                        </span>
                      </div>
                    </div>

                    {day.isAvailable ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
                          <span className="text-[11px] text-on-surface-variant font-medium">Turno:</span>
                          <input
                            type="time"
                            disabled={staffScheduleMode === "inherit"}
                            value={day.startTime}
                            onChange={(e) => handleStaffShiftChange(day.weekday, "startTime", e.target.value)}
                            className="bg-transparent text-on-surface text-xs font-bold focus:outline-none disabled:opacity-70 cursor-pointer"
                          />
                          <span className="text-outline text-xs font-sans">a</span>
                          <input
                            type="time"
                            disabled={staffScheduleMode === "inherit"}
                            value={day.endTime}
                            onChange={(e) => handleStaffShiftChange(day.weekday, "endTime", e.target.value)}
                            className="bg-transparent text-on-surface text-xs font-bold focus:outline-none disabled:opacity-70 cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant text-[11px] font-medium border border-outline-variant/20">
                          Día libre • No recibe reservas online este día
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Save Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={handleSaveStaffSchedule}
                  disabled={savingStaffSchedule}
                  className={`px-6 h-11 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 ${
                    savedStaffSuccess
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-primary text-on-primary hover:bg-primary-container"
                  }`}
                >
                  {savingStaffSchedule ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Guardando disponibilidad...</span>
                    </>
                  ) : savedStaffSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>¡Disponibilidad Guardada!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Guardar disponibilidad de {selectedStaff?.display_name}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: EXCEPCIONES Y VACACIONES (DUAL PANEL)
      ========================================================================== */}
      {activeTab === "exceptions" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* LEFT PANEL: Formulario para Registrar Excepción */}
          <section className="xl:col-span-5 flex flex-col gap-6">
            <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">add_circle</span>
                  <h2 className="text-base font-bold text-on-surface">Registrar Excepción o Bloqueo</h2>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Inhabilita turnos temporalmente para todo el negocio o para profesionales individuales (vacaciones, citas médicas o festivos).
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveException();
                }}
                className="flex flex-col gap-4"
              >
                {/* 1. Exception Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">Tipo de excepción</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "vacaciones", label: "Vacaciones" },
                      { id: "personal", label: "Asunto personal" },
                      { id: "festivo", label: "Festivo / Cierre" },
                      { id: "medica", label: "Pausa médica" },
                    ].map((chip) => {
                      const isSelected = exceptionType === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setExceptionType(chip.id as any)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            isSelected
                              ? "bg-primary text-on-primary font-semibold shadow-sm"
                              : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Scope / Target (Real DB Staff) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">Ámbito de aplicación</label>
                  <div className="relative">
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="w-full h-11 px-3.5 pr-10 bg-surface-container-low text-on-surface rounded-xl text-xs font-semibold focus:bg-surface-container-lowest focus:outline-none appearance-none cursor-pointer border border-outline-variant/30 focus:border-primary"
                    >
                      <option value="all">🏢 Todo el negocio (Cierre general)</option>
                      {staffList.map((col) => (
                        <option key={col.id} value={col.id}>
                          👤 {col.display_name} ({col.role})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* 3. Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface">Fecha</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-11 px-3 bg-surface-container-low text-on-surface rounded-xl text-xs font-medium focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30 focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface">Duración</label>
                    <div className="flex bg-surface-container p-0.5 rounded-xl h-11 items-center">
                      <button
                        type="button"
                        onClick={() => setTimeMode("full_day")}
                        className={`flex-1 h-full rounded-lg text-xs transition-all ${
                          timeMode === "full_day"
                            ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        Todo el día
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeMode("specific")}
                        className={`flex-1 h-full rounded-lg text-xs transition-all ${
                          timeMode === "specific"
                            ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        Horas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specific Hours Row */}
                {timeMode === "specific" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-on-surface-variant font-medium">Hora inicio</span>
                      <input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        className="h-9 px-2 bg-surface-container-lowest rounded-lg text-on-surface text-xs focus:outline-none border border-outline-variant/30 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-on-surface-variant font-medium">Hora fin</span>
                      <input
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className="h-9 px-2 bg-surface-container-lowest rounded-lg text-on-surface text-xs focus:outline-none border border-outline-variant/30 font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Motivo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">Motivo del bloqueo</label>
                  <input
                    ref={formReasonRef}
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Vacaciones de verano, Cierre por inventario..."
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl text-xs focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30 focus:border-primary placeholder:text-outline transition-all"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={savingException}
                  className={`w-full h-11 mt-1 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                    savedExceptionSuccess
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-primary text-on-primary hover:bg-primary-container"
                  }`}
                >
                  {savingException ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      <span>Guardando excepción...</span>
                    </>
                  ) : savedExceptionSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[20px]">done</span>
                      <span>¡Excepción Registrada!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                      <span>Guardar excepción y bloquear turnos</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT PANEL: Lista de Excepciones Programadas Reales */}
          <section className="xl:col-span-7 flex flex-col gap-4">
            <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">format_list_bulleted</span>
                  <h3 className="text-base font-bold text-on-surface">Excepciones Registradas en el Sistema</h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                  {exceptions.length} activas
                </span>
              </div>

              {exceptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">event_available</span>
                  <h4 className="text-sm font-bold text-on-surface">Sin excepciones ni bloqueos registrados</h4>
                  <p className="text-xs text-on-surface-variant max-w-xs mt-1">
                    Tu negocio y colaboradores operan en sus horarios habituales sin días festivos o ausencias programadas.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="p-4 bg-surface-container-low hover:bg-surface-container transition-all rounded-xl flex flex-col gap-2.5 border border-outline-variant/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${exc.iconBg} ${exc.iconColor} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-[18px]">{exc.icon}</span>
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-on-surface leading-tight">{exc.title}</h4>
                            <p className="text-[11px] text-on-surface-variant">
                              Ámbito: <strong className="text-on-surface font-semibold">{exc.scope}</strong>
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${exc.badgeColor}`}>
                          {exc.badge}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-surface-container-high/40">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                          <span className="text-on-surface font-semibold">{exc.dateStr}</span>
                          <span className="text-outline">•</span>
                          <span>{exc.timeStr}</span>
                          {exc.note && (
                            <>
                              <span className="text-outline">•</span>
                              <span className="text-on-surface-variant italic">{exc.note}</span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteException(exc.id)}
                          className="px-2 py-1 rounded text-error hover:bg-error-container text-[11px] font-medium transition-colors"
                          title="Eliminar excepción"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionHorariosPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[500px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            <span>Cargando matriz de disponibilidad...</span>
          </div>
        </div>
      }
    >
      <HorariosContent />
    </Suspense>
  );
}
