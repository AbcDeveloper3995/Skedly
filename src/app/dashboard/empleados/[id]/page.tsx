"use client";

import React, { useState, useEffect, useMemo, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  MOCK_EMPLOYEES,
  FullEmployee,
  DaySchedule,
  EmployeeException,
} from "../mock-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

function EmpleadoDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "horarios";

  const { currentBusiness } = useAuth();

  // Find employee data
  const employeeData = useMemo(() => {
    return MOCK_EMPLOYEES.find((e) => e.id === id) || MOCK_EMPLOYEES[0];
  }, [id]);

  const [employee, setEmployee] = useState<FullEmployee>(employeeData);
  const [activeTab, setActiveTab] = useState<
    "resumen" | "servicios" | "horarios" | "excepciones" | "citas"
  >(
    initialTab === "horarios"
      ? "horarios"
      : initialTab === "excepciones"
      ? "excepciones"
      : initialTab === "servicios"
      ? "servicios"
      : "horarios"
  );

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  // New Exception form state
  const [excTitle, setExcTitle] = useState("");
  const [excDateRange, setExcDateRange] = useState("");
  const [excReason, setExcReason] = useState("");
  const [excBlockedHours, setExcBlockedHours] = useState("");
  const [excType, setExcType] = useState<"vacaciones" | "medico" | "personal">("vacaciones");

  // Day Schedule Edit state
  const [editDayStart, setEditDayStart] = useState("09:00");
  const [editDayEnd, setEditDayEnd] = useState("18:30");
  const [editDayBreak, setEditDayBreak] = useState("14:00 - 15:00");
  const [editDayActive, setEditDayActive] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const personalUrl = `skedly.com/${
    currentBusiness?.slug || "barberia-elite"
  }?prof=${employee.booking_slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(personalUrl);
    setCopiedLink(true);
    showToast("¡Enlace personal de reserva copiado al portapapeles!");
    setTimeout(() => setCopiedLink(false), 2400);
  };

  const handleAddException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excTitle || !excDateRange) {
      showToast("Por favor completa los datos de la excepción.");
      return;
    }

    const newExc: EmployeeException = {
      id: `exc-${Date.now()}`,
      title: excTitle,
      dateRange: excDateRange,
      reason: excReason || "Ausencia programada",
      blockedHours: excBlockedHours || "Día completo",
      type: excType,
      status: "Confirmado",
      registeredBy: "Propietario / Admin",
    };

    setEmployee((prev) => ({
      ...prev,
      exceptions: [newExc, ...prev.exceptions],
    }));

    setShowExceptionModal(false);
    setExcTitle("");
    setExcDateRange("");
    setExcReason("");
    setExcBlockedHours("");
    showToast("Excepción registrada en el calendario.");
  };

  const handleDeleteException = (excId: string) => {
    setEmployee((prev) => ({
      ...prev,
      exceptions: prev.exceptions.filter((x) => x.id !== excId),
    }));
    showToast("Excepción eliminada.");
  };

  const handleOpenDayEdit = (idx: number) => {
    const day = employee.weekly_schedule[idx];
    setEditingDayIndex(idx);
    setEditDayStart(day.start);
    setEditDayEnd(day.end);
    setEditDayBreak(day.breakTime || "");
    setEditDayActive(day.active);
  };

  const handleSaveDayEdit = () => {
    if (editingDayIndex === null) return;
    setEmployee((prev) => {
      const updated = [...prev.weekly_schedule];
      updated[editingDayIndex] = {
        ...updated[editingDayIndex],
        start: editDayStart,
        end: editDayEnd,
        breakTime: editDayBreak || undefined,
        active: editDayActive,
      };
      return { ...prev, weekly_schedule: updated };
    });
    setEditingDayIndex(null);
    showToast("Horario actualizado para este día.");
  };

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

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">
        {/* =========================================================================
            SUBHEADER / BREADCRUMB & FAST ACTION HEADER
        ========================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard/empleados"
              className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-medium w-fit"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Volver a Equipo de trabajo</span>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] uppercase tracking-wider text-primary font-bold">
                Colaboradores • Ficha técnica
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <span className="text-[11px] text-on-surface-variant">
                Sincronizado vía Google Calendar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
              Gestión completa del perfil, horarios de atención, excepciones de calendario y registro de citas en {currentBusiness?.name || "Barbería Élite Central"}.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-all text-xs font-semibold shadow-sm border border-surface-container"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">
                {copiedLink ? "check" : "share"}
              </span>
              <span>{copiedLink ? "¡Enlace copiado!" : "Compartir enlace personal"}</span>
            </button>

            <button
              onClick={() => setActiveTab("horarios")}
              className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-all text-xs font-semibold shadow-sm border border-surface-container"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                tune
              </span>
              <span>Configurar horarios</span>
            </button>

            <Link
              href={`/dashboard/empleados/nuevo?id=${employee.id}`}
              className="flex items-center gap-1.5 px-5 h-10 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all text-xs font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Editar perfil</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            EMPLOYEE PROFILE HERO BENTO BLOCK
        ========================================================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-sm border border-surface-container">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-secondary-container/20 to-transparent pointer-events-none blur-3xl"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Identity left column */}
            <div className="flex items-start sm:items-center gap-5 flex-1">
              {/* Avatar with Live Indicator */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-surface-container-high shadow-md">
                  <img
                    src={employee.avatar_url}
                    alt={employee.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm"
                  title="Activo y disponible para turnos"
                >
                  <span className="h-3 w-3 rounded-full bg-primary-container"></span>
                </span>
              </div>

              {/* Name, Role & Badges */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight truncate">
                    {employee.display_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold">
                    {employee.job_title}
                  </span>
                </div>

                {/* Contact Metadata & Internal ID */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-outline">mail</span>
                    <span className="truncate">{employee.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-outline">call</span>
                    <span>{employee.phone}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-surface-container px-2 py-0.5 rounded">
                    <span>ID: {employee.internal_id}</span>
                  </span>
                </div>

                {/* Status Pills Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Activo
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                    Cuenta Skedly Activa
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[14px]">chair</span>
                    {employee.seat}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Numerical Impact Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 shrink-0 bg-surface-container-low p-3 rounded-2xl border border-surface-container/60">
              <div className="flex flex-col px-3 py-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                  Servicios
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-on-surface">{employee.services.length}</span>
                  <span className="text-[11px] text-on-surface-variant">asignados</span>
                </div>
              </div>

              <div className="flex flex-col px-3 py-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                  Carga sem.
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-on-surface">{employee.weekly_hours}</span>
                  <span className="text-[11px] text-on-surface-variant">horas</span>
                </div>
              </div>

              <div className="flex flex-col px-3 py-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                  Citas / Mes
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-primary">148</span>
                  <span className="text-[11px] text-on-surface-variant">reservadas</span>
                </div>
              </div>

              <div className="flex flex-col px-3 py-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                  Reputación
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-on-surface">{employee.rating}</span>
                  <span className="material-symbols-outlined text-[15px] text-amber-500 fill-current">
                    star
                  </span>
                  <span className="text-[11px] text-on-surface-variant">({employee.reviews_count})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            NAVIGATION TABS BAR
        ========================================================================== */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "resumen"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            Resumen
          </button>

          <button
            onClick={() => setActiveTab("servicios")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "servicios"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span>Servicios asignados</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface text-[11px]">
              {employee.services.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("horarios")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "horarios"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Horarios y Disponibilidad</span>
            <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
          </button>

          <button
            onClick={() => setActiveTab("excepciones")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "excepciones"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span>Excepciones y Vacaciones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">
              {employee.exceptions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("citas")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "citas"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            Historial de Citas
          </button>
        </div>

        {/* =========================================================================
            MAIN WORKSPACE: ASYMMETRIC 2-COLUMN SPLIT
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT / CENTRAL PANELS (8 Cols) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* PANEL 1: Horarios Semanales de Trabajo */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-7 shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      calendar_today
                    </span>
                    <h2 className="text-base font-bold text-on-surface">
                      Horarios regulares de disponibilidad
                    </h2>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Define los días y franjas horarias en los que {employee.display_name} puede recibir reservas online y presenciales.
                  </p>
                </div>
                <Link
                  href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Modificar franjas horarias</span>
                </Link>
              </div>

              {/* Weekly Schedule Cards Grid */}
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {employee.weekly_schedule.map((day, idx) => (
                  <div
                    key={day.dayKey}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl transition-colors gap-2 border ${
                      day.active
                        ? "bg-surface-container-low hover:bg-surface-container border-surface-container/60"
                        : "bg-surface-container-high/60 border-transparent opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                          day.active
                            ? day.dayKey === "vie"
                              ? "bg-primary-fixed text-on-primary-fixed"
                              : "bg-surface-container-lowest text-on-surface shadow-sm"
                            : "bg-surface-container text-outline"
                        }`}
                      >
                        {day.dayShort}
                      </span>
                      <div className="flex flex-col">
                        {day.active ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-on-surface font-mono">
                                {day.start} — {day.end}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                                {day.tag || "Turno activo"}
                              </span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant">
                              {day.breakTime
                                ? `Pausa intermedia almuerzo: ${day.breakTime}`
                                : "Sin pausa intermedia de almuerzo"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-outline">
                              Descanso semanal
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              No laborable • La agenda pública permanece cerrada
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          day.active
                            ? "bg-surface-container-lowest text-on-surface-variant"
                            : "bg-surface-container text-outline font-semibold"
                        }`}
                      >
                        {day.active ? day.tag || "Activo" : "Cerrado"}
                      </span>
                      <button
                        onClick={() => handleOpenDayEdit(idx)}
                        className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                        title={`Editar ${day.day}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PANEL 2: Excepciones de Disponibilidad y Ausencias */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-7 shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[22px]">
                      event_busy
                    </span>
                    <h2 className="text-base font-bold text-on-surface">
                      Excepciones de disponibilidad y días libres
                    </h2>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Registra vacaciones, citas médicas o ausencias puntuales. En estas fechas el motor de reservas bloqueará automáticamente los turnos.
                  </p>
                </div>

                <button
                  onClick={() => setShowExceptionModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-all text-xs font-semibold whitespace-nowrap self-start sm:self-auto shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ Registrar nueva excepción</span>
                </button>
              </div>

              {/* Exception Cards Deck */}
              {employee.exceptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {employee.exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="p-4 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                              <span className="material-symbols-outlined text-[16px]">
                                {exc.type === "vacaciones"
                                  ? "flight"
                                  : exc.type === "medico"
                                  ? "medical_services"
                                  : "event_busy"}
                              </span>
                            </span>
                            <h3 className="text-xs font-bold text-on-surface">
                              {exc.title}
                            </h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                            {exc.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-1">
                          <span className="material-symbols-outlined text-[16px]">
                            calendar_month
                          </span>
                          <span>{exc.dateRange}</span>
                        </div>

                        <div className="flex flex-col gap-1 mt-2 text-on-surface-variant text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-outline font-medium">Motivo:</span>
                            <span className="text-on-surface font-medium truncate max-w-[180px]">
                              {exc.reason}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-outline font-medium">Turnos bloqueados:</span>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono font-semibold text-[11px]">
                              {exc.blockedHours}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-surface-container/60 text-[11px]">
                        <span className="text-outline truncate">{exc.registeredBy}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteException(exc.id)}
                            className="px-2.5 py-1 rounded-lg hover:bg-error-container text-error font-semibold transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                  No hay excepciones o vacaciones programadas para este colaborador.
                </div>
              )}
            </div>

            {/* PANEL 3: Registro de Actividad y Citas Asignadas */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-7 shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-on-surface">
                    Resumen de actividad reciente de citas
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Turnos más recientes procesados y asignados exclusivamente a la agenda de {employee.display_name}.
                  </p>
                </div>
                <Link
                  href="/dashboard/calendario"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                >
                  <span>Ver calendario completo</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* Appointments List View */}
              <div className="flex flex-col gap-2 pt-1">
                {employee.recentAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-3 border border-surface-container/60"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          app.status === "En curso"
                            ? "bg-primary-container text-on-primary-container"
                            : app.status === "No asistió"
                            ? "bg-error-container text-error"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {app.status === "En curso"
                            ? "content_cut"
                            : app.status === "No asistió"
                            ? "person_off"
                            : app.status === "Completada"
                            ? "check"
                            : "face"}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold text-on-surface ${
                              app.status === "No asistió" ? "line-through opacity-80" : ""
                            }`}
                          >
                            {app.clientName}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              app.status === "No asistió" ? "text-error" : "text-primary"
                            }`}
                          >
                            {app.serviceName}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          {app.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-xs font-bold font-mono text-on-surface">
                        ${app.price} {app.currency}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          app.status === "En curso"
                            ? "bg-primary-fixed text-on-primary-fixed animate-pulse"
                            : app.status === "Confirmada"
                            ? "bg-secondary-container text-on-secondary-container"
                            : app.status === "Completada"
                            ? "bg-surface-container text-on-surface-variant"
                            : "bg-error-container text-error"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Micro Metrics Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 bg-surface-container-low p-3.5 rounded-xl border border-surface-container/60 mt-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">thumb_up</span>
                  <span className="font-semibold text-on-surface">Tasa de puntualidad de atención:</span>
                  <span className="font-bold text-primary">98.4%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
                  <span className="text-on-surface-variant font-medium">0 quejas o incidencias este trimestre</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDEBAR / WIDGET COLUMN (4 Cols) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Enlace Personal de Reservas Directas */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">link</span>
                <span className="text-[11px] uppercase tracking-wider font-bold">
                  Enlace personal de reserva
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Comparte este vínculo para que los clientes reserven directamente en el sillón y agenda de {employee.display_name} sin pasar por la selección de barbero general.
              </p>

              {/* Input field with Copy Button */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-xl border border-surface-container">
                  <input
                    type="text"
                    readOnly
                    value={personalUrl}
                    className="bg-transparent text-on-surface font-mono text-[11px] w-full focus:outline-none px-2 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedLink ? "check" : "content_copy"}
                    </span>
                    <span>{copiedLink ? "¡Copiado!" : "Copiar"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-outline text-[11px] px-1">
                  <span>QR disponible para vitrina</span>
                  <button
                    onClick={() => showToast("Generando PDF de código QR...")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Descargar PDF QR
                  </button>
                </div>
              </div>

              {/* Small Visual QR Preview */}
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-3 border border-surface-container/60">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    qr_code_2
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-on-surface truncate">
                    Código QR de Reserva Rápida
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Listo para imprimir en tarjetas o espejo
                  </span>
                </div>
              </div>
            </div>

            {/* Widget 2: Estado de Seguridad, Roles & Permisos */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex items-center gap-2 text-on-surface font-bold">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  admin_panel_settings
                </span>
                <span className="text-xs sm:text-sm">Estado de seguridad y acceso</span>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col p-3 rounded-xl bg-surface-container-low gap-1 border border-surface-container/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                      Nivel de permisos
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                      Rol: Empleado
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                    Acceso exclusivo a su calendario, citas personales y avisos. Sin acceso a facturación global ni métricas financieras del negocio.
                  </p>
                </div>

                {/* Calendar Sync Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface leading-tight">
                        Google Calendar Sync
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Última sincronización: hace {employee.last_sync_mins || 12} min
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast("Sincronizando con Google Calendar...")}
                    className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                    title="Forzar sincronización ahora"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                  </button>
                </div>
              </div>

              {/* Danger and Key Actions */}
              <div className="flex flex-col gap-2 pt-1 border-t border-surface-container/60">
                <button
                  onClick={() => showToast(`Enlace para restablecer contraseña enviado a ${employee.email}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">lock_reset</span>
                  <span>Restablecer contraseña de acceso</span>
                </button>
                <button
                  onClick={() => showToast(`Credenciales de ${employee.display_name} suspendidas temporalmente.`)}
                  className="w-full flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-error-container hover:bg-error-container/80 text-error text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">block</span>
                  <span>Revocar credenciales y suspender</span>
                </button>
              </div>
            </div>

            {/* Widget 3: Servicios Principales Habilitados */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-on-surface">
                  Servicios habilitados ({employee.services.length})
                </h3>
                <Link
                  href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Editar asignaciones
                </Link>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {employee.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-xs border border-surface-container/60"
                  >
                    <span className="font-semibold text-on-surface truncate">
                      {srv.name}
                    </span>
                    <span className="font-mono text-outline font-semibold text-[11px] shrink-0">
                      {srv.duration} min • ${srv.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: REGISTRAR NUEVA EXCEPCIÓN
      ========================================================================== */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">event_busy</span>
                <h3 className="text-sm font-bold text-on-surface">
                  Registrar excepción para {employee.display_name}
                </h3>
              </div>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddException} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Tipo de excepción
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExcType("vacaciones")}
                    className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border ${
                      excType === "vacaciones"
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-container-low border-surface-container text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">flight</span>
                    <span>Vacaciones</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcType("medico")}
                    className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border ${
                      excType === "medico"
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-container-low border-surface-container text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">medical_services</span>
                    <span>Médico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcType("personal")}
                    className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border ${
                      excType === "personal"
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-container-low border-surface-container text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">person</span>
                    <span>Personal</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Título de la excepción *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vacaciones de Verano / Cita Dental"
                  value={excTitle}
                  onChange={(e) => setExcTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Rango de fechas / Horario *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 12 Ago 2026 — 18 Ago 2026 ó 09:00 a 13:00"
                  value={excDateRange}
                  onChange={(e) => setExcDateRange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Horas bloqueadas
                </label>
                <input
                  type="text"
                  placeholder="Ej. 4 días completos (34 hrs) / 4 horas"
                  value={excBlockedHours}
                  onChange={(e) => setExcBlockedHours(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Motivo o notas internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre la ausencia o autorización..."
                  value={excReason}
                  onChange={(e) => setExcReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="px-4 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 h-10 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm"
                >
                  Guardar excepción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR HORARIO DE DÍA ESPECÍFICO
      ========================================================================== */}
      {editingDayIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                <h4 className="text-xs font-bold text-on-surface">
                  Horario de {employee.weekly_schedule[editingDayIndex].day}
                </h4>
              </div>
              <button
                onClick={() => setEditingDayIndex(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editDayActive}
                  onChange={(e) => setEditDayActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <span className="text-xs font-semibold text-on-surface">
                  Día habilitado para atención
                </span>
              </label>

              {editDayActive && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-on-surface font-semibold block mb-1">
                        Hora inicio
                      </label>
                      <input
                        type="time"
                        value={editDayStart}
                        onChange={(e) => setEditDayStart(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-mono font-bold border border-surface-container focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-on-surface font-semibold block mb-1">
                        Hora fin
                      </label>
                      <input
                        type="time"
                        value={editDayEnd}
                        onChange={(e) => setEditDayEnd(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-mono font-bold border border-surface-container focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-on-surface font-semibold block mb-1">
                      Pausa de descanso (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 14:00 - 15:00"
                      value={editDayBreak}
                      onChange={(e) => setEditDayBreak(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setEditingDayIndex(null)}
                className="px-3.5 h-9 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDayEdit}
                className="px-4 h-9 rounded-xl bg-primary text-on-primary text-xs font-semibold"
              >
                Guardar día
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmpleadoDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-on-surface-variant">
          Cargando ficha técnica del colaborador...
        </div>
      }
    >
      <EmpleadoDetailContent id={unwrappedParams.id} />
    </Suspense>
  );
}

