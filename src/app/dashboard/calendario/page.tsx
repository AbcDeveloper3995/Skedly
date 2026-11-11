"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { CalendarAppointment } from "./mock-data";

// Timezone configuration for Cancún, Quintana Roo, México (UTC-5 year-round)
const CANCUN_TZ = "America/Cancun";

interface CancunNow {
  isoDate: string;
  timeStr: string;
  hour: number;
  minute: number;
}

function getCancunNow(): CancunNow {
  const now = new Date();
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: CANCUN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const timeStr = new Intl.DateTimeFormat("es-MX", {
    timeZone: CANCUN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const [hStr, mStr] = timeStr.split(":");
  return {
    isoDate,
    timeStr,
    hour: parseInt(hStr, 10) || 0,
    minute: parseInt(mStr, 10) || 0,
  };
}

function formatCancunDate(isoDateStr: string, options: Intl.DateTimeFormatOptions) {
  const [year, month, day] = isoDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("es-MX", { ...options, timeZone: CANCUN_TZ }).format(date);
}

function addDaysToDate(isoDateStr: string, days: number): string {
  const [year, month, day] = isoDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

interface WeekDayItem {
  iso: string;
  dayNum: number;
  shortName: string;
  fullName: string;
  monthName: string;
  year: number;
  isToday: boolean;
}

function getCancunWeekDays(baseIsoDate: string): WeekDayItem[] {
  const [year, month, day] = baseIsoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);

  const cancunToday = getCancunNow().isoDate;
  const dayNamesShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const dayNamesFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const daysList: WeekDayItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const iso = d.toISOString().split("T")[0];
    daysList.push({
      iso,
      dayNum: d.getUTCDate(),
      shortName: dayNamesShort[i],
      fullName: dayNamesFull[i],
      monthName: monthNames[d.getUTCMonth()],
      year: d.getUTCFullYear(),
      isToday: iso === cancunToday,
    });
  }
  return daysList;
}

interface Collaborator {
  id: string;
  display_name: string;
  avatar_url?: string;
  role?: string;
}

function CalendarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "dia" ? "dia" : "semana";
  const { currentBusiness } = useAuth();

  // Cancun time and date
  const [cancunTime, setCancunTime] = useState<CancunNow>(getCancunNow);

  // Keep Cancun time updated every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCancunTime(getCancunNow());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // State
  const [viewMode, setViewMode] = useState<"semana" | "dia">(initialView);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => getCancunNow().isoDate);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(true);

  // Modals & Feedback
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<CalendarAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(() => getCancunNow().isoDate);
  const [rescheduleSlot, setRescheduleSlot] = useState("11:30 - 12:30");
  const [rescheduleStaff, setRescheduleStaff] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Fetch Collaborators (Employees) from Supabase
  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!currentBusiness?.id) {
        setCollaborators([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id, display_name, avatar_url, role")
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          setCollaborators(data);
        } else {
          // Fallback to business owner as default specialist
          setCollaborators([
            {
              id: "owner",
              display_name: currentBusiness.name || "Especialista Principal",
              avatar_url: "/avatars/avatar-1.jpg",
              role: "Propietario / Especialista",
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading collaborators:", err);
      }
    };

    fetchCollaborators();
  }, [currentBusiness]);

  // Load real Appointments from Supabase
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentBusiness?.id) {
        setAppointments([]);
        setSelectedAppointmentId(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            id,
            start_at,
            end_at,
            status,
            customer_name_snapshot,
            customer_phone_snapshot,
            employee:employees(id, display_name, avatar_url),
            appointment_services(service_name, unit_price)
          `)
          .eq("business_id", currentBusiness.id)
          .order("start_at", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: CalendarAppointment[] = data.map((dbApp: any) => {
            const startDate = dbApp.start_at.split("T")[0];
            const startTime = dbApp.start_at.split("T")[1]?.slice(0, 5) || "10:00";
            const endTime = dbApp.end_at.split("T")[1]?.slice(0, 5) || "11:00";
            const srv = dbApp.appointment_services?.[0];

            return {
              id: dbApp.id,
              code: `#CIT-${dbApp.id.slice(0, 4).toUpperCase()}`,
              clientName: dbApp.customer_name_snapshot || "Cliente",
              clientPhone: dbApp.customer_phone_snapshot || "",
              clientEmail: "cliente@skedly.app",
              serviceName: srv?.service_name || "Servicio General",
              price: srv?.unit_price || 0,
              currency: "MXN",
              date: startDate,
              dayName: formatCancunDate(startDate, { weekday: "short" }),
              startTime,
              endTime,
              status: dbApp.status as any,
              staffId: (dbApp.employee as any)?.id || "owner",
              staffName: (dbApp.employee as any)?.display_name || currentBusiness.name || "Especialista",
              staffAvatar: (dbApp.employee as any)?.avatar_url || "/avatars/avatar-1.jpg",
              seat: "Sillón 01",
              paymentStatus: "paid" as const,
              source: "web" as const,
              durationMinutes: 45,
            };
          });
          setAppointments(mapped);
          setSelectedAppointmentId(mapped[0]?.id || null);
        } else {
          setAppointments([]);
          setSelectedAppointmentId(null);
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
        setAppointments([]);
        setSelectedAppointmentId(null);
      }
    };

    fetchAppointments();
  }, [currentBusiness]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "in_progress") matchesStatus = app.status === "in_progress";
        else matchesStatus = app.status === statusFilter;
      }

      let matchesStaff = true;
      if (selectedStaffFilter !== "all") {
        matchesStaff =
          app.staffId === selectedStaffFilter ||
          app.staffName.toLowerCase().includes(selectedStaffFilter.toLowerCase());
      }

      return matchesStatus && matchesStaff;
    });
  }, [appointments, statusFilter, selectedStaffFilter]);

  // Selected appointment details (strictly safe null check)
  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) {
      return filteredAppointments.length > 0 ? filteredAppointments[0] : null;
    }
    return (
      filteredAppointments.find((a) => a.id === selectedAppointmentId) ||
      (filteredAppointments.length > 0 ? filteredAppointments[0] : null)
    );
  }, [filteredAppointments, selectedAppointmentId]);

  // Dynamic Week Days based on selectedDate
  const weekDays = useMemo(() => getCancunWeekDays(selectedDate), [selectedDate]);

  // Formatted date string for week label: e.g. "9 de noviembre - 15 de noviembre 2026"
  const weekLabel = useMemo(() => {
    if (weekDays.length < 7) return "";
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.dayNum} ${start.monthName} - ${end.dayNum} ${end.monthName} ${end.year}`;
  }, [weekDays]);

  // Formatted date string for day label: e.g. "Miércoles, 11 de noviembre 2026"
  const dayLabel = useMemo(() => {
    return formatCancunDate(selectedDate, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  // Current red line position in Cancun time (08:00 to 20:00 = 12 hours)
  const cancunMinutesFrom0800 = (cancunTime.hour - 8) * 60 + cancunTime.minute;
  const isWithinBusinessHours = cancunMinutesFrom0800 >= 0 && cancunMinutesFrom0800 <= 720;
  const redLineWeekTop = Math.max(0, Math.min(960, (cancunMinutesFrom0800 / 60) * 80));
  const redLineDayTop = Math.max(0, Math.min(1152, (cancunMinutesFrom0800 / 60) * 96));

  // Quick Action Handlers
  const handleApproveAppointment = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "confirmed" } : item))
    );
    showToast("Cita confirmada y notificada al cliente.");
  };

  const handleRejectAppointment = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item))
    );
    showToast("Cita rechazada y turno liberado.");
  };

  const handleCompleteAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "completed" } : item))
    );
    showToast("¡Cita marcada como completada con éxito!");
  };

  const handleNoShowAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "no_show" } : item))
    );
    showToast("Cita registrada como inasistencia (No asistió).");
  };

  const handleOpenReschedule = (app: CalendarAppointment) => {
    setRescheduleTarget(app);
    setRescheduleStaff(app.staffName);
    setRescheduleDate(app.date);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleTarget) return;
    const parts = rescheduleSlot.split("-").map((p) => p.trim());
    const newStart = parts[0] || "11:30";
    const newEnd = parts[1] || "12:30";

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === rescheduleTarget.id
          ? {
              ...item,
              date: rescheduleDate,
              startTime: newStart,
              endTime: newEnd,
              staffName: rescheduleStaff,
              status: "confirmed",
            }
          : item
      )
    );
    setShowRescheduleModal(false);
    showToast(
      `Turno reprogramado para el ${rescheduleDate} a las ${newStart} con ${rescheduleStaff}. Notificación enviada.`
    );
  };

  // KPIs
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  // Day specific counts
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);
  const dayConfirmedCount = dayAppointments.filter((a) => a.status === "confirmed").length;
  const dayPendingCount = dayAppointments.filter((a) => a.status === "pending").length;

  return (
    <div className="flex flex-col w-full pb-16">
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
          VIEW MODE 1: VISTA SEMANAL
      ========================================================================== */}
      {viewMode === "semana" && (
        <div className="p-4 sm:p-6 lg:p-8 2xl:px-12 flex flex-col gap-6 w-full">
          {/* Header & Quick KPIs Ribbon */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                  Calendario
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>Cancún, MX (GMT-5)</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Organiza las citas de tu negocio y consulta la disponibilidad en tiempo real.
              </p>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-[18px]">timelapse</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-medium">Citas programadas</span>
                  <span className="text-xs font-bold text-on-surface">
                    {totalCount} {totalCount === 1 ? "cita" : "citas"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-medium">Equipo disponible</span>
                  <span className="text-xs font-bold text-on-surface">
                    {collaborators.length} {collaborators.length === 1 ? "colaborador" : "colaboradores"}
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard/citas/nueva"
                className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all shadow-sm text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Nueva cita</span>
              </Link>
            </div>
          </div>

          {/* Calendar Toolbar */}
          <div className="flex flex-col gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Time Navigation & Date Display */}
              <div className="flex items-center flex-wrap gap-2.5">
                <div className="flex items-center bg-surface-container-low rounded-xl p-1 border border-surface-container">
                  <button
                    onClick={() => {
                      setSelectedDate((prev) => addDaysToDate(prev, -7));
                      showToast("Cargando semana anterior...");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-lowest transition-all"
                    title="Semana anterior"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate(cancunTime.isoDate);
                      showToast("Mostrando semana en curso.");
                    }}
                    className="px-3 h-8 flex items-center justify-center text-xs font-semibold text-on-surface hover:bg-surface-container-lowest rounded-lg transition-all"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate((prev) => addDaysToDate(prev, 7));
                      showToast("Cargando semana siguiente...");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-lowest transition-all"
                    title="Semana siguiente"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-bold border border-surface-container capitalize">
                  <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                  <span>{weekLabel}</span>
                </div>

                {/* View Switcher Pills [Día | Semana] */}
                <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-surface-container">
                  <button
                    onClick={() => setViewMode("dia")}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-all"
                  >
                    Día
                  </button>
                  <button
                    onClick={() => setViewMode("semana")}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-surface-container-lowest text-primary shadow-sm"
                  >
                    Semana
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Employee Filter */}
                <div className="relative">
                  <select
                    value={selectedStaffFilter}
                    onChange={(e) => setSelectedStaffFilter(e.target.value)}
                    className="h-10 pl-3 pr-8 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium transition-colors border border-surface-container appearance-none cursor-pointer"
                  >
                    <option value="all">
                      Todos los colaboradores ({collaborators.length})
                    </option>
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>

                {/* Toggle Right Panel Button */}
                <button
                  onClick={() => setIsQuickDrawerOpen(!isQuickDrawerOpen)}
                  className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-semibold transition-colors border ${
                    isQuickDrawerOpen
                      ? "bg-primary-container text-on-primary-container border-primary/30"
                      : "bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container"
                  }`}
                  title="Alternar panel resumen de hoy"
                >
                  <span className="material-symbols-outlined text-[18px]">view_sidebar</span>
                  <span className="hidden sm:inline">Panel rápido</span>
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                </button>
              </div>
            </div>

            {/* State Filter Chips Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-surface-container">
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "all"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span>Todas</span>
                  <span className="bg-primary-container text-on-primary-container px-1.5 py-0.2 rounded-full text-[10px]">
                    {totalCount}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("confirmed")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "confirmed"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span>Confirmadas</span>
                  <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px]">
                    {confirmedCount}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "pending"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  <span>Pendientes</span>
                  <span className="bg-secondary-container text-on-secondary-container px-1.5 py-0.2 rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "completed"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span>Completadas</span>
                  <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px]">
                    {completedCount}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === "cancelled"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  <span>Canceladas</span>
                  <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.2 rounded-full text-[10px]">
                    {cancelledCount}
                  </span>
                </button>
              </div>

              {/* Legend Tags */}
              <div className="hidden xl:flex items-center gap-4 text-[11px] text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-primary-container"></span>
                  <span>En curso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-secondary-container"></span>
                  <span>Confirmada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#fef3c7]"></span>
                  <span>Pendiente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Workspace: Calendar Grid + Collapsible Day Drawer */}
          <div className="flex gap-4 items-start w-full relative">
            {/* Calendar Grid Wrapper */}
            <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden flex flex-col min-w-0">
              {/* Day Columns Header */}
              <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-surface-container-low py-2 select-none border-b border-surface-container">
                <div className="flex flex-col items-center justify-center text-[10px] text-on-surface-variant font-mono text-center">
                  <span className="font-bold">Cancún</span>
                  <span className="text-[9px] opacity-75">GMT-5</span>
                </div>

                {weekDays.map((day) => {
                  const dayApps = filteredAppointments.filter((a) => a.date === day.iso);
                  return (
                    <div
                      key={day.iso}
                      onClick={() => {
                        setSelectedDate(day.iso);
                        setViewMode("dia");
                      }}
                      className={`flex flex-col items-center justify-center py-1 cursor-pointer rounded-xl transition-all ${
                        day.isToday
                          ? "bg-primary-fixed shadow-sm"
                          : "hover:bg-surface-container"
                      }`}
                    >
                      <span
                        className={`text-[11px] uppercase font-semibold ${
                          day.isToday
                            ? "text-on-primary-fixed-variant font-bold"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {day.shortName} {day.isToday && "(Hoy)"}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          day.isToday
                            ? "w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs mt-0.5"
                            : "text-on-surface"
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          day.isToday
                            ? "text-on-primary-fixed-variant font-bold"
                            : "text-secondary"
                        }`}
                      >
                        {dayApps.length} {dayApps.length === 1 ? "cita" : "citas"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Body Scroll Area */}
              <div className="relative overflow-y-auto max-h-[740px] select-none bg-surface-container-lowest">
                {/* Current Time Indicator Red Line (Cancun Real Time) */}
                {isWithinBusinessHours && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${redLineWeekTop}px` }}
                  >
                    <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-r shadow-sm">
                      {cancunTime.timeStr}
                    </span>
                    <div className="h-0.5 bg-error w-full shadow-sm"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-error -ml-1"></div>
                  </div>
                )}

                {/* Grid Matrix (12 Hours: 08:00 to 20:00, 80px per hour = 960px) */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] relative" style={{ height: "960px" }}>
                  {/* Time Axis */}
                  <div className="flex flex-col justify-between text-right pr-2 text-[11px] text-outline py-2 bg-surface-container-lowest border-r border-surface-container">
                    <span className="h-20 -mt-2.5">08:00</span>
                    <span className="h-20 -mt-2.5">09:00</span>
                    <span className="h-20 -mt-2.5">10:00</span>
                    <span className="h-20 -mt-2.5">11:00</span>
                    <span className="h-20 -mt-2.5">12:00</span>
                    <span className="h-20 -mt-2.5">13:00</span>
                    <span className="h-20 -mt-2.5">14:00</span>
                    <span className="h-20 -mt-2.5">15:00</span>
                    <span className="h-20 -mt-2.5">16:00</span>
                    <span className="h-20 -mt-2.5">17:00</span>
                    <span className="h-20 -mt-2.5">18:00</span>
                    <span className="h-20 -mt-2.5">19:00</span>
                  </div>

                  {/* 7 Columns for Weekdays */}
                  {weekDays.map((day) => {
                    const dayApps = filteredAppointments.filter((a) => a.date === day.iso);
                    return (
                      <div
                        key={day.iso}
                        className="relative border-r border-surface-container hover:bg-surface-container-low/20 transition-colors"
                      >
                        {/* 12 Background Hour Rows */}
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="h-20 border-b border-surface-container/50 hover:bg-surface-container-low/30 transition-colors"
                          />
                        ))}

                        {/* Dynamic Appointment Cards for this Day */}
                        {dayApps.map((app) => {
                          const [startH, startM] = (app.startTime || "09:00").split(":").map(Number);
                          const minutesFrom0800 = (startH - 8) * 60 + (startM || 0);
                          const topPx = Math.max(0, (minutesFrom0800 / 60) * 80);
                          const duration = app.durationMinutes || 60;
                          const heightPx = Math.max(38, (duration / 60) * 80);

                          return (
                            <div
                              key={app.id}
                              onClick={() => {
                                setSelectedAppointmentId(app.id);
                                setSelectedDate(app.date);
                                setViewMode("dia");
                              }}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                              }}
                              className={`absolute left-1 right-1 rounded-xl p-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border ${
                                app.status === "confirmed"
                                  ? "bg-secondary-container text-on-secondary-container border-secondary/20"
                                  : app.status === "in_progress"
                                  ? "bg-primary-container text-on-primary-container border-primary/30"
                                  : app.status === "pending"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-surface-container text-on-surface border-surface-container"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-semibold font-mono truncate">
                                    {app.startTime} - {app.endTime}
                                  </span>
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      app.status === "confirmed"
                                        ? "bg-primary"
                                        : app.status === "pending"
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                  />
                                </div>
                                <h4 className="text-xs font-bold leading-tight truncate mt-0.5">
                                  {app.clientName}
                                </h4>
                                <p className="text-[10px] opacity-80 truncate">
                                  {app.serviceName}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="truncate opacity-80">{app.staffName}</span>
                                <span className="bg-surface-container-lowest px-1.5 py-0.2 rounded font-bold text-on-surface">
                                  ${app.price}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Collapsible Quick Overview Right Drawer */}
            {isQuickDrawerOpen && (
              <aside className="w-80 shrink-0 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-5 flex flex-col gap-5 transition-all duration-300">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">notifications_active</span>
                    <h3 className="text-xs font-bold text-on-surface">Resumen de hoy</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] font-bold">
                    {pendingCount} por aprobar
                  </span>
                </div>

                {/* Pending Approval Section */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Citas pendientes
                    </span>
                    <button
                      onClick={() => setStatusFilter("pending")}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      Ver todas
                    </button>
                  </div>

                  {appointments.filter((a) => a.status === "pending").length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-surface-container-low/60 border border-dashed border-surface-container text-xs text-secondary">
                      No tienes citas pendientes por aprobar.
                    </div>
                  ) : (
                    appointments
                      .filter((a) => a.status === "pending")
                      .map((app) => (
                        <div
                          key={app.id}
                          className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-[#fde68a] text-[#b45309] text-[10px] font-bold">
                              Pendiente
                            </span>
                            <span className="text-[11px] text-secondary font-mono">{app.startTime}</span>
                          </div>
                          <div className="flex flex-col">
                            <h4 className="text-xs font-bold text-on-surface">{app.clientName}</h4>
                            <p className="text-[11px] text-secondary">{app.serviceName}</p>
                            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mt-1">
                              <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                              <span>{app.date} {app.startTime} - {app.staffName}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={(e) => handleApproveAppointment(app.id, e)}
                              className="h-8 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Aceptar</span>
                            </button>
                            <button
                              onClick={(e) => handleRejectAppointment(app.id, e)}
                              className="h-8 rounded-lg bg-error-container text-on-error-container text-xs font-semibold hover:bg-error hover:text-on-error transition-colors flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                              <span>Rechazar</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Upcoming Turns of Today */}
                <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Próximos turnos de hoy
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {dayAppointments.length === 0 ? (
                      <p className="text-xs text-secondary text-center py-2">
                        Sin citas programadas para hoy.
                      </p>
                    ) : (
                      dayAppointments.slice(0, 5).map((app) => (
                        <div
                          key={app.id}
                          onClick={() => {
                            setSelectedAppointmentId(app.id);
                            setSelectedDate(app.date);
                            setViewMode("dia");
                          }}
                          className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-on-surface truncate">
                              {app.clientName}
                            </span>
                            <span className="text-[11px] text-secondary truncate">
                              {app.serviceName}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-primary shrink-0 ml-2">
                            {app.startTime}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: VISTA DIARIA
      ========================================================================== */}
      {viewMode === "dia" && (
        <div className="w-full flex flex-col">
          {/* Top Toolbar Ribbon */}
          <div className="w-full bg-surface-container-lowest px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-surface-container sticky top-16 z-30">
            {/* Left Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px] text-primary">view_week</span>
                <span>{collaborators.length} {collaborators.length === 1 ? "Colaborador activo" : "Colaboradores activos"}</span>
              </div>
              <div className="h-6 w-[1px] bg-surface-container hidden sm:block"></div>
              {/* Quick Status Pills */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "all"
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                >
                  Todas ({dayAppointments.length})
                </button>
                <button
                  onClick={() => setStatusFilter("confirmed")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    statusFilter === "confirmed"
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmadas ({dayConfirmedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    statusFilter === "pending"
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendientes ({dayPendingCount})
                </button>
              </div>
            </div>

            {/* Center: Date Navigator with 'Hoy' Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 shadow-sm border border-surface-container">
                <button
                  onClick={() => {
                    setSelectedDate((prev) => addDaysToDate(prev, -1));
                    showToast("Cargando día anterior...");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Día anterior"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1 capitalize">
                  <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                  <span className="text-xs font-bold text-on-surface tracking-tight">
                    {dayLabel}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDate((prev) => addDaysToDate(prev, 1));
                    showToast("Cargando día siguiente...");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Día siguiente"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedDate(cancunTime.isoDate);
                  showToast("Mostrando agenda de hoy.");
                }}
                className="px-3 py-1.5 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-semibold hover:bg-secondary-fixed transition-colors"
              >
                Hoy
              </button>
            </div>

            {/* Right Controls: View Switcher (Día | Semana) & New Appointment */}
            <div className="flex items-center gap-2">
              <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-container">
                <button
                  onClick={() => setViewMode("dia")}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-on-primary shadow-sm"
                >
                  Día
                </button>
                <button
                  onClick={() => setViewMode("semana")}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Semana
                </button>
              </div>
              <Link
                href="/dashboard/citas/nueva"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Nueva cita</span>
              </Link>
            </div>
          </div>

          {/* Main 2-Column Work Area */}
          <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-0 overflow-hidden bg-surface min-h-[calc(100vh-7rem)]">
            {/* LEFT PANEL: Multi-Collaborator Day Schedule Grid */}
            <div className="xl:col-span-8 flex flex-col overflow-x-auto bg-surface pb-12 border-r border-surface-container">
              {/* Staff Columns Sticky Header */}
              <div
                className="grid bg-surface-container-lowest sticky top-0 z-20 shadow-sm min-w-[750px] border-b border-surface-container"
                style={{
                  gridTemplateColumns: `72px repeat(${collaborators.length || 1}, minmax(240px, 1fr))`,
                }}
              >
                <div className="p-3 flex flex-col items-center justify-center text-[10px] font-mono text-on-surface-variant bg-surface-container-low">
                  <span className="font-bold">Cancún</span>
                  <span className="text-[9px] opacity-75">GMT-5</span>
                </div>

                {collaborators.map((col) => {
                  const colApps = filteredAppointments.filter(
                    (a) => a.date === selectedDate && (a.staffId === col.id || a.staffName === col.display_name)
                  );
                  return (
                    <div
                      key={col.id}
                      className="p-3.5 flex items-center gap-3 bg-surface-container-lowest border-r border-surface-container"
                    >
                      <div className="relative">
                        <img
                          src={col.avatar_url || "/avatars/avatar-1.jpg"}
                          alt={col.display_name}
                          className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface-container"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-on-surface truncate">
                            {col.display_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {col.role || "Especialista"} •{" "}
                          <strong className="text-primary font-medium">
                            {colApps.length} {colApps.length === 1 ? "cita hoy" : "citas hoy"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schedule Timeline Canvas (08:00 to 20:00, height 1152px) */}
              <div
                className="relative grid min-w-[750px] h-[1152px] bg-surface-container-lowest"
                style={{
                  gridTemplateColumns: `72px repeat(${collaborators.length || 1}, minmax(240px, 1fr))`,
                }}
              >
                {/* Vertical Timeline Hours Column */}
                <div className="flex flex-col select-none relative z-10 bg-surface-container-low/80 border-r border-surface-container">
                  {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((h) => (
                    <div
                      key={h}
                      className="h-24 pt-2 px-2 text-right text-xs text-on-surface-variant font-medium"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Collaborators Columns */}
                {collaborators.map((col) => {
                  const colApps = filteredAppointments.filter(
                    (a) => a.date === selectedDate && (a.staffId === col.id || a.staffName === col.display_name)
                  );

                  return (
                    <div
                      key={col.id}
                      className="relative p-1.5 h-full bg-transparent border-r border-surface-container"
                    >
                      {/* 12 Hour Slot Grid Lines */}
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-24 border-b border-surface-container/50 hover:bg-surface-container-low/30 transition-colors"
                        />
                      ))}

                      {/* Real Appointments for this Collaborator */}
                      {colApps.map((app) => {
                        const [startH, startM] = (app.startTime || "09:00").split(":").map(Number);
                        const minutesFrom0800 = (startH - 8) * 60 + (startM || 0);
                        const topPx = Math.max(0, (minutesFrom0800 / 60) * 96);
                        const duration = app.durationMinutes || 60;
                        const heightPx = Math.max(48, (duration / 60) * 96);

                        const isSelected = selectedAppointmentId === app.id;

                        return (
                          <div
                            key={app.id}
                            onClick={() => setSelectedAppointmentId(app.id)}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            className={`absolute left-2 right-2 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border ${
                              isSelected
                                ? "ring-2 ring-primary border-primary bg-primary-container/40"
                                : app.status === "confirmed"
                                ? "bg-secondary-container/80 border-secondary/20"
                                : app.status === "in_progress"
                                ? "bg-primary-container border-primary/30"
                                : app.status === "pending"
                                ? "bg-amber-100 border-amber-300"
                                : "bg-surface-container border-surface-container"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-on-surface truncate">
                                {app.clientName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  app.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : app.status === "pending"
                                    ? "bg-amber-200 text-amber-900"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {app.status === "confirmed"
                                  ? "Confirmada"
                                  : app.status === "pending"
                                  ? "Pendiente"
                                  : "Completada"}
                              </span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant line-clamp-1">
                              {app.serviceName}
                            </span>
                            <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                              <span>
                                {app.startTime} - {app.endTime}
                              </span>
                              <span className="font-bold text-on-surface">
                                ${app.price} MXN
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* CURRENT TIME INDICATOR RED LINE (Cancun Real Time) */}
                {isWithinBusinessHours && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${redLineDayTop}px` }}
                  >
                    <div className="w-16 flex items-center justify-end pr-1">
                      <span className="px-1.5 py-0.5 rounded bg-error text-on-error text-[10px] font-bold tracking-tight shadow-sm">
                        {cancunTime.timeStr}
                      </span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-error -ml-1.5 shadow-sm"></div>
                    <div className="flex-1 h-[2px] bg-error shadow-[0_0_8px_rgba(186,26,26,0.6)]"></div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Persistent Detail & Actions of Selected Appointment */}
            <div className="xl:col-span-4 bg-surface-container-lowest shadow-md flex flex-col justify-between overflow-y-auto border-l border-surface-container min-h-[500px]">
              {selectedAppointment ? (
                <>
                  <div className="p-6 flex flex-col gap-5">
                    {/* Header: Appointment ID & Actions */}
                    <div className="flex items-start justify-between gap-3 pb-2 border-b border-surface-container">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                            Cita Programada
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono font-medium">
                            {selectedAppointment.code}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-on-surface mt-0.5">
                          Detalle de la Cita
                        </h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => window.print()}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                          title="Imprimir ticket"
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast("Enlace de cita copiado al portapapeles.");
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                          title="Compartir"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                        </button>
                      </div>
                    </div>

                    {/* Badges Status Bar */}
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-surface-container">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        {selectedAppointment.status === "in_progress"
                          ? "En curso"
                          : selectedAppointment.status === "confirmed"
                          ? "Confirmada"
                          : selectedAppointment.status === "completed"
                          ? "Completada"
                          : "Pendiente"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-medium">
                        <span className="material-symbols-outlined text-[15px] text-primary">payments</span>
                        <span>
                          {selectedAppointment.paymentMethod || "Pago en local"} (${selectedAppointment.price}{" "}
                          {selectedAppointment.currency})
                        </span>
                      </span>
                    </div>

                    {/* Client Profile Card */}
                    <div className="p-4 rounded-2xl bg-surface-container-low flex flex-col gap-3 shadow-sm border border-surface-container">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Información del Cliente
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold">
                          Cliente Registrado
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="relative">
                          <img
                            src={
                              selectedAppointment.clientAvatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={selectedAppointment.clientName}
                            className="w-12 h-12 rounded-full object-cover shadow-sm bg-surface-container-high"
                          />
                          <div className="w-4 h-4 rounded-full bg-primary text-on-primary absolute -bottom-0.5 -right-0.5 flex items-center justify-center text-[10px] font-bold">
                            ★
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-on-surface truncate">
                            {selectedAppointment.clientName}
                          </span>
                          <span className="text-xs text-on-surface-variant truncate">
                            {selectedAppointment.clientEmail}
                          </span>
                        </div>
                      </div>

                      {/* Contact Quick Triggers */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`tel:${selectedAppointment.clientPhone}`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm text-xs font-semibold border border-surface-container"
                        >
                          <span className="material-symbols-outlined text-primary text-[17px]">call</span>
                          <span className="truncate">{selectedAppointment.clientPhone || "Sin tel"}</span>
                        </a>
                        <a
                          href={`https://wa.me/${(selectedAppointment.clientPhone || "").replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm text-xs font-bold border border-emerald-200"
                        >
                          <span className="material-symbols-outlined text-[17px]">chat</span>
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Appointment Specifics */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        Detalles del Turno
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Service Info */}
                        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 col-span-2 border border-surface-container">
                          <div className="flex items-center justify-between text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1 font-semibold text-primary">
                              <span className="material-symbols-outlined text-[16px]">content_cut</span>
                              <span>Servicio Seleccionado</span>
                            </span>
                            <span className="font-bold text-primary font-mono">
                              ${selectedAppointment.price}.00 {selectedAppointment.currency}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-on-surface">
                            {selectedAppointment.serviceName}
                          </span>
                          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant pt-0.5">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">timer</span>
                              <span>Duración: {selectedAppointment.durationMinutes} min</span>
                            </span>
                          </div>
                        </div>

                        {/* Specialist */}
                        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-surface-container">
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[15px] text-primary">person</span> Profesional
                          </span>
                          <span className="text-xs font-bold text-on-surface truncate">
                            {selectedAppointment.staffName}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Estación: {selectedAppointment.seat}
                          </span>
                        </div>

                        {/* Date & Time Slot */}
                        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-surface-container">
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[15px] text-primary">schedule</span> Franja Horaria
                          </span>
                          <span className="text-xs font-bold text-on-surface font-mono">
                            {selectedAppointment.startTime} - {selectedAppointment.endTime}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {selectedAppointment.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Operational Action Buttons Ribbon */}
                  <div className="p-5 bg-surface-container-low flex flex-col gap-2.5 border-t border-surface-container">
                    <button
                      onClick={() => handleCompleteAppointment(selectedAppointment.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">task_alt</span>
                      <span>Marcar como completada</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenReschedule(selectedAppointment)}
                        className="py-2 px-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm text-xs font-semibold flex items-center justify-center gap-1.5 border border-surface-container"
                      >
                        <span className="material-symbols-outlined text-[17px] text-primary">update</span>
                        <span>Reprogramar</span>
                      </button>
                      <button
                        onClick={() => handleNoShowAppointment(selectedAppointment.id)}
                        className="py-2 px-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm text-xs font-semibold flex items-center justify-center gap-1.5 border border-surface-container"
                      >
                        <span className="material-symbols-outlined text-[17px] text-on-surface-variant">person_off</span>
                        <span>No asistió</span>
                      </button>
                    </div>

                    <div className="flex flex-col items-center pt-1">
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de cancelar la cita de ${selectedAppointment.clientName}?`)) {
                            handleRejectAppointment(selectedAppointment.id);
                          }
                        }}
                        className="py-1 px-3 text-error hover:bg-error-container/40 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">cancel</span>
                        <span>Cancelar cita</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty state when no appointment is selected */
                <div className="p-8 flex flex-col items-center justify-center text-center gap-4 my-auto">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant shadow-inner">
                    <span className="material-symbols-outlined text-[32px] text-primary">event_available</span>
                  </div>
                  <div className="flex flex-col gap-1 max-w-xs">
                    <h3 className="text-base font-bold text-on-surface">Sin citas seleccionadas</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      No hay citas programadas para esta fecha. Cuando tus clientes reserven un turno o agendes una cita manualmente, podrás ver y gestionar todos los detalles aquí.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/citas/nueva"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 transition-all mt-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Agendar primera cita</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REPROGRAMAR TURNO
      ========================================================================== */}
      {showRescheduleModal && rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-on-surface">Reprogramar Cita</h3>
                <span className="text-xs text-on-surface-variant">
                  Cliente: {rescheduleTarget.clientName} • ID {rescheduleTarget.code}
                </span>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Seleccionar nueva fecha</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low font-medium text-xs text-on-surface border border-surface-container">
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="bg-transparent font-bold focus:outline-none cursor-pointer w-full"
                />
                <span className="material-symbols-outlined text-primary text-[20px]">event</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Colaborador disponible</label>
              <select
                value={rescheduleStaff}
                onChange={(e) => setRescheduleStaff(e.target.value)}
                className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-medium focus:outline-none border border-surface-container cursor-pointer"
              >
                {collaborators.map((c) => (
                  <option key={c.id} value={c.display_name}>
                    {c.display_name} ({c.role || "Especialista"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Franja horaria disponible</label>
              <div className="grid grid-cols-3 gap-2">
                {["10:00 - 11:00", "11:30 - 12:30", "14:00 - 15:00", "16:15 - 17:15", "17:30 - 18:30", "18:45 - 19:45"].map((slot) => {
                  const isChosen = rescheduleSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleSlot(slot)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                        isChosen
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-on-surface-variant">
          Cargando calendario...
        </div>
      }
    >
      <CalendarioContent />
    </Suspense>
  );
}
