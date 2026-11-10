"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface ExceptionItem {
  id: string;
  title: string;
  scope: string;
  dateStr: string;
  timeStr: string;
  badge: string;
  badgeColor: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  note?: string;
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

const INITIAL_EXCEPTIONS: ExceptionItem[] = [
  {
    id: "exc-1",
    title: "Cierre por Festivo Local",
    scope: "Todo el negocio",
    dateStr: "1 Nov 2025",
    timeStr: "Todo el día",
    badge: "Activa",
    badgeColor: "bg-secondary-fixed text-on-secondary-fixed",
    icon: "celebration",
    iconBg: "bg-error-container",
    iconColor: "text-on-error-container",
  },
  {
    id: "exc-2",
    title: "Vacaciones de Otoño",
    scope: "Carlos Ramírez",
    dateStr: "15 al 18 Nov 2025",
    timeStr: "4 días bloqueados",
    badge: "4 días bloqueados",
    badgeColor: "bg-primary-fixed-dim text-on-primary-fixed",
    icon: "beach_access",
    iconBg: "bg-primary-fixed",
    iconColor: "text-primary",
    note: "Congreso estilismo",
  },
  {
    id: "exc-3",
    title: "Mantenimiento de sillones",
    scope: "Zona Barbería Central",
    dateStr: "28 Oct 2025",
    timeStr: "14:00 - 16:00",
    badge: "2 turnos bloqueados",
    badgeColor: "bg-surface-container-high text-on-surface",
    icon: "build",
    iconBg: "bg-secondary-container",
    iconColor: "text-on-secondary-container",
  },
];

const INITIAL_SCHEDULE: DayRow[] = [
  {
    weekday: 1,
    name: "Lunes",
    isAvailable: true,
    statusLabel: "Laborable",
    startTime: "09:00",
    endTime: "19:30",
    hasLunch: true,
    lunchStart: "14:00",
    lunchEnd: "15:00",
  },
  {
    weekday: 2,
    name: "Martes",
    isAvailable: true,
    statusLabel: "Laborable",
    startTime: "09:00",
    endTime: "19:30",
    hasLunch: true,
    lunchStart: "14:00",
    lunchEnd: "15:00",
  },
  {
    weekday: 3,
    name: "Miércoles",
    isAvailable: true,
    statusLabel: "Laborable",
    startTime: "09:00",
    endTime: "19:30",
    hasLunch: true,
    lunchStart: "14:00",
    lunchEnd: "15:00",
  },
  {
    weekday: 4,
    name: "Jueves",
    isAvailable: true,
    statusLabel: "Laborable",
    startTime: "09:00",
    endTime: "19:30",
    hasLunch: true,
    lunchStart: "14:00",
    lunchEnd: "15:00",
  },
  {
    weekday: 5,
    name: "Viernes",
    isAvailable: true,
    statusLabel: "Laborable",
    startTime: "10:00",
    endTime: "20:30",
    hasLunch: true,
    lunchStart: "14:30",
    lunchEnd: "15:30",
  },
  {
    weekday: 6,
    name: "Sábado",
    isAvailable: true,
    statusLabel: "Media jornada",
    startTime: "09:00",
    endTime: "14:30",
    hasLunch: false,
    lunchStart: "14:00",
    lunchEnd: "15:00",
  },
  {
    weekday: 0,
    name: "Domingo",
    isAvailable: false,
    statusLabel: "No laborable",
    startTime: "10:00",
    endTime: "14:00",
    hasLunch: false,
    lunchStart: "14:00",
    lunchEnd: "15:00",
  },
];

