"use client";

import React, { useState, useEffect, useMemo, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  MOCK_EMPLOYEES,
  FullEmployee,
  DaySchedule,
  EmployeeException,
  RecentAppointment,
  EmployeeService,
} from "../mock-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

function EmpleadoDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "resumen";

  const { currentBusiness } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<FullEmployee | null>(null);
  const [activeTab, setActiveTab] = useState<
    "resumen" | "servicios" | "horarios" | "excepciones" | "citas"
  >(
    initialTab === "servicios"
      ? "servicios"
      : initialTab === "horarios"
      ? "horarios"
      : initialTab === "excepciones"
      ? "excepciones"
      : initialTab === "citas"
      ? "citas"
      : "resumen"
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

  // 1. Fetch Real Employee Data from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadEmployee() {
      setLoading(true);
      try {
        // Query employee from Supabase
        const { data: dbEmp, error: empErr } = await supabase
          .from("employees")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (empErr || !dbEmp) {
          // Fallback to mock employee if exists
          const found = MOCK_EMPLOYEES.find((e) => e.id === id);
          if (found && isMounted) {
            setEmployee(found);
          }
          if (isMounted) setLoading(false);
          return;
        }

        // Query employee_services with services details
        const { data: empServices } = await supabase
          .from("employee_services")
          .select("service_id, services(id, name, price, duration_minutes)")
          .eq("employee_id", id);

        const mappedServices: EmployeeService[] = (empServices || [])
          .map((item: any) => {
            const s = item.services;
            if (!s) return null;
            return {
              id: s.id,
              name: s.name,
              category: "General",
              duration: s.duration_minutes,
              price: Number(s.price),
            };
          })
          .filter(Boolean) as EmployeeService[];

        // Query working_hours
        const { data: wh } = await supabase
          .from("working_hours")
          .select("*")
          .eq("employee_id", id)
          .order("weekday", { ascending: true });

        const DEFAULT_DAYS: DaySchedule[] = [
          { day: "Lunes", dayShort: "Lun", dayKey: "lun", weekday: 1, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
          { day: "Martes", dayShort: "Mar", dayKey: "mar", weekday: 2, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
          { day: "Miércoles", dayShort: "Mié", dayKey: "mie", weekday: 3, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
          { day: "Jueves", dayShort: "Jue", dayKey: "jue", weekday: 4, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
          { day: "Viernes", dayShort: "Vie", dayKey: "vie", weekday: 5, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
          { day: "Sábado", dayShort: "Sáb", dayKey: "sab", weekday: 6, active: true, start: "09:00", end: "17:00", breakTime: "14:00 - 15:00", tag: "Jornada intensiva" },
          { day: "Domingo", dayShort: "Dom", dayKey: "dom", weekday: 0, active: false, start: "10:00", end: "15:00", tag: "Descanso semanal" },
        ];

        let finalSchedule = DEFAULT_DAYS;
        if (wh && wh.length > 0) {
          finalSchedule = DEFAULT_DAYS.map((d) => {
            const foundWh = wh.find((w: any) => w.weekday === d.weekday);
            if (foundWh) {
              return {
                ...d,
                active: foundWh.is_available,
                start: foundWh.start_time?.slice(0, 5) || d.start,
                end: foundWh.end_time?.slice(0, 5) || d.end,
                tag: foundWh.is_available ? "Turno activo" : "Descanso semanal",
              };
            }
            return d;
          });
        }

        // Query appointments for this employee
        const { data: appts } = await supabase
          .from("appointments")
          .select("id, status, scheduled_at, duration_minutes, total_price, customer_name, customer_phone")
          .eq("employee_id", id)
          .order("scheduled_at", { ascending: false })
          .limit(10);

        const mappedAppts: RecentAppointment[] = (appts || []).map((a: any) => ({
          id: a.id,
          clientName: a.customer_name || "Cliente presencial",
          serviceName: "Servicio agendado",
          time: new Date(a.scheduled_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }),
          price: Number(a.total_price || 0),
          currency: "MXN",
          status: a.status === "completed" ? "Completada" : a.status === "confirmed" ? "Confirmada" : a.status === "in_progress" ? "En curso" : "Confirmada",
        }));

        if (isMounted) {
          setEmployee({
            id: dbEmp.id,
            business_id: dbEmp.business_id,
            display_name: dbEmp.display_name,
            job_title: dbEmp.profile_id ? "Propietario / Especialista" : "Especialista",
            email: dbEmp.email || "Sin email asignado",
            phone: dbEmp.phone || "Sin teléfono registrado",
            bio: dbEmp.bio || "",
            avatar_url: dbEmp.avatar_url || "",
            internal_id: `EMP-${dbEmp.id.slice(0, 4).toUpperCase()}`,
            access_status: "activa",
            is_active: dbEmp.is_active ?? true,
            rating: 5.0,
            reviews_count: 0,
            services: mappedServices,
            schedule_summary: "Lun - Sáb: 09:00 - 19:00",
            break_summary: "14:00 - 15:00",
            today_appointments: mappedAppts.length,
            satisfaction: 100,
            weekly_hours: 48,
            seat: "Sillón 01",
            booking_slug: (dbEmp.display_name || "empleado").toLowerCase().replace(/\s+/g, "-"),
            google_calendar_synced: false,
            last_sync_mins: 0,
            weekly_schedule: finalSchedule,
            exceptions: [],
            recentAppointments: mappedAppts,
          });
        }
      } catch (err) {
        console.error("Error loading employee data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEmployee();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const personalUrl = `skedly.com/${
    currentBusiness?.slug || "barberia-demo"
  }?prof=${employee?.booking_slug || "colaborador"}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(personalUrl);
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

    setEmployee((prev) =>
      prev
        ? {
            ...prev,
            exceptions: [newExc, ...prev.exceptions],
          }
        : null
    );

    setShowExceptionModal(false);
    setExcTitle("");
    setExcDateRange("");
    setExcReason("");
    setExcBlockedHours("");
    showToast("Excepción registrada en el calendario.");
  };

  const handleDeleteException = (excId: string) => {
    setEmployee((prev) =>
      prev
        ? {
            ...prev,
            exceptions: prev.exceptions.filter((x) => x.id !== excId),
          }
        : null
    );
    showToast("Excepción eliminada.");
  };

  const handleOpenDayEdit = (idx: number) => {
    if (!employee) return;
    const day = employee.weekly_schedule[idx];
    setEditingDayIndex(idx);
    setEditDayStart(day.start);
    setEditDayEnd(day.end);
    setEditDayBreak(day.breakTime || "14:00 - 15:00");
    setEditDayActive(day.active);
  };

  const handleSaveDayEdit = async () => {
    if (editingDayIndex === null || !employee) return;
    const targetDay = employee.weekly_schedule[editingDayIndex];
    const updatedWeekly = employee.weekly_schedule.map((day, idx) =>
      idx === editingDayIndex
        ? {
            ...day,
            start: editDayStart,
            end: editDayEnd,
            breakTime: editDayBreak,
            active: editDayActive,
            tag: editDayActive ? "Turno activo" : "Descanso semanal",
          }
        : day
    );

    setEmployee((prev) => (prev ? { ...prev, weekly_schedule: updatedWeekly } : null));

    // Persist to Supabase if real employee
    if (employee.id && !employee.id.startsWith("emp-") && employee.business_id) {
      try {
        await supabase
          .from("working_hours")
          .delete()
          .eq("employee_id", employee.id)
          .eq("weekday", targetDay.weekday);

        if (editDayActive) {
          await supabase.from("working_hours").insert({
            business_id: employee.business_id,
            employee_id: employee.id,
            weekday: targetDay.weekday,
            start_time: editDayStart.length === 5 ? editDayStart + ":00" : editDayStart,
            end_time: editDayEnd.length === 5 ? editDayEnd + ":00" : editDayEnd,
            is_available: true,
          });
        }
      } catch (err) {
        console.warn("Error updating working_hours:", err);
      }
    }

    setEditingDayIndex(null);
    showToast("Horario actualizado para este día.");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="text-sm font-semibold">Cargando perfil del colaborador...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline">
          person_off
        </span>
        <h2 className="text-base font-bold text-on-surface">Colaborador no encontrado</h2>
        <Link
          href="/dashboard/empleados"
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
        >
          Volver a Equipo de trabajo
        </Link>
      </div>
    );
  }

  // =========================================================================
  // RENDER WIDGETS (REUSABLE IN RESUMEN TAB)
  // =========================================================================
  const renderEnlacePersonalWidget = () => (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined text-[20px]">link</span>
        <span className="text-[11px] uppercase tracking-wider font-bold">
          Enlace personal de reserva
        </span>
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Comparte este vínculo para que los clientes reserven directamente en la agenda de {employee.display_name}.
      </p>

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
      </div>

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
            Listo para compartir o colocar en tarjetas
          </span>
        </div>
      </div>
    </div>
  );

  const renderSeguridadWidget = () => (
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
              {employee.job_title}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
            Acceso asignado para gestión de turnos y agenda personal en {currentBusiness?.name || "el negocio"}.
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface leading-tight">
                Estado operativo
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {employee.is_active ? "Colaborador activo y habilitado" : "Colaborador pausado"}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            Activo
          </span>
        </div>
      </div>
    </div>
  );

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
            SUBHEADER / BREADCRUMB & HEADER
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
                Colaboradores • Ficha del Empleado
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <span className="text-[11px] text-on-surface-variant">
                Gestión individual de perfil y disponibilidad
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
              Datos registrados, asignación de servicios y horarios para {employee.display_name} en {currentBusiness?.name || "tu negocio"}.
            </p>
          </div>

          {/* Action Cluster (Clean without the giant edit button) */}
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
                schedule
              </span>
              <span>Configurar horarios</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            EMPLOYEE PROFILE HERO BENTO BLOCK (WITH PENCIL BUTTON INSIDE)
        ========================================================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-sm border border-surface-container">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-secondary-container/20 to-transparent pointer-events-none blur-3xl"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Identity left column */}
            <div className="flex items-start sm:items-center gap-5 flex-1">
              {/* Avatar with Live Indicator */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-surface-container-high shadow-md">
                  {employee.avatar_url ? (
                    <img
                      src={employee.avatar_url}
                      alt={employee.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold text-2xl shadow-sm">
                      {employee.display_name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm"
                  title="Colaborador activo"
                >
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
              </div>

              {/* Name, Role, Badges & EDIT PENCIL BUTTON */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight truncate">
                    {employee.display_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold">
                    {employee.job_title}
                  </span>

                  {/* COMPACT PENCIL EDIT BUTTON INSIDE CARD */}
                  <Link
                    href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                    className="w-7 h-7 rounded-lg bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface-variant flex items-center justify-center transition-all shadow-xs ml-0.5"
                    title="Editar datos del empleado"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </Link>
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
                    {employee.is_active ? "Activo" : "Inactivo"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                    Cuenta Skedly Verificada
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[14px]">chair</span>
                    {employee.seat}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Numerical Counters from Real Data */}
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
                  Citas
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-primary">{employee.recentAppointments.length}</span>
                  <span className="text-[11px] text-on-surface-variant">en agenda</span>
                </div>
              </div>

              <div className="flex flex-col px-3 py-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                  Calificación
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-on-surface">5.0</span>
                  <span className="material-symbols-outlined text-[15px] text-amber-500 fill-current">
                    star
                  </span>
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
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "resumen"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Resumen</span>
          </button>

          <button
            onClick={() => setActiveTab("servicios")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "servicios"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">content_cut</span>
            <span>Servicios asignados</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${activeTab === "servicios" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface"}`}>
              {employee.services.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("horarios")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "horarios"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Horarios y Disponibilidad</span>
          </button>

          <button
            onClick={() => setActiveTab("excepciones")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "excepciones"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">event_busy</span>
            <span>Excepciones y Vacaciones</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${activeTab === "excepciones" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface"}`}>
              {employee.exceptions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("citas")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "citas"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Historial de Citas</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${activeTab === "citas" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface"}`}>
              {employee.recentAppointments.length}
            </span>
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT 1: RESUMEN (DEFAULT INITIAL ACTIVE VIEW)
        ========================================================================== */}
        {activeTab === "resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: FICHA Y OPERATIVIDAD (8 COLS) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Bio & Datos Personales */}
              <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                    <h2 className="text-base font-bold text-on-surface">Información profesional & Bio</h2>
                  </div>
                  <Link
                    href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Editar detalles</span>
                  </Link>
                </div>

                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {employee.bio ||
                    "Este colaborador no tiene biografía registrada aún. Puedes agregar una descripción de sus especialidades, años de trayectoria y enfoque desde la pantalla de edición."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-surface-container/60">
                    <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Correo oficial</span>
                    <span className="text-xs font-bold text-on-surface truncate">{employee.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-surface-container/60">
                    <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Teléfono / WhatsApp</span>
                    <span className="text-xs font-bold text-on-surface">{employee.phone}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-surface-container/60">
                    <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Estado de agenda</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {employee.is_active ? "Disponible para citas" : "Agenda pausada"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vista previa de servicios vinculados */}
              <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">content_cut</span>
                    <h2 className="text-base font-bold text-on-surface">
                      Servicios asignados ({employee.services.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("servicios")}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Gestionar servicios</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

                {employee.services.length === 0 ? (
                  <div className="p-5 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                    Este colaborador no tiene servicios vinculados todavía.
                    <div className="mt-2">
                      <Link
                        href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                        className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                      >
                        <span>+ Vincular servicios a este colaborador</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {employee.services.slice(0, 4).map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-on-surface">{s.name}</p>
                          <p className="text-[11px] text-on-surface-variant">{s.duration} min</p>
                        </div>
                        <span className="text-xs font-bold text-primary">${s.price} MXN</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vista previa de horario semanal */}
              <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
                    <h2 className="text-base font-bold text-on-surface">Disponibilidad semanal</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("horarios")}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver horario completo</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {employee.weekly_schedule.map((d) => (
                    <div
                      key={d.dayKey}
                      className={`p-2.5 rounded-xl text-center border flex flex-col items-center justify-center gap-1 ${
                        d.active
                          ? "bg-surface-container-low border-surface-container text-on-surface"
                          : "bg-surface-container text-outline opacity-60 border-transparent"
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase">{d.dayShort}</span>
                      <span className="text-[11px] font-mono">{d.active ? `${d.start.slice(0, 5)}` : "Libre"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: WIDGETS (4 COLS) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {renderEnlacePersonalWidget()}
              {renderSeguridadWidget()}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 2: SERVICIOS ASIGNADOS
        ========================================================================== */}
        {activeTab === "servicios" && (
          <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-7 shadow-sm border border-surface-container flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container">
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  Servicios habilitados para {employee.display_name}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Los clientes podrán seleccionar estos servicios al agendar su cita con este colaborador.
                </p>
              </div>
              <Link
                href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all text-xs font-semibold shadow-sm w-fit"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Modificar asignaciones de servicios</span>
              </Link>
            </div>

            {employee.services.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-low rounded-2xl border border-surface-container">
                <span className="material-symbols-outlined text-4xl text-outline">content_cut</span>
                <h3 className="text-sm font-bold text-on-surface">Sin servicios vinculados</h3>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Actualmente este colaborador no tiene ningún servicio asignado. Vincula cortes, barba o tratamientos para que aparezca en el agendador.
                </p>
                <Link
                  href={`/dashboard/empleados/nuevo?id=${employee.id}`}
                  className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
                >
                  Asignar servicios ahora
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-3 hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {srv.category || "General"}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Habilitado
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface mt-2">{srv.name}</h3>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        {srv.duration} minutos
                      </span>
                      <span className="text-sm font-bold text-on-surface">${srv.price} MXN</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 3: HORARIOS Y DISPONIBILIDAD
        ========================================================================== */}
        {activeTab === "horarios" && (
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
                <span>Modificar en editor general</span>
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
        )}

        {/* =========================================================================
            TAB CONTENT 4: EXCEPCIONES Y VACACIONES
        ========================================================================== */}
        {activeTab === "excepciones" && (
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all text-xs font-semibold whitespace-nowrap self-start sm:self-auto shadow-sm"
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
              <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                No hay excepciones o vacaciones programadas para este colaborador.
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 5: HISTORIAL DE CITAS
        ========================================================================== */}
        {activeTab === "citas" && (
          <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-7 shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  Historial y agenda de citas de {employee.display_name}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Citas y turnos registrados en la base de datos para este colaborador.
                </p>
              </div>
              <Link
                href="/dashboard/calendario"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
              >
                <span>Ver calendario general</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {employee.recentAppointments.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-3xl text-outline">event_available</span>
                <p className="text-xs font-semibold text-on-surface">No hay citas registradas en la agenda</p>
                <p className="text-[11px] text-on-surface-variant max-w-sm">
                  Cuando los clientes reserven turnos con {employee.display_name}, aparecerán aquí con su estado, cliente y monto.
                </p>
              </div>
            ) : (
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
            )}
          </div>
        )}
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
