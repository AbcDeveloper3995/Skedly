"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category?: string;
}

interface EmployeeOption {
  id: string;
  display_name: string;
  role: string;
  chair: string;
  photo_url: string;
}

const DEFAULT_EMPLOYEES: EmployeeOption[] = [
  {
    id: "emp-mateo",
    display_name: "Mateo Ramos",
    role: "Barbero",
    chair: "Sillón #1 (Central)",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "emp-carlos",
    display_name: "Carlos Ramírez",
    role: "Barbero Master",
    chair: "Sillón #2 (Master)",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "emp-sofia",
    display_name: "Sofía Gómez",
    role: "Estilista Senior",
    chair: "Sillón #3 (Color)",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
];

const DEFAULT_SERVICES: ServiceOption[] = [
  { id: "srv-fade", name: "Corte Degradado Moderno", price: 180, duration_minutes: 45 },
  { id: "srv-beard", name: "Arreglo de Barba Tradicional", price: 120, duration_minutes: 30 },
  { id: "srv-combo", name: "Combo VIP Corte + Barba + Toalla", price: 260, duration_minutes: 60 },
  { id: "srv-classic", name: "Corte Clásico a Tijera", price: 150, duration_minutes: 40 },
];

const TIME_SLOTS = [
  { time: "09:00", status: "blocked", label: "Ocupado" },
  { time: "09:30", status: "available", label: "Libre" },
  { time: "10:15", status: "available", label: "Libre" },
  { time: "11:00", status: "blocked", label: "Cita" },
  { time: "11:45", status: "available", label: "Libre" },
  { time: "16:00", status: "available", label: "Libre" },
  { time: "17:30", status: "available", label: "Libre" },
];

function NewCitaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, currentBusiness } = useAuth();

  // Mode: "create" | "reschedule"
  const initialMode = searchParams.get("mode") === "reschedule" ? "reschedule" : "create";
  const [mode, setMode] = useState<"create" | "reschedule">(initialMode);
  const rescheduleAppId = searchParams.get("id") || "#SK-8941";

  // Client Selection
  const [clientTab, setClientTab] = useState<"existing" | "new">("existing");
  const [clientSearchQuery, setClientSearchQuery] = useState("David Soria (+34 655 432 109)");
  const [selectedClient, setSelectedClient] = useState({
    id: "cli-soria",
    name: "David Soria",
    phone: "+34 655 432 109",
    email: "david.soria@example.com",
    avatarText: "DS",
    tag: "Cliente Frecuente",
    visits: 3,
  });

  // New Client Fields
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Services
  const [services, setServices] = useState<ServiceOption[]>(DEFAULT_SERVICES);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("srv-fade");

  // Staff
  const [employees, setEmployees] = useState<EmployeeOption[]>(DEFAULT_EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("emp-carlos");

  // Date & Time
  const [selectedDate, setSelectedDate] = useState("2025-10-26");
  const [selectedTime, setSelectedTime] = useState("10:15");

  // Notes
  const [internalNotes, setInternalNotes] = useState("");

  // Reschedule original details
  const [originalSlot] = useState({
    dateStr: "Mié 25 Octubre • 11:30 hrs",
    staff: "Mateo Ramos • Sillón #1",
    code: rescheduleAppId,
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Load live DB services and employees if available
  useEffect(() => {
    if (!currentBusiness?.id) return;

    // Load services
    supabase
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("business_id", currentBusiness.id)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setServices(data);
          setSelectedServiceId(data[0].id);
        }
      });

    // Load employees
    supabase
      .from("employees")
      .select("id, display_name")
      .eq("business_id", currentBusiness.id)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: EmployeeOption[] = data.map((emp, i) => ({
            id: emp.id,
            display_name: emp.display_name,
            role: i === 0 ? "Barbero Master" : "Estilista",
            chair: `Sillón #${i + 1}`,
            photo_url:
              i === 0
                ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          }));
          setEmployees(mapped);
          setSelectedEmployeeId(mapped[0].id);
        }
      });
  }, [currentBusiness]);

  // Active selected service and staff objects
  const activeService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);

  const activeEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  }, [employees, selectedEmployeeId]);

  // Compute calculated end time based on selected duration
  const endTimeStr = useMemo(() => {
    const [hours, minutes] = selectedTime.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "11:00";
    const duration = activeService ? activeService.duration_minutes : 45;
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
  }, [selectedTime, activeService]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const clientName = clientTab === "existing" ? selectedClient.name : newClientName.trim() || "Cliente Mostrador";
      const clientPhone = clientTab === "existing" ? selectedClient.phone : newClientPhone.trim() || null;
      const clientEmail = clientTab === "existing" ? selectedClient.email : newClientEmail.trim() || null;

      // Calculate start and end ISO timestamps
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${endTimeStr}:00`);

      if (currentBusiness?.id) {
        // If rescheduling an existing UUID appointment, update it
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rescheduleAppId);

        if (mode === "reschedule" && isUUID) {
          await supabase
            .from("appointments")
            .update({
              start_at: startDateTime.toISOString(),
              end_at: endDateTime.toISOString(),
              employee_id: activeEmployee.id.startsWith("emp-") ? null : activeEmployee.id,
              internal_notes: internalNotes || null,
              status: "confirmed",
            })
            .eq("id", rescheduleAppId);
        } else {
          // Create new appointment
          const { data: newApp, error: appErr } = await supabase
            .from("appointments")
            .insert({
              business_id: currentBusiness.id,
              start_at: startDateTime.toISOString(),
              end_at: endDateTime.toISOString(),
              status: "confirmed",
              customer_name_snapshot: clientName,
              customer_phone_snapshot: clientPhone,
              customer_email_snapshot: clientEmail,
              employee_id: activeEmployee.id.startsWith("emp-") ? null : activeEmployee.id,
              internal_notes: internalNotes || null,
            })
            .select()
            .single();

          if (newApp && activeService) {
            await supabase.from("appointment_services").insert({
              appointment_id: newApp.id,
              service_id: activeService.id.startsWith("srv-") ? null : activeService.id,
              service_name: activeService.name,
              unit_price: activeService.price,
              duration_minutes: activeService.duration_minutes,
            });
          }
        }
      }

      setSubmissionSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/calendario");
      }, 1200);
    } catch (err) {
      console.error("Error creating/rescheduling appointment:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start py-6 px-4 sm:px-6 relative">
      {/* Background Layer (Mock Calendar Canvas Context) */}
      <div className="absolute inset-0 filter blur-[4px] opacity-25 pointer-events-none select-none px-6 py-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-on-surface">Octubre 2025</span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs">
              Semana 43
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="px-3 py-1 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-medium">Hoy</div>
            <div className="px-3 py-1 rounded-lg bg-primary-container text-on-primary-container text-xs font-medium">
              Semana
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {["Lun 23", "Mar 24", "Mié 25", "Jue 26 (Activo)", "Vie 27"].map((col, idx) => (
            <div key={idx} className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-2 h-96">
              <span className="text-sm font-semibold text-on-surface">{col}</span>
              <div className="p-2 rounded-lg bg-primary-fixed text-on-primary-fixed text-xs">09:00 - Corte Clásico</div>
              <div className="p-2 rounded-lg bg-surface-container text-on-surface-variant text-xs">11:30 - Barba Express</div>
              <div className="p-2 rounded-lg bg-primary-fixed text-on-primary-fixed text-xs">15:00 - Perfilado</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Modal Card */}
      <div className="relative z-10 w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col my-auto border border-outline-variant/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 sm:px-8 pt-6 pb-4 bg-surface-container-low flex items-start justify-between border-b border-surface-container-high/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[26px]">edit_calendar</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {mode === "reschedule" ? `Reprogramar Cita ${rescheduleAppId}` : "Nueva Cita Manual"}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold uppercase tracking-wider">
                  Mostrador & Call
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {mode === "reschedule"
                  ? "Selecciona un nuevo horario disponible sin solapamientos para reasignar el turno."
                  : "Agenda un turno directamente en el mostrador o por llamada telefónica."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle Switch */}
            <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setMode("create")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "create"
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Nueva Cita
              </button>
              <button
                type="button"
                onClick={() => setMode("reschedule")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  mode === "reschedule"
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">sync_alt</span>
                <span>Reprogramar</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Cerrar modal"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Reprogramming Alert Banner (Visible when in Reschedule Mode) */}
        {mode === "reschedule" && (
          <div className="px-6 sm:px-8 py-3 bg-tertiary-fixed text-on-tertiary-fixed flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-tertiary-fixed-dim/40 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              <span className="material-symbols-outlined text-tertiary text-[20px]">schedule</span>
              <span>
                <strong>Modo Reprogramación Activo:</strong> Estás reasignando la cita {rescheduleAppId} asignada originalmente para el{" "}
                <span className="underline font-semibold">{originalSlot.dateStr}</span>.
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-tertiary text-[11px] font-bold shadow-sm self-start sm:self-auto">
              Sin Penalización
            </span>
          </div>
        )}

        {/* Main Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-6 max-h-[calc(88vh-140px)] overflow-y-auto">
          {/* SECTION 1: Cliente Selection / Creation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person_search</span>
                <span>1. Cliente</span>
              </label>
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Obligatorio</span>
            </div>

            {/* Customer Tabs */}
            <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setClientTab("existing")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  clientTab === "existing"
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[17px] text-primary">contacts</span>
                <span>Buscar cliente existente</span>
              </button>
              <button
                type="button"
                onClick={() => setClientTab("new")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  clientTab === "new"
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">person_add</span>
                <span>+ Registrar nuevo cliente</span>
              </button>
            </div>

            {/* Existing Client Search View */}
            {clientTab === "existing" ? (
              <div className="flex flex-col gap-2.5">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-primary text-[20px]">search</span>
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full h-11 pl-11 pr-10 rounded-xl bg-surface-container-low text-on-surface text-sm placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm border border-transparent focus:border-primary/30 transition-all"
                  />
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setClientSearchQuery("")}
                      className="absolute right-3 text-on-surface-variant hover:text-error transition-colors"
                      title="Limpiar búsqueda"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </button>
                  )}
                </div>

                {/* Selected Client Card Pill */}
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between shadow-sm border border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-sm font-bold text-on-secondary-fixed">
                      {selectedClient.avatarText}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">{selectedClient.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-medium">
                          {selectedClient.tag}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {selectedClient.phone} • {selectedClient.email} • {selectedClient.visits} visitas anteriores
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      <span>Ver historial</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* New Client Form Grid */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-on-surface-variant">Nombre completo *</span>
                  <input
                    type="text"
                    required={clientTab === "new"}
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej. Alejandro Pérez"
                    className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs focus:outline-none shadow-sm border border-outline-variant/30 focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-on-surface-variant">Teléfono / WhatsApp *</span>
                  <input
                    type="tel"
                    required={clientTab === "new"}
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs focus:outline-none shadow-sm border border-outline-variant/30 focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-on-surface-variant">Correo electrónico</span>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs focus:outline-none shadow-sm border border-outline-variant/30 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Servicio y Profesional Reactivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Selection */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">content_cut</span>
                  <span>2. Servicio</span>
                </label>
                <span className="text-xs text-secondary font-medium">
                  Duración base: {activeService?.duration_minutes || 45} min
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full h-11 px-4 pr-10 rounded-xl bg-surface-container-low text-on-surface text-sm font-semibold appearance-none focus:outline-none shadow-sm border border-outline-variant/30 focus:border-primary cursor-pointer"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.duration_minutes} min - ${srv.price} MXN ref)
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] px-1">
                <span className="material-symbols-outlined text-[14px] text-tertiary">info</span>
                <span>Incluye tiempo técnico de desinfección preventiva (+10 min).</span>
              </div>
            </div>

            {/* Reactive Staff Filtering */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <span>Profesional Habilitado</span>
                </label>
                <span className="text-xs text-on-surface-variant">{employees.length} disponibles para este servicio</span>
              </div>

              {/* Professional Selection Cards List */}
              <div className="grid grid-cols-2 gap-2">
                {employees.slice(0, 2).map((emp) => {
                  const isSelected = selectedEmployeeId === emp.id;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-primary-fixed text-on-primary-fixed border-primary/40 shadow-sm"
                          : "bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={emp.photo_url}
                          alt={emp.display_name}
                          className="w-9 h-9 rounded-full object-cover shadow-sm shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                            {emp.display_name}
                          </span>
                          <span
                            className={`text-[10px] truncate ${
                              isSelected ? "text-on-primary-fixed-variant" : "text-on-surface-variant"
                            }`}
                          >
                            {emp.chair}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0">check_circle</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: Fecha y Motor Anticolisión de Horarios */}
          <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[22px]">calendar_today</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">3. Fecha & Franjas Horarias Disponibles</span>
                  <span className="text-xs text-on-surface-variant">Motor anticolisión en tiempo real</span>
                </div>
              </div>

              {/* Date Picker Inline Indicator */}
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3.5 py-1.5 rounded-xl shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Collision Rule Engine Status Banner */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs shadow-sm border border-outline-variant/20">
              <span className="material-symbols-outlined text-tertiary text-[20px]">verified</span>
              <div className="flex-1 flex flex-wrap items-center justify-between gap-1">
                <span>
                  <strong>Regla de agenda:</strong> {activeService?.duration_minutes || 45} min de corte + 10 min de
                  desinfección preventiva. <em>Sin solapamiento detectado.</em>
                </span>
                <span className="text-[11px] text-tertiary font-bold tracking-wide uppercase">Capacidad: 100% libre</span>
              </div>
            </div>

            {/* Time Slots Chip Matrix */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
                <span>Selecciona un intervalo disponible:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Seleccionado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-container-lowest border border-outline-variant"></span>{" "}
                    Disponible
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span> Ocupado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  if (slot.status === "blocked") {
                    return (
                      <div
                        key={slot.time}
                        className="p-2.5 rounded-xl bg-surface-container-highest/60 opacity-60 text-on-surface-variant flex flex-col items-center justify-center cursor-not-allowed border border-outline-variant/20"
                        title="Ocupado: Turno asignado en este bloque"
                      >
                        <span className="text-xs font-medium line-through">{slot.time}</span>
                        <span className="text-[10px] text-error font-medium">{slot.label}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary text-on-primary shadow-md scale-105"
                          : "bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm hover:scale-105 border border-outline-variant/30"
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? "text-on-primary" : "text-on-surface"}`}>
                        {slot.time}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-on-primary/90 font-semibold" : "text-tertiary font-medium"
                        }`}
                      >
                        {isSelected ? "Elegido" : "Libre"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Time Summary Pill */}
              <div className="mt-2 flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-2 text-on-surface text-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">timelapse</span>
                  <span>
                    Franja seleccionada:{" "}
                    <strong>
                      {selectedTime} - {endTimeStr}
                    </strong>{" "}
                    ({activeService?.duration_minutes || 45} min duración de servicio)
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">Finalización prevista: {endTimeStr} hrs</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Internal Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">notes</span>
              <span>4. Notas Internas para el Equipo (Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ej. El cliente prefiere corte a tijera en los laterales y solicita confirmación vía WhatsApp."
              className="w-full p-3.5 rounded-xl bg-surface-container-low text-on-surface text-xs placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm border border-outline-variant/30 focus:border-primary transition-all"
            />
          </div>

          {/* REPROGRAMMING COMPARISON MODULE (Visible in Reschedule Mode) */}
          {mode === "reschedule" && (
            <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-secondary-container text-on-secondary-container shadow-sm border border-outline-variant/30 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
                  <span>Comparativa de Reprogramación</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface text-[10px] font-semibold">
                  Validado: Sin colisiones
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Previous Slot */}
                <div className="p-3 rounded-xl bg-surface-container-lowest text-on-surface flex flex-col gap-1 opacity-80 border border-outline-variant/20">
                  <span className="text-[10px] uppercase tracking-wider text-error font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event_busy</span> Turno actual (A liberar)
                  </span>
                  <span className="text-xs sm:text-sm font-semibold">{originalSlot.dateStr}</span>
                  <span className="text-xs text-on-surface-variant">Profesional: {originalSlot.staff}</span>
                </div>
                {/* New Proposed Slot */}
                <div className="p-3 rounded-xl bg-primary text-on-primary flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] uppercase tracking-wider text-primary-fixed font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Nuevo turno propuesto
                  </span>
                  <span className="text-xs sm:text-sm font-bold">
                    {selectedDate} • {selectedTime} hrs
                  </span>
                  <span className="text-xs text-on-primary/90">
                    Profesional: {activeEmployee.display_name} • {activeEmployee.chair}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Summary Card with Pricing */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <span>Resumen de la Reserva</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">
                En Mostrador
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Cliente</span>
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  {clientTab === "existing" ? selectedClient.name : newClientName || "Nuevo Cliente"}
                </span>
                <span className="text-[11px] text-secondary">
                  {clientTab === "existing" ? selectedClient.phone : newClientPhone || "Sin teléfono"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Horario & Fecha
                </span>
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  {selectedDate} • {selectedTime}
                </span>
                <span className="text-[11px] text-secondary">
                  Duración: {activeService?.duration_minutes || 45} min
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Profesional
                </span>
                <span className="text-xs sm:text-sm font-bold text-on-surface">{activeEmployee.display_name}</span>
                <span className="text-[11px] text-secondary">{activeEmployee.chair}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Precio Referencial
                </span>
                <span className="text-lg font-bold text-primary leading-tight">
                  ${activeService ? activeService.price : 180} MXN
                </span>
                <span className="text-[10px] text-secondary">Cobro al finalizar</span>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-outline-variant/30">
            <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
              <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
              <span>Se enviará recordatorio automático por SMS & WhatsApp al cliente.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-5 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || submissionSuccess}
                className="flex-1 sm:flex-none px-6 h-11 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Procesando turno...</span>
                  </>
                ) : submissionSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>¡Turno Agendado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      {mode === "reschedule" ? "sync_alt" : "calendar_add_on"}
                    </span>
                    <span>{mode === "reschedule" ? "Confirmar y Guardar Reprogramación" : "Crear y agendar cita"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCitaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[500px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            <span>Cargando formulario de agenda...</span>
          </div>
        </div>
      }
    >
      <NewCitaContent />
    </Suspense>
  );
}
