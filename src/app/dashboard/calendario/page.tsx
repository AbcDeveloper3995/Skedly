"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  MOCK_CALENDAR_APPOINTMENTS,
  COLLABORATORS,
  CalendarAppointment,
} from "./mock-data";

function CalendarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "dia" ? "dia" : "semana";

  const { currentBusiness } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<"semana" | "dia">(initialView);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("2025-10-25"); // Safe static initial string
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(true);

  // Modals & Feedback
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<CalendarAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("2025-10-26");
  const [rescheduleSlot, setRescheduleSlot] = useState("11:30 - 12:30");
  const [rescheduleStaff, setRescheduleStaff] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Selected appointment details
  const selectedAppointment = useMemo(() => {
    return (
      appointments.find((a) => a.id === selectedAppointmentId) || appointments[0] || null
    );
  }, [appointments, selectedAppointmentId]);

  // Load from Supabase real data
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentBusiness?.id) return;
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
          const mapped: CalendarAppointment[] = data.map((dbApp) => {
            const startDate = dbApp.start_at.split("T")[0];
            const startTime = dbApp.start_at.split("T")[1]?.slice(0, 5) || "10:00";
            const endTime = dbApp.end_at.split("T")[1]?.slice(0, 5) || "11:00";
            const srv = dbApp.appointment_services?.[0];

            return {
              id: dbApp.id,
              clientName: dbApp.customer_name_snapshot || "Cliente",
              clientPhone: dbApp.customer_phone_snapshot || "",
              serviceName: srv?.service_name || "Servicio General",
              price: srv?.unit_price || 0,
              date: startDate,
              startTime,
              endTime,
              status: dbApp.status as any,
              staffName: (dbApp.employee as any)?.display_name || "Especialista",
              staffRole: "Especialista",
              staffAvatar: (dbApp.employee as any)?.avatar_url || "/avatars/avatar-1.jpg",
              paymentStatus: "pagado" as const,
              dayIndex: new Date(dbApp.start_at).getDay(),
              durationMinutes: 45,
            };
          });
          setAppointments(mapped);
          if (mapped.length > 0) {
            setSelectedAppointmentId(mapped[0].id);
          }
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
        setAppointments([]);
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
        matchesStaff = app.staffId === selectedStaffFilter || app.staffName.toLowerCase().includes(selectedStaffFilter.toLowerCase());
      }

      return matchesStatus && matchesStaff;
    });
  }, [appointments, statusFilter, selectedStaffFilter]);

  // Quick Accept / Reject Pending Turn
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
          VIEW MODE 1: VISTA SEMANAL (skedly_calendario_semanal_y_gesti_n_de_citas)
      ========================================================================== */}
      {viewMode === "semana" && (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
          {/* Header & Quick KPIs Ribbon */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                  Calendario
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
                  Semana 43
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Organiza las citas de tu negocio y consulta la disponibilidad de tu equipo en tiempo real.
              </p>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-[18px]">timelapse</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-medium">Ocupación semanal</span>
                  <span className="text-xs font-bold text-on-surface">
                    82% <span className="text-[11px] font-normal text-secondary">(34h libres)</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-medium">Personal de turno</span>
                  <span className="text-xs font-bold text-on-surface">4 / 4 activos</span>
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
                    onClick={() => showToast("Cargando semana anterior...")}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-lowest transition-all"
                    title="Semana anterior"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDate("2025-10-25");
                      showToast("Mostrando semana en curso.");
                    }}
                    className="px-3 h-8 flex items-center justify-center text-xs font-semibold text-on-surface hover:bg-surface-container-lowest rounded-lg transition-all"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => showToast("Cargando semana siguiente...")}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-lowest transition-all"
                    title="Semana siguiente"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-bold border border-surface-container">
                  <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                  <span>23 - 29 Octubre 2025</span>
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

              {/* Filters (Employees & Drawer Toggle) */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Employee Multi-select Pill */}
                <div className="relative">
                  <select
                    value={selectedStaffFilter}
                    onChange={(e) => setSelectedStaffFilter(e.target.value)}
                    className="h-10 pl-3 pr-8 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium transition-colors border border-surface-container appearance-none cursor-pointer"
                  >
                    <option value="all">Todos los empleados (4)</option>
                    <option value="carlos">Carlos Ramírez</option>
                    <option value="mateo">Mateo Ramos</option>
                    <option value="sofia">Sofía Gómez</option>
                    <option value="luis">Luis Hernández</option>
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
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#e2e8f0]"></span>
                  <span>Descanso / Bloqueo</span>
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
                <div className="flex flex-col items-center justify-center text-[10px] text-on-surface-variant font-mono">
                  <span>GMT+1</span>
                </div>
                {/* Lunes 23 */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[11px] uppercase text-on-surface-variant font-semibold">Lun</span>
                  <span className="text-sm font-bold text-on-surface">23</span>
                  <span className="text-[10px] text-secondary font-medium">3 citas</span>
                </div>
                {/* Martes 24 */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[11px] uppercase text-on-surface-variant font-semibold">Mar</span>
                  <span className="text-sm font-bold text-on-surface">24</span>
                  <span className="text-[10px] text-secondary font-medium">4 citas</span>
                </div>
                {/* Miercoles 25 (HOY) */}
                <div className="flex flex-col items-center justify-center py-1 rounded-xl bg-primary-fixed shadow-sm">
                  <span className="text-[11px] uppercase text-on-primary-fixed-variant font-bold">Mié (Hoy)</span>
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">25</span>
                  <span className="text-[10px] text-on-primary-fixed-variant font-bold">6 citas</span>
                </div>
                {/* Jueves 26 */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[11px] uppercase text-on-surface-variant font-semibold">Jue</span>
                  <span className="text-sm font-bold text-on-surface">26</span>
                  <span className="text-[10px] text-secondary font-medium">5 citas</span>
                </div>
                {/* Viernes 27 */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[11px] uppercase text-on-surface-variant font-semibold">Vie</span>
                  <span className="text-sm font-bold text-on-surface">27</span>
                  <span className="text-[10px] text-secondary font-medium">5 citas</span>
                </div>
                {/* Sábado 28 */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[11px] uppercase text-on-surface-variant font-semibold">Sáb</span>
                  <span className="text-sm font-bold text-on-surface">28</span>
                  <span className="text-[10px] text-secondary font-medium">1 cita</span>
                </div>
                {/* Domingo 29 */}
                <div className="flex flex-col items-center justify-center py-1 opacity-50">
                  <span className="text-[11px] uppercase text-outline font-semibold">Dom</span>
                  <span className="text-sm font-bold text-outline">29</span>
                  <span className="text-[10px] text-outline font-medium">Cerrado</span>
                </div>
              </div>

              {/* Calendar Body Scroll Area */}
              <div className="relative overflow-y-auto max-h-[740px] select-none bg-surface-container-lowest">
                {/* Current Time Indicator Red Line (11:45) */}
                <div className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" style={{ top: "312px" }}>
                  <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-r shadow-sm">
                    11:45
                  </span>
                  <div className="h-0.5 bg-error w-full shadow-sm"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-error -ml-1"></div>
                </div>

                {/* Grid Matrix (12 Hours: 08:00 to 20:00, 80px per hour) */}
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

                  {/* COLUMN 1: Lun 23 */}
                  <div className="relative border-r border-surface-container hover:bg-surface-container-low/30 transition-colors">
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-107");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[80px] h-[75px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">09:00 - 10:00</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Marcos Valls</h4>
                        <p className="text-[11px] text-secondary truncate">Corte Clásico &amp; Barba</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-secondary">
                        <span>Carlos R.</span>
                        <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded font-bold text-on-surface">$220</span>
                      </div>
                    </div>

                    <div className="absolute left-1 right-1 top-[480px] h-[80px] bg-surface-container rounded-xl flex items-center justify-center text-center p-2 opacity-70 border border-surface-container">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                        <span>Pausa almuerzo</span>
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-108");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[680px] h-[75px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">16:30 - 17:30</span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container-lowest text-primary text-[9px] font-bold">Conf.</span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Javier Gil</h4>
                        <p className="text-[11px] text-secondary truncate">Tinte &amp; Peinado</p>
                      </div>
                      <span className="text-[10px] text-secondary font-medium">Sofía G.</span>
                    </div>
                  </div>

                  {/* COLUMN 2: Mar 24 */}
                  <div className="relative border-r border-surface-container hover:bg-surface-container-low/30 transition-colors">
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-109");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[40px] h-[60px] rounded-xl bg-surface-container-high p-2 flex flex-col justify-between opacity-80 cursor-pointer border border-surface-container"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-on-surface-variant">08:30 - 09:15</span>
                        <span className="text-[9px] font-bold text-secondary uppercase">Completada</span>
                      </div>
                      <h4 className="text-xs font-semibold text-on-surface truncate">Álvaro Lozano</h4>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-110");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[240px] h-[115px] rounded-xl bg-secondary-container p-2.5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-secondary/20"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-primary">11:00 - 12:30</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-surface leading-tight">Roberto Solís</h4>
                        <p className="text-[11px] text-secondary truncate">Tratamiento Capilar Spa</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-secondary pt-1">
                        <span className="font-medium">Luis H.</span>
                        <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-[10px] font-bold text-on-surface">$350</span>
                      </div>
                    </div>

                    <div className="absolute left-1 right-1 top-[480px] h-[80px] bg-surface-container rounded-xl flex items-center justify-center opacity-70">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                        <span>Pausa almuerzo</span>
                      </span>
                    </div>
                  </div>

                  {/* COLUMN 3: Mié 25 (HOY) */}
                  <div className="relative bg-primary-fixed/20 border-r border-primary/20 hover:bg-primary-fixed/30 transition-colors">
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-105");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[120px] h-[60px] rounded-xl bg-[#ecfdf5] p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-emerald-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#059669]">09:30 - 10:15</span>
                        <span className="material-symbols-outlined text-[#059669] text-[14px]">check_circle</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#065f46] truncate">Gabriel Medina</h4>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-103");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[200px] h-[78px] rounded-xl bg-[#fef3c7] p-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-amber-300"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#92400e]">10:30 - 11:30</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#fde68a] text-[#b45309] text-[9px] font-bold">Pendiente</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#78350f] leading-tight">Gonzalo Rivas</h4>
                        <p className="text-[11px] text-[#92400e] truncate">Arreglo Barba &amp; Navaja</p>
                      </div>
                      <span className="text-[10px] text-[#92400e] font-medium">Mateo R.</span>
                    </div>

                    {/* EN CURSO (11:45 - 12:45) */}
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-101");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[300px] h-[80px] rounded-xl bg-primary text-on-primary p-2.5 flex flex-col justify-between shadow-md ring-2 ring-primary/20 z-10 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-on-primary">11:15 - 12:15</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span>EN CURSO</span>
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-on-primary leading-tight">Alejandro Peña</h4>
                        <p className="text-[11px] text-white/80 truncate">Pack Completo Corte + Barba</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/90">
                        <span className="font-semibold">Mateo R.</span>
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">$250</span>
                      </div>
                    </div>

                    <div className="absolute left-1 right-1 top-[480px] h-[80px] bg-surface-container rounded-xl flex items-center justify-center opacity-70">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                        <span>Pausa almuerzo</span>
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-106");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[600px] h-[75px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">15:30 - 16:30</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Lucas Valera</h4>
                        <p className="text-[11px] text-secondary truncate">Perfilado Barba</p>
                      </div>
                      <span className="text-[10px] text-secondary font-medium">Carlos R.</span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-104");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[720px] h-[75px] rounded-xl bg-[#fef3c7] p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-amber-300"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#92400e]">17:00 - 18:00</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#fde68a] text-[#b45309] text-[9px] font-bold">Pendiente</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#78350f] leading-tight">Ignacio Prada</h4>
                        <p className="text-[11px] text-[#92400e] truncate">Corte Degradado Niño</p>
                      </div>
                      <span className="text-[10px] text-[#92400e] font-medium">Sofía G.</span>
                    </div>
                  </div>

                  {/* COLUMN 4: Jue 26 */}
                  <div className="relative border-r border-surface-container hover:bg-surface-container-low/30 transition-colors">
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-111");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[160px] h-[75px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">10:00 - 11:00</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Andrés Blanco</h4>
                        <p className="text-[11px] text-secondary truncate">Corte &amp; Peinado</p>
                      </div>
                      <span className="text-[10px] text-secondary font-medium">Carlos R.</span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-112");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[320px] h-[75px] rounded-xl bg-surface-container-low p-2 flex flex-col justify-between opacity-50 cursor-pointer border border-surface-container"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] line-through text-outline">12:00 - 13:00</span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container text-outline text-[9px] font-bold">Cancelada</span>
                        </div>
                        <h4 className="text-xs font-semibold text-outline line-through leading-tight">Pedro Márquez</h4>
                        <p className="text-[11px] text-outline truncate">Corte Caballero</p>
                      </div>
                      <span className="text-[10px] text-outline">Mateo R.</span>
                    </div>

                    <div className="absolute left-1 right-1 top-[480px] h-[80px] bg-surface-container rounded-xl flex items-center justify-center opacity-70">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                        <span>Pausa almuerzo</span>
                      </span>
                    </div>
                  </div>

                  {/* COLUMN 5: Vie 27 */}
                  <div className="relative border-r border-surface-container hover:bg-surface-container-low/30 transition-colors">
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-113");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[240px] h-[75px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">11:00 - 12:00</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Pablo Marín</h4>
                        <p className="text-[11px] text-secondary truncate">Pack Novio Completo</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-secondary">
                        <span>Mateo R.</span>
                        <span className="font-bold text-on-surface">$500</span>
                      </div>
                    </div>

                    <div className="absolute left-1 right-1 top-[480px] h-[80px] bg-surface-container rounded-xl flex items-center justify-center opacity-70">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                        <span>Pausa almuerzo</span>
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-114");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[640px] h-[115px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">16:00 - 17:30</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Rodrigo Santamaría</h4>
                        <p className="text-[11px] text-secondary truncate">Colorimetría &amp; Lavado</p>
                      </div>
                      <span className="text-[10px] text-secondary font-medium">Sofía G.</span>
                    </div>
                  </div>

                  {/* COLUMN 6: Sáb 28 */}
                  <div className="relative border-r border-surface-container hover:bg-surface-container-low/30 transition-colors">
                    <div
                      onClick={() => {
                        setSelectedAppointmentId("app-115");
                        setViewMode("dia");
                      }}
                      className="absolute left-1.5 right-1.5 top-[80px] h-[115px] rounded-xl bg-secondary-container p-2 flex flex-col justify-between shadow-sm cursor-pointer border border-secondary/20"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-on-secondary-container">09:00 - 10:30</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <h4 className="text-xs font-bold text-on-secondary-container leading-tight">Sergio Naranjo</h4>
                        <p className="text-[11px] text-secondary truncate">Corte &amp; Afeitado Clásico</p>
                      </div>
                      <span className="text-[10px] text-secondary font-medium">Carlos R.</span>
                    </div>

                    <div className="absolute inset-x-0 top-[480px] bottom-0 bg-surface-container-low/60 flex items-center justify-center p-4">
                      <span className="text-[11px] text-outline uppercase tracking-wider font-semibold">
                        Cerrado por la tarde
                      </span>
                    </div>
                  </div>

                  {/* COLUMN 7: Dom 29 (Cerrado) */}
                  <div className="relative bg-surface-container-low/70 flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-1 text-outline p-4 text-center">
                      <span className="material-symbols-outlined text-[28px]">lock_clock</span>
                      <span className="text-xs font-semibold uppercase">No laborable</span>
                      <span className="text-[11px] text-outline">Negocio cerrado</span>
                    </div>
                  </div>
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
                        <div key={app.id} className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-[#fde68a] text-[#b45309] text-[10px] font-bold">
                              Pendiente
                            </span>
                            <span className="text-[11px] text-secondary">{app.startTime}</span>
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
                    {appointments.length === 0 ? (
                      <p className="text-xs text-secondary text-center py-2">Sin citas programadas para hoy.</p>
                    ) : (
                      appointments.slice(0, 5).map((app) => (
                        <div
                          key={app.id}
                          onClick={() => {
                            setSelectedAppointmentId(app.id);
                            setViewMode("dia");
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">content_cut</span>
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-on-surface truncate">{app.clientName}</span>
                            <span className="text-[11px] text-secondary">{app.startTime} • {app.staffName}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Staff Mini Availability Widget */}
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1.5 mt-auto border border-surface-container">
                  <span className="text-xs font-bold text-on-surface">Disponibilidad del equipo hoy</span>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-secondary mt-0.5">
                    <span>78% de la jornada ocupada</span>
                    <span className="font-semibold text-on-surface">3 turnos libres</span>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: VISTA DIARIA (skedly_calendario_diario_y_detalle_de_cita)
      ========================================================================== */}
      {viewMode === "dia" && (
        <div className="w-full flex flex-col">
          {/* Top Toolbar Ribbon */}
          <div className="w-full bg-surface-container-lowest px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-surface-container sticky top-16 z-30">
            {/* Left Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px] text-primary">view_week</span>
                <span>3 Colaboradores activos</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">keyboard_arrow_down</span>
              </div>
              <div className="h-6 w-[1px] bg-surface-container hidden sm:block"></div>
              {/* Quick Status Pills */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "all" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  Todas (15)
                </button>
                <button
                  onClick={() => setStatusFilter("confirmed")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    statusFilter === "confirmed" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmadas
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    statusFilter === "pending" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendientes
                </button>
              </div>
            </div>

            {/* Center: Date Navigator with 'Hoy' Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 shadow-sm border border-surface-container">
                <button
                  onClick={() => showToast("Cargando día anterior...")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Día anterior"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                  <span className="text-xs font-bold text-on-surface tracking-tight">
                    Miércoles, 25 de Octubre 2025
                  </span>
                </div>
                <button
                  onClick={() => showToast("Cargando día siguiente...")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Día siguiente"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedDate("2025-10-25");
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
            {/* LEFT PANEL: Multi-Collaborator Day Schedule Grid (8 Columns on XL) */}
            <div className="xl:col-span-8 flex flex-col overflow-x-auto bg-surface pb-12 border-r border-surface-container">
              {/* Staff Columns Sticky Header */}
              <div className="grid grid-cols-[72px_repeat(3,minmax(260px,1fr))] bg-surface-container-lowest sticky top-0 z-20 shadow-sm min-w-[850px] border-b border-surface-container">
                <div className="p-3 flex items-center justify-center text-[10px] font-mono text-on-surface-variant bg-surface-container-low">
                  GMT-6
                </div>
                {/* Colaborador 1: Carlos Ramírez */}
                <div className="p-3.5 flex items-center gap-3 bg-surface-container-lowest border-r border-surface-container">
                  <div className="relative">
                    <img
                      src={COLLABORATORS[0].avatar}
                      alt="Carlos Ramírez"
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface truncate">Carlos Ramírez</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[10px]">Sillón 01</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Barbero Master • <strong className="text-primary font-medium">6 citas hoy</strong>
                    </span>
                  </div>
                </div>

                {/* Colaborador 2: Mateo Ramos (Active View) */}
                <div className="p-3.5 flex items-center gap-3 bg-surface-container-lowest border-r border-surface-container">
                  <div className="relative">
                    <img
                      src={COLLABORATORS[1].avatar}
                      alt="Mateo Ramos"
                      className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-primary"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-primary truncate">Mateo Ramos</span>
                      <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">Sillón 02</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Barbero Principal • <strong className="text-primary font-medium">5 citas hoy</strong>
                    </span>
                  </div>
                </div>

                {/* Colaborador 3: Sofía Gómez */}
                <div className="p-3.5 flex items-center gap-3 bg-surface-container-lowest">
                  <div className="relative">
                    <img
                      src={COLLABORATORS[2].avatar}
                      alt="Sofía Gómez"
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface truncate">Sofía Gómez</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[10px]">Cabina 01</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Estilista &amp; Facial • <strong className="text-primary font-medium">4 citas hoy</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Timeline Canvas (08:00 to 20:00) */}
              <div className="relative grid grid-cols-[72px_repeat(3,minmax(260px,1fr))] min-w-[850px] h-[1152px] bg-surface-container-lowest">
                {/* Vertical Timeline Hours Column */}
                <div className="flex flex-col select-none relative z-10 bg-surface-container-low/80 border-r border-surface-container">
                  {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((h) => (
                    <div
                      key={h}
                      className={`h-24 pt-2 px-2 text-right text-xs ${
                        h === "11:00" ? "text-primary font-bold" : "text-on-surface-variant font-medium"
                      }`}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* COLUMN 1: Carlos Ramírez Schedule Slots */}
                <div className="relative p-1.5 h-full bg-transparent border-r border-surface-container">
                  {/* 08:30 - 09:30 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-109")}
                    className="absolute left-2 right-2 top-[48px] h-[96px] bg-secondary-container/70 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-secondary/20"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-secondary-fixed truncate">Roberto Valdés</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Finalizada</span>
                    </div>
                    <span className="text-[11px] text-on-secondary-container line-clamp-1">Corte Ejecutivo Fade</span>
                    <div className="flex items-center justify-between text-[11px] text-secondary">
                      <span className="flex items-center gap-1 font-mono">08:30 - 09:30</span>
                      <span className="font-bold text-on-surface">$180 MXN</span>
                    </div>
                  </div>

                  {/* 10:00 - 11:00 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-105")}
                    className="absolute left-2 right-2 top-[192px] h-[96px] bg-surface-container rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-surface-container"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Emilio Sandoval</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Finalizada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Afeitado Clásico Navaja</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">10:00 - 11:00</span>
                      <span className="font-bold text-on-surface">$140 MXN</span>
                    </div>
                  </div>

                  {/* 12:30 - 13:45 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-106")}
                    className="absolute left-2 right-2 top-[432px] h-[120px] bg-surface-container rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-surface-container"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Víctor Hugo Ortiz</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">Por confirmar</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Pack Corte + Barboterapia</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">12:30 - 13:45</span>
                      <span className="font-bold text-on-surface">$280 MXN</span>
                    </div>
                  </div>

                  {/* 15:00 - 16:30 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-106")}
                    className="absolute left-2 right-2 top-[672px] h-[144px] bg-secondary-container/40 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-secondary/20"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Rodrigo Méndez</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Confirmada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Colorimetría &amp; Perfilado</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">15:00 - 16:30</span>
                      <span className="font-bold text-on-surface">$450 MXN</span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Mateo Ramos Schedule Slots (Contains the Selected Appointment) */}
                <div className="relative p-1.5 h-full bg-primary/5 border-r border-surface-container">
                  {/* 09:00 - 10:15 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-103")}
                    className="absolute left-2 right-2 top-[96px] h-[120px] bg-surface-container rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-surface-container"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Jorge Luis Nava</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Finalizada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Corte Clásico Tijera</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">09:00 - 10:15</span>
                      <span className="font-bold text-on-surface">$190 MXN</span>
                    </div>
                  </div>

                  {/* 11:15 - 12:15 -> SELECTED APPOINTMENT */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-101")}
                    className={`absolute left-1.5 right-1.5 top-[312px] h-[96px] bg-surface-container-lowest rounded-xl p-3 shadow-lg z-20 cursor-pointer flex flex-col justify-between transition-all scale-[1.01] ${
                      selectedAppointmentId === "app-101" ? "ring-2 ring-primary" : "border border-surface-container"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs font-bold text-primary truncate">Alejandro Peña</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span> Confirmada
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-on-surface">
                      <span className="font-medium text-on-surface truncate">Pack Completo Corte + Barba</span>
                      <span className="font-bold text-primary font-mono">$250 MXN</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                      <span className="flex items-center gap-1 text-primary font-medium font-mono">
                        <span className="material-symbols-outlined text-[13px]">schedule</span> 11:15 - 12:15 (En curso)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[9px] font-bold uppercase">
                        Seleccionada
                      </span>
                    </div>
                  </div>

                  {/* 13:00 - 14:00 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-102")}
                    className="absolute left-2 right-2 top-[480px] h-[96px] bg-surface-container rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-surface-container"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Daniel Carballo</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Confirmada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Arreglo Barba Express</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">13:00 - 14:00</span>
                      <span className="font-bold text-on-surface">$120 MXN</span>
                    </div>
                  </div>

                  {/* 16:30 - 17:30 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-111")}
                    className="absolute left-2 right-2 top-[816px] h-[96px] bg-secondary-container/40 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-secondary/20"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Esteban Morales</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Confirmada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Corte Fade Texturizado</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">16:30 - 17:30</span>
                      <span className="font-bold text-on-surface">$200 MXN</span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: Sofía Gómez Schedule Slots */}
                <div className="relative p-1.5 h-full bg-transparent">
                  {/* 09:30 - 11:00 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-104")}
                    className="absolute left-2 right-2 top-[144px] h-[144px] bg-surface-container rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-surface-container"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Valeria Castillo</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Finalizada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-2">Limpieza Facial Profunda con Hidratación</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">09:30 - 11:00</span>
                      <span className="font-bold text-on-surface">$520 MXN</span>
                    </div>
                  </div>

                  {/* 11:45 - 13:00 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-114")}
                    className="absolute left-2 right-2 top-[360px] h-[120px] bg-secondary-container/40 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-secondary/20"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Lucía Mendoza</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Confirmada</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Tratamiento Capilar Keratina</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">11:45 - 13:00</span>
                      <span className="font-bold text-on-surface">$650 MXN</span>
                    </div>
                  </div>

                  {/* 14:15 - 15:15 */}
                  <div
                    onClick={() => setSelectedAppointmentId("app-104")}
                    className="absolute left-2 right-2 top-[600px] h-[96px] bg-surface-container rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-surface-container"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">Camila Rios</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">Pendiente</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">Diseño &amp; Perfilado Cejas</span>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-mono">14:15 - 15:15</span>
                      <span className="font-bold text-on-surface">$180 MXN</span>
                    </div>
                  </div>
                </div>

                {/* CURRENT TIME INDICATOR RED LINE (11:30 = 336px) */}
                <div className="absolute left-0 right-0 top-[336px] z-30 pointer-events-none flex items-center">
                  <div className="w-16 flex items-center justify-end pr-1">
                    <span className="px-1.5 py-0.5 rounded bg-error text-on-error text-[10px] font-bold tracking-tight shadow-sm">
                      11:30
                    </span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-error -ml-1.5 shadow-sm"></div>
                  <div className="flex-1 h-[2px] bg-error shadow-[0_0_8px_rgba(186,26,26,0.6)]"></div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Persistent Detail & Actions of Selected Appointment (4 Columns on XL) */}
            <div className="xl:col-span-4 bg-surface-container-lowest shadow-md flex flex-col justify-between overflow-y-auto border-l border-surface-container">
              <div className="p-6 flex flex-col gap-5">
                {/* Header: Appointment ID & Status Badges */}
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
                    <span>{selectedAppointment.paymentMethod || "Pago en local"} (${selectedAppointment.price} {selectedAppointment.currency})</span>
                  </span>
                </div>

                {/* Client Profile Card */}
                <div className="p-4 rounded-2xl bg-surface-container-low flex flex-col gap-3 shadow-sm border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      Información del Cliente
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold">
                      {selectedAppointment.visitCount || 3}ra Visita (Recurrente)
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
                      <span className="truncate">{selectedAppointment.clientPhone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedAppointment.clientPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm text-xs font-bold border border-emerald-200"
                    >
                      <span className="material-symbols-outlined text-[17px]">chat</span>
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Appointment Specifics Bento */}
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
                        <span className="font-bold text-primary font-mono">${selectedAppointment.price}.00 {selectedAppointment.currency}</span>
                      </div>
                      <span className="text-sm font-bold text-on-surface">
                        {selectedAppointment.serviceName}
                      </span>
                      <div className="flex items-center gap-2.5 text-xs text-on-surface-variant pt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">timer</span>
                          <span>Duración: {selectedAppointment.durationMinutes} min</span>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">+10 min cortesía</span>
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
                        {selectedAppointment.dayName} 25 Oct
                      </span>
                    </div>
                  </div>
                </div>

                {/* Internal Notes Card */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-900 font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">edit_note</span>
                      <span>Notas internas de agenda</span>
                    </span>
                    <button
                      onClick={() => {
                        const note = prompt("Editar nota interna:", selectedAppointment.internalNotes || "");
                        if (note !== null) {
                          setAppointments((prev) =>
                            prev.map((a) => (a.id === selectedAppointment.id ? { ...a, internalNotes: note } : a))
                          );
                          showToast("Nota interna guardada.");
                        }
                      }}
                      className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                    >
                      Editar
                    </button>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed italic">
                    "{selectedAppointment.internalNotes || "Sin notas adicionales para esta cita."}"
                  </p>
                </div>

                {/* Quick Automation Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Recordatorio enviado a ${selectedAppointment.clientName}`)}
                    className="flex-1 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-center gap-1.5 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">notifications_active</span>
                    <span>Recordatorio manual</span>
                  </button>
                  <button
                    onClick={() => showToast("Plantilla WhatsApp generada y lista para enviar.")}
                    className="flex-1 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-center gap-1.5 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">send</span>
                    <span>Plantilla WA</span>
                  </button>
                </div>
              </div>

              {/* Bottom Operational Action Buttons Ribbon */}
              <div className="p-5 bg-surface-container-low flex flex-col gap-2.5 border-t border-surface-container">
                {/* Primary Action: Marcar como completada */}
                <button
                  onClick={() => handleCompleteAppointment(selectedAppointment.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>Marcar como completada</span>
                </button>

                {/* Secondary Row: Reprogramar turno + Marcar como no asistió */}
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

                {/* Destructive Action: Cancelar cita */}
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
                  <span className="text-[10px] text-outline text-center mt-0.5">
                    Aviso según política de cancelación antes de 2h de inicio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REPROGRAMAR TURNO (skedly_agendar_nueva_cita_y_reprogramaci_n)
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
                <option value="Mateo Ramos">Mateo Ramos (Barbero Principal)</option>
                <option value="Carlos Ramírez">Carlos Ramírez (Barbero Master)</option>
                <option value="Sofía Gómez">Sofía Gómez (Estilista &amp; Facial)</option>
                <option value="Luis Hernández">Luis Hernández (Barbero Clásico)</option>
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