const COLLABORATORS_DATA = [
  {
    id: "carlos",
    name: "Carlos Ramírez",
    role: "Barbero Master",
    code: "SKD-CR-082",
    location: "Sede Central",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "sofia",
    name: "Sofía Alarcón",
    role: "Colorista",
    code: "SKD-SA-044",
    location: "Sede Central",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "david",
    name: "David Méndez",
    role: "Estilista Senior",
    code: "SKD-DM-019",
    location: "Sede Central",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "lucia",
    name: "Lucía Gómez",
    role: "Recepción y Tratamientos",
    code: "SKD-LG-005",
    location: "Sede Central",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
];

function HorariosContent() {
  const { currentBusiness } = useAuth();
  const formReasonRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"business" | "staff" | "exceptions">("exceptions");
  const [showSimulatedEmpty, setShowSimulatedEmpty] = useState(false);

  // Exceptions List
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);

  // Fast Exception Creator Form State
  const [exceptionType, setExceptionType] = useState<"vacaciones" | "personal" | "festivo" | "medica">("vacaciones");
  const [scope, setScope] = useState("carlos");
  const [dateFrom, setDateFrom] = useState("2025-11-15");
  const [dateTo, setDateTo] = useState("2025-11-18");
  const [timeMode, setTimeMode] = useState<"full_day" | "specific">("full_day");
  const [timeStart, setTimeStart] = useState("14:00");
  const [timeEnd, setTimeEnd] = useState("16:30");
  const [reason, setReason] = useState("Congreso de estilismo y actualización profesional");
  const [savingException, setSavingException] = useState(false);
  const [savedExceptionSuccess, setSavedExceptionSuccess] = useState(false);

  // Selected Staff Profile in Right Panel
  const [selectedStaffId, setSelectedStaffId] = useState("carlos");
  const selectedStaff = COLLABORATORS_DATA.find((c) => c.id === selectedStaffId) || COLLABORATORS_DATA[0];

  // Schedule Inherit vs Custom Toggle
  const [scheduleMode, setScheduleMode] = useState<"inherit" | "custom">("custom");

  // Weekly Schedule Grid State
  const [schedule, setSchedule] = useState<DayRow[]>(INITIAL_SCHEDULE);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedScheduleSuccess, setSavedScheduleSuccess] = useState(false);

  // Quick Exception scroll and highlight trigger
  const handleQuickExceptionClick = () => {
    if (formReasonRef.current) {
      formReasonRef.current.focus();
      formReasonRef.current.classList.add("ring-2", "ring-primary");
      setTimeout(() => {
        formReasonRef.current?.classList.remove("ring-2", "ring-primary");
      }, 1500);
    }
  };

  // Submit Fast Exception
  const handleSaveException = async () => {
    setSavingException(true);

    try {
      const typeLabels = {
        vacaciones: { title: "Vacaciones", icon: "beach_access", bg: "bg-primary-fixed", color: "text-primary" },
        personal: { title: "Asunto personal", icon: "person", bg: "bg-secondary-container", color: "text-on-secondary-container" },
        festivo: { title: "Festivo / Cierre", icon: "celebration", bg: "bg-error-container", color: "text-on-error-container" },
        medica: { title: "Pausa médica", icon: "medical_services", bg: "bg-tertiary-fixed", color: "text-tertiary" },
      };

      const meta = typeLabels[exceptionType];
      const targetStaff = COLLABORATORS_DATA.find((c) => c.id === scope);
      const scopeLabel = scope === "all" ? "Todo el negocio" : targetStaff?.name || "Colaborador";

      const newExc: ExceptionItem = {
        id: `exc-${Date.now()}`,
        title: meta.title,
        scope: scopeLabel,
        dateStr: `${dateFrom} al ${dateTo}`,
        timeStr: timeMode === "full_day" ? "Todo el día" : `${timeStart} - ${timeEnd}`,
        badge: timeMode === "full_day" ? "Día bloqueado" : "Franja bloqueada",
        badgeColor: "bg-secondary-fixed text-on-secondary-fixed",
        icon: meta.icon,
        iconBg: meta.bg,
        iconColor: meta.color,
        note: reason,
      };

      // If connected to Supabase, store exception
      if (currentBusiness?.id) {
        await supabase.from("availability_exceptions").insert({
          business_id: currentBusiness.id,
          employee_id: scope === "all" ? null : scope,
          exception_date: dateFrom,
          is_available: false,
          start_time: timeMode === "full_day" ? null : timeStart + ":00",
          end_time: timeMode === "full_day" ? null : timeEnd + ":00",
          reason: reason || meta.title,
        });
      }

      setExceptions((prev) => [newExc, ...prev]);
      setSavedExceptionSuccess(true);
      setTimeout(() => setSavedExceptionSuccess(false), 2400);
    } catch (err) {
      console.error("Error creating exception:", err);
    } finally {
      setSavingException(false);
    }
  };

  // Delete Exception
  const handleDeleteException = (id: string) => {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
  };

  // Toggle Day Available
  const handleToggleDay = (weekday: number) => {
    setSchedule((prev) =>
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

  // Change Shift Hours
  const handleShiftChange = (weekday: number, field: "startTime" | "endTime", val: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, [field]: val } : day))
    );
  };

  // Change Lunch Hours
  const handleLunchChange = (weekday: number, field: "lunchStart" | "lunchEnd", val: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? { ...day, [field]: val } : day))
    );
  };

  // Copy Schedule to all workdays
  const handleCopySchedule = () => {
    const monday = schedule.find((s) => s.weekday === 1) || schedule[0];
    setSchedule((prev) =>
      prev.map((day) =>
        day.weekday >= 1 && day.weekday <= 5
          ? {
              ...day,
              isAvailable: true,
              statusLabel: "Laborable",
              startTime: monday.startTime,
              endTime: monday.endTime,
              lunchStart: monday.lunchStart,
              lunchEnd: monday.lunchEnd,
            }
          : day
      )
    );
  };

  // Save Weekly Schedule
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      if (currentBusiness?.id) {
        for (const row of schedule) {
          await supabase.from("working_hours").upsert(
            {
              business_id: currentBusiness.id,
              employee_id: scheduleMode === "custom" && selectedStaffId !== "all" ? selectedStaffId : null,
              weekday: row.weekday,
              is_available: row.isAvailable,
              start_time: row.startTime + ":00",
              end_time: row.endTime + ":00",
            },
            { onConflict: "business_id,weekday" }
          );
        }
      }
      setSavedScheduleSuccess(true);
      setTimeout(() => setSavedScheduleSuccess(false), 2400);
    } catch (err) {
      console.error("Error saving schedule:", err);
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1440px] mx-auto gap-6 pb-12">
      {/* Sub-header / Page Title Banner */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
              <Link href="/dashboard" className="hover:text-on-surface">
                Principal
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link href="/dashboard/calendario" className="hover:text-on-surface">
                Calendario
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-bold">Disponibilidad y Excepciones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Disponibilidad y Horarios de Agenda
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl">
              Configura cuándo puede recibir citas tu negocio y cada integrante del equipo, y gestiona bloqueos o festivos en tiempo real.
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
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "business"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            Horarios del Negocio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "staff"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            Disponibilidad por Colaborador
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("exceptions")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "exceptions"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>Excepciones y Vacaciones (Activo)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSimulatedEmpty(!showSimulatedEmpty)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ml-auto ${
              showSimulatedEmpty
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>{showSimulatedEmpty ? "Modo Demo Activo" : "Simular Estados Vacíos"}</span>
          </button>
        </div>
      </div>

      {/* Operational Metric Stats / Micro HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Capacidad Activa
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">89.4%</span>
            <span className="text-[11px] text-primary flex items-center gap-0.5 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> 4 estilistas en servicio
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">timelapse</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Excepciones Activas
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">{exceptions.length} Bloqueos</span>
            <span className="text-[11px] text-on-surface-variant mt-1">Próximos 30 días</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[24px]">event_repeat</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Turnos Protegidos
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">18 Citas</span>
            <span className="text-[11px] text-tertiary flex items-center gap-0.5 mt-1 font-medium">
              <span className="material-symbols-outlined text-[14px]">verified</span> Sin solapamientos
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[24px]">shield</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-on-surface-variant font-medium tracking-wider">
              Próximo Festivo
            </span>
            <span className="text-2xl font-bold text-on-surface mt-0.5">1 Nov 2025</span>
            <span className="text-[11px] text-error font-medium mt-1">Local Cerrado completo</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-error-container flex items-center justify-center text-on-error-container">
            <span className="material-symbols-outlined text-[24px]">door_front</span>
          </div>
        </div>
      </div>

      {/* Main Dual Panel Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT PANEL (5 cols on XL): Excepciones & Bloqueos */}
        <section className="xl:col-span-5 flex flex-col gap-6">
          {/* Card: Fast Exception Creator Form */}
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_circle</span>
                <h2 className="text-lg font-bold text-on-surface">Registrar Excepción</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                Modo Rápido
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Inhabilita turnos temporalmente para todo el negocio o para miembros individuales del equipo.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveException();
              }}
              className="flex flex-col gap-4"
            >
              {/* 1. Exception Type Chip Selectors */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Tipo de excepción</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "vacaciones", label: "Vacaciones" },
                    { id: "personal", label: "Asunto personal" },
                    { id: "festivo", label: "Festivo nacional / Cierre local" },
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

              {/* 2. Scope / Target */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Ámbito de aplicación</label>
                <div className="relative">
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="w-full h-11 px-3.5 pr-10 bg-surface-container-low text-on-surface rounded-xl text-xs font-semibold focus:bg-surface-container-lowest focus:outline-none appearance-none cursor-pointer border border-outline-variant/30 focus:border-primary"
                  >
                    <option value="all">🏢 Todo el negocio (Bloqueo general)</option>
                    <option value="carlos">👤 Empleado específico: Carlos Ramírez (Barbero Master)</option>
                    <option value="sofia">👤 Empleada específica: Sofía Alarcón (Colorista)</option>
                    <option value="david">👤 Empleado específico: David Méndez (Estilista Senior)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* 3. Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">Desde</label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 bg-surface-container-low text-on-surface rounded-xl text-xs font-medium focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30 focus:border-primary"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px]">
                      calendar_today
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">Hasta</label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 bg-surface-container-low text-on-surface rounded-xl text-xs font-medium focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30 focus:border-primary"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px]">
                      event
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Time Range Toggle & Pickers */}
              <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-2 border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface">Franja horaria</span>
                  <div className="flex bg-surface-container p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setTimeMode("full_day")}
                      className={`px-2.5 py-1 rounded text-xs transition-all ${
                        timeMode === "full_day"
                          ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Todo el día
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMode("specific")}
                      className={`px-2.5 py-1 rounded text-xs transition-all ${
                        timeMode === "specific"
                          ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Horas específicas
                    </button>
                  </div>
                </div>

                {/* Specific Range Row */}
                {timeMode === "specific" && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-on-surface-variant font-medium">Hora inicio</span>
                      <input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        className="h-9 px-2 bg-surface-container-lowest rounded-lg text-on-surface text-xs focus:outline-none border border-outline-variant/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-on-surface-variant font-medium">Hora fin</span>
                      <input
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className="h-9 px-2 bg-surface-container-lowest rounded-lg text-on-surface text-xs focus:outline-none border border-outline-variant/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Reason or Internal Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Motivo o nota interna</label>
                <input
                  ref={formReasonRef}
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Indica el motivo del bloqueo..."
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl text-xs focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30 focus:border-primary placeholder:text-outline transition-all"
                />
                <span className="text-[11px] text-on-surface-variant">
                  Esta nota sólo será visible por administradores y recepcionistas.
                </span>
              </div>

              {/* Submit Button */}
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
                    <span>Guardando bloqueo...</span>
                  </>
                ) : savedExceptionSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">done</span>
                    <span>¡Excepción Registrada con Éxito!</span>
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

          {/* Card: Scheduled Exceptions List */}
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">format_list_bulleted</span>
                <h3 className="text-lg font-bold text-on-surface">Excepciones Programadas</h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                {exceptions.length} registros activos
              </span>
            </div>

            {/* Simulated Empty State or Active Exceptions */}
            {showSimulatedEmpty ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant mb-3">
                  <span className="material-symbols-outlined text-[28px]">event_available</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface">Sin excepciones registradas</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mt-1">
                  Tu negocio opera en horarios normales sin ningún día festivo o bloqueo programado.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSimulatedEmpty(false)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-surface-container-highest text-primary text-xs font-semibold hover:bg-surface-container transition-colors"
                >
                  Restaurar vista demo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {exceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="p-4 bg-surface-container-low hover:bg-surface-container transition-all rounded-xl flex flex-col gap-2.5 border border-outline-variant/20 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg ${exc.iconBg} ${exc.iconColor} flex items-center justify-center shrink-0`}
                        >
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

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container-high/40">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                        <span className="text-on-surface font-semibold">{exc.dateStr}</span>
                        <span className="text-outline mx-0.5">•</span>
                        <span>{exc.timeStr}</span>
                        {exc.note && (
                          <>
                            <span className="text-outline mx-0.5">•</span>
                            <span className="text-secondary italic">{exc.note}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleDeleteException(exc.id)}
                          className="px-2 py-1 rounded text-error hover:bg-error-container text-[11px] font-medium transition-colors"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL (7 cols on XL): Availability Matrix vs. Staff */}
        <section className="xl:col-span-7 flex flex-col gap-6">
          {/* Staff Profile Selector Card */}
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Staff Selector Info */}
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={selectedStaff.avatar}
                    alt={selectedStaff.name}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                  />
                  <span className="w-3.5 h-3.5 rounded-full bg-primary-container absolute -bottom-1 -right-1 ring-2 ring-surface-container-lowest"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-primary font-bold tracking-wider">Colaborador en foco</span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-on-surface">{selectedStaff.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      {selectedStaff.role}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    ID: {selectedStaff.code} • {selectedStaff.location}
                  </span>
                </div>
              </div>

              {/* Fast Switch Staff Dropdown */}
              <div className="flex items-center">
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="h-10 pl-3 pr-8 bg-surface-container-low text-on-surface rounded-xl text-xs font-semibold focus:bg-surface-container-lowest focus:outline-none cursor-pointer border border-outline-variant/30"
                  >
                    {COLLABORATORS_DATA.map((col) => (
                      <option key={col.id} value={col.id}>
                        Cambiar a: {col.name} ({col.role})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant pointer-events-none text-[18px]">
                    unfold_more
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Toggle: Inherit vs Custom Schedule */}
            <div className="p-4 bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-on-surface leading-tight">Configuración de Horario</span>
                  <span className="text-[11px] text-on-surface-variant">Controla si sigue el horario general o tiene su propia franja</span>
                </div>
              </div>

              {/* Switch Pill Selector */}
              <div className="flex bg-surface-container p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setScheduleMode("inherit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    scheduleMode === "inherit"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Heredar negocio (09:00 - 20:00)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    scheduleMode === "custom"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Horario individual personalizado
                </button>
              </div>
            </div>

            {/* Real-Time Capacity Badge & Anti-collision Banner */}
            <div className="p-4 bg-secondary-fixed/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-secondary-fixed">Capacidad Semanal Estimada</span>
                  <span className="text-[11px] text-on-secondary-fixed-variant">
                    Calculada tras descontar descansos y pausas
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="px-3 py-1 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-bold shadow-sm">
                  43.5 horas hábiles
                </div>
                <span className="text-[11px] text-on-secondary-fixed-variant font-medium">~52 citas máx/semana</span>
              </div>
            </div>

            {/* Anti-collision validation callout */}
            <div className="px-4 py-2.5 bg-primary/10 rounded-xl flex items-center justify-between gap-2 border border-primary/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                <span className="text-[11px] text-on-surface font-medium">
                  <strong>Regla activa:</strong> Anti-colisión en tiempo real habilitada. El motor impide reservas dobles y respeta descansos.
                </span>
              </div>
              <span className="material-symbols-outlined text-primary text-[16px] shrink-0">check_circle</span>
            </div>

            {/* Weekly Schedule Grid (Monday to Sunday) */}
            <div className="flex flex-col gap-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-on-surface">Cuadrícula Semanal</h4>
                <button
                  type="button"
                  onClick={handleCopySchedule}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copiar horario a toda la semana</span>
                </button>
              </div>

              {/* Day Rows */}
              {schedule.map((day) => {
                return (
                  <div
                    key={day.weekday}
                    className={`p-3 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all border ${
                      day.isAvailable
                        ? "bg-surface-container-low hover:bg-surface-container border-outline-variant/20"
                        : "bg-surface-container/60 border-transparent opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[130px]">
                      {/* Switch toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.isAvailable}
                          onChange={() => handleToggleDay(day.weekday)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${day.isAvailable ? "text-on-surface" : "text-on-surface-variant"}`}>
                          {day.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            day.isAvailable ? "text-primary" : "text-error"
                          }`}
                        >
                          {day.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Hours & Breaks */}
                    {day.isAvailable ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
                          <span className="text-[11px] text-on-surface-variant font-medium">Turno:</span>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleShiftChange(day.weekday, "startTime", e.target.value)}
                            className="bg-transparent text-on-surface text-xs font-medium focus:outline-none"
                          />
                          <span className="text-outline text-xs">-</span>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleShiftChange(day.weekday, "endTime", e.target.value)}
                            className="bg-transparent text-on-surface text-xs font-medium focus:outline-none"
                          />
                        </div>

                        {day.hasLunch ? (
                          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
                            <span className="material-symbols-outlined text-secondary text-[16px]">restaurant</span>
                            <span className="text-[11px] text-on-surface-variant font-medium">Almuerzo:</span>
                            <input
                              type="time"
                              value={day.lunchStart}
                              onChange={(e) => handleLunchChange(day.weekday, "lunchStart", e.target.value)}
                              className="bg-transparent text-on-surface text-[11px] focus:outline-none"
                            />
                            <span className="text-outline text-xs">-</span>
                            <input
                              type="time"
                              value={day.lunchEnd}
                              onChange={(e) => handleLunchChange(day.weekday, "lunchEnd", e.target.value)}
                              className="bg-transparent text-on-surface text-[11px] focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant italic px-2">Sin pausa de comida</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant text-[11px] font-medium border border-outline-variant/20">
                          Día libre / Local cerrado
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 self-end lg:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day.weekday)}
                        className="p-1 rounded text-on-surface-variant hover:text-on-surface"
                        title={day.isAvailable ? "Añadir pausa" : "Habilitar día"}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {day.isAvailable ? "add" : "tune"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action bottom save */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setSchedule(INITIAL_SCHEDULE)}
                className="px-4 h-10 rounded-xl bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors"
              >
                Descartar cambios
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className={`px-5 h-10 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                  savedScheduleSuccess
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-primary text-on-primary hover:bg-primary-container"
                }`}
              >
                {savingSchedule ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Guardando matriz...</span>
                  </>
                ) : savedScheduleSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>¡Matriz Guardada!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Guardar matriz semanal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Friendly Info Card at bottom */}
          <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border-l-4 border-l-primary border border-outline-variant/30 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[30px]">calendar_view_week</span>
            </div>
            <div className="flex flex-col flex-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-on-surface">Agenda libre sin citas pendientes en este día</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Todos los turnos están 100% disponibles para recibir reservas en tu página pública. Si necesitas pausar citas de última hora, usa el registro rápido de excepciones a la izquierda.
              </p>
            </div>
            <Link
              href="/dashboard/pagina-de-reservas"
              className="px-4 h-10 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Ver reservas públicas</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </section>
      </div>
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
