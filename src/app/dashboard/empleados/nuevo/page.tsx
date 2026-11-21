"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  MOCK_EMPLOYEES,
  DEFAULT_WEEKLY_SCHEDULE,
  FullEmployee,
  EmployeeService,
  DaySchedule,
} from "../mock-data";

interface BusinessService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

function EmpleadoFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const { currentBusiness } = useAuth();

  // Mode
  const isEditing = Boolean(idParam);

  // Services from DB
  const [businessServices, setBusinessServices] = useState<BusinessService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Form Fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [accessMode, setAccessMode] = useState<"operativo" | "invitar">("operativo");
  const [useGeneralSchedule, setUseGeneralSchedule] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_WEEKLY_SCHEDULE);

  // Modals & States
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editingBreakDayIndex, setEditingBreakDayIndex] = useState<number | null>(null);
  const [breakStart, setBreakStart] = useState("14:00");
  const [breakEnd, setBreakEnd] = useState("15:00");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // 1. Fetch Real Services of Business from Supabase
  useEffect(() => {
    if (!currentBusiness?.id) return;
    async function loadServices() {
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id, name, price, duration_minutes, service_categories(name)")
          .eq("business_id", currentBusiness.id)
          .order("name", { ascending: true });

        if (!error && data) {
          const mapped: BusinessService[] = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price || 0),
            duration: Number(s.duration_minutes || 30),
            category: s.service_categories?.name || "General",
          }));
          setBusinessServices(mapped);
        }
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, [currentBusiness?.id]);

  // 2. Preload Real Details if editing an existing employee
  useEffect(() => {
    if (!idParam) return;

    if (!idParam.startsWith("emp-")) {
      async function loadDbEmployee() {
        try {
          // Employee basic info
          const { data, error } = await supabase
            .from("employees")
            .select("*")
            .eq("id", idParam)
            .single();

          if (data && !error) {
            setDisplayName(data.display_name || "");
            setEmail(data.email || "");
            setPhone(data.phone || "");
            setJobTitle(data.role || data.job_title || "Especialista");
            setBio(data.bio || "");
            setAvatarUrl(data.avatar_url || "");
          }

          // Real Assigned Services
          const { data: empServices } = await supabase
            .from("employee_services")
            .select("service_id")
            .eq("employee_id", idParam);

          if (empServices && empServices.length > 0) {
            setSelectedServiceIds(empServices.map((es: any) => es.service_id));
          } else {
            setSelectedServiceIds([]);
          }

          // Real Working Hours
          const { data: wh } = await supabase
            .from("working_hours")
            .select("*")
            .eq("employee_id", idParam)
            .order("weekday", { ascending: true });

          if (wh && wh.length > 0) {
            setWeeklySchedule((prev) =>
              prev.map((day) => {
                const found = wh.find((w: any) => w.weekday === day.weekday);
                if (found) {
                  return {
                    ...day,
                    active: Boolean(found.is_available),
                    start: found.start_time?.slice(0, 5) || day.start,
                    end: found.end_time?.slice(0, 5) || day.end,
                  };
                }
                return {
                  ...day,
                  active: false,
                };
              })
            );
          }
        } catch (err) {
          console.error("Error loading employee data:", err);
        }
      }
      loadDbEmployee();
    } else {
      const found = MOCK_EMPLOYEES.find((e) => e.id === idParam);
      if (found) {
        setDisplayName(found.display_name);
        setEmail(found.email);
        setPhone(found.phone);
        setJobTitle(found.job_title);
        setBio(found.bio);
        setAvatarUrl(found.avatar_url);
        setSelectedServiceIds(found.services.map((s) => s.id));
        setAccessMode(found.access_status === "sin-acceso" ? "operativo" : "invitar");
        if (found.weekly_schedule?.length > 0) {
          setWeeklySchedule(found.weekly_schedule);
        }
      }
    }
  }, [idParam]);

  // Handle service toggle
  const toggleService = (srvId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId]
    );
  };

  const handleSelectAllCategory = (categoryName?: string) => {
    if (!categoryName) {
      if (selectedServiceIds.length === businessServices.length) {
        setSelectedServiceIds([]);
        showToast("Todos los servicios deseleccionados.");
      } else {
        setSelectedServiceIds(businessServices.map((s) => s.id));
        showToast("Todos los servicios del negocio seleccionados.");
      }
      return;
    }
    const idsInCat = businessServices
      .filter((s) => s.category.toLowerCase().includes(categoryName.toLowerCase()))
      .map((s) => s.id);
    setSelectedServiceIds((prev) => Array.from(new Set([...prev, ...idsInCat])));
    showToast(`Servicios de ${categoryName} seleccionados.`);
  };

  // Copy Monday schedule to Tuesday-Friday
  const handleCopyMondayToWeekdays = () => {
    const monday = weeklySchedule.find((d) => d.dayKey === "lun");
    if (!monday) return;

    setWeeklySchedule((prev) =>
      prev.map((d) => {
        if (["mar", "mie", "jue", "vie"].includes(d.dayKey)) {
          return {
            ...d,
            active: monday.active,
            start: monday.start,
            end: monday.end,
            breakTime: monday.breakTime,
          };
        }
        return d;
      })
    );
    showToast("Horario de Lunes copiado a Martes-Viernes exitosamente.");
  };

  // Save break edit
  const handleSaveBreak = () => {
    if (editingBreakDayIndex === null) return;
    setWeeklySchedule((prev) =>
      prev.map((item, idx) => {
        if (idx === editingBreakDayIndex) {
          return {
            ...item,
            breakTime: `${breakStart} - ${breakEnd}`,
          };
        }
        return item;
      })
    );
    setEditingBreakDayIndex(null);
    showToast("Pausa de descanso actualizada.");
  };

  const handleRemoveBreak = (idx: number) => {
    setWeeklySchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, breakTime: undefined } : item))
    );
    showToast("Pausa eliminada para este día.");
  };

  // Metrics calculation
  const totalWeeklyHours = useMemo(() => {
    let hours = 0;
    weeklySchedule.forEach((d) => {
      if (!d.active) return;
      const [sh, sm] = d.start.split(":").map(Number);
      const [eh, em] = d.end.split(":").map(Number);
      let dayHours = eh + em / 60 - (sh + sm / 60);
      if (d.breakTime) {
        dayHours -= 1.0; // 1 hr break
      }
      if (dayHours > 0) hours += dayHours;
    });
    return Math.round(hours * 10) / 10;
  }, [weeklySchedule]);

  const activeDaysCount = useMemo(() => weeklySchedule.filter((d) => d.active).length, [weeklySchedule]);
  const estimatedCapacity = useMemo(() => Math.round(totalWeeklyHours * 1.2), [totalWeeklyHours]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast("Por favor ingresa el nombre del colaborador.");
      return;
    }

    setSaving(true);
    try {
      if (currentBusiness?.id) {
        let employeeId = idParam;
        if (isEditing && idParam && !idParam.startsWith("emp-")) {
          // Update Supabase
          const { error: updErr } = await supabase
            .from("employees")
            .update({
              display_name: displayName.trim(),
              email: email.trim() || null,
              phone: phone.trim() || null,
              bio: bio.trim() || null,
              avatar_url: avatarUrl || null,
            })
            .eq("id", idParam);
          if (updErr) throw updErr;
        } else {
          // Insert Supabase
          const { data: newEmp, error: insErr } = await supabase
            .from("employees")
            .insert({
              business_id: currentBusiness.id,
              display_name: displayName.trim(),
              email: email.trim() || null,
              phone: phone.trim() || null,
              bio: bio.trim() || null,
              avatar_url: avatarUrl || null,
              is_active: true,
            })
            .select()
            .single();
          if (insErr) throw insErr;
          if (newEmp) employeeId = newEmp.id;
        }

        if (employeeId && !employeeId.startsWith("emp-")) {
          // 1. Sync employee_services in Supabase
          await supabase.from("employee_services").delete().eq("employee_id", employeeId);
          if (selectedServiceIds.length > 0) {
            const serviceInserts = selectedServiceIds.map((sid) => ({
              business_id: currentBusiness.id,
              employee_id: employeeId,
              service_id: sid,
            }));
            const { error: srvErr } = await supabase.from("employee_services").insert(serviceInserts);
            if (srvErr) console.warn("Error inserting employee_services:", srvErr);
          }

          // 2. Sync working_hours in Supabase
          await supabase.from("working_hours").delete().eq("employee_id", employeeId);
          const scheduleInserts = weeklySchedule.map((d) => ({
            business_id: currentBusiness.id,
            employee_id: employeeId,
            weekday: d.weekday,
            start_time: d.start.length === 5 ? d.start + ":00" : d.start,
            end_time: d.end.length === 5 ? d.end + ":00" : d.end,
            is_available: d.active,
          }));
          const { error: whErr } = await supabase.from("working_hours").insert(scheduleInserts);
          if (whErr) console.warn("Error inserting working_hours:", whErr);
        }
      }

      showToast(isEditing ? "Cambios guardados con éxito." : "Colaborador registrado exitosamente.");
      setTimeout(() => {
        router.push("/dashboard/empleados");
      }, 900);
    } catch (err) {
      console.error("Error saving employee:", err);
      showToast("Error al guardar los datos.");
    } finally {
      setSaving(false);
    }
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

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* =========================================================================
            TOP CONTEXT & NAVIGATION HEADER
        ========================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs">
              <Link
                href="/dashboard/empleados"
                className="flex items-center gap-1 text-primary font-medium hover:underline transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Volver a Equipo de trabajo</span>
              </Link>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                Modo Edición y Alta • {currentBusiness?.name || "Barbería Élite Central"}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
              {isEditing ? `Editar empleado: ${displayName}` : "Nuevo colaborador / profesional"}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
              Registra o edita los datos del profesional, asigna los servicios que puede atender y configura su disponibilidad horaria.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {isEditing ? "Perfil en producción" : "Nuevo registro"}
            </span>
          </div>
        </div>

        {/* =========================================================================
            LAYOUT GRID: FORM (8 cols ~ 66%) AND LIVE PREVIEW / SUMMARY (4 cols ~ 33%)
        ========================================================================== */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: The Form ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* SECTION 1: Información Personal */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-1 border-b border-surface-container">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Información personal</h2>
                  <p className="text-xs text-on-surface-variant">Datos básicos y presentación del profesional en tu negocio</p>
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "Colaborador"}
                      className="w-20 h-20 rounded-2xl object-cover shadow-sm bg-surface-container-high"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex flex-col items-center justify-center text-on-surface-variant shadow-sm border border-surface-container">
                      <span className="material-symbols-outlined text-[32px] text-primary">add_a_photo</span>
                    </div>
                  )}
                  {avatarUrl ? (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newUrl = prompt("Ingresa la URL de la foto para el colaborador:", avatarUrl);
                        if (newUrl !== null) setAvatarUrl(newUrl.trim());
                      }}
                      className="px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs transition-all shadow-sm flex items-center gap-1.5 font-semibold border border-surface-container cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                      <span>{avatarUrl ? "Cambiar foto" : "Subir / Asignar foto"}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="px-3 py-2 rounded-xl text-error hover:bg-error-container/30 transition-all text-xs font-semibold cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface-variant leading-tight">
                    JPG, PNG o URL web. Si se deja vacía, se mostrará el icono por defecto.
                  </span>
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs text-on-surface font-semibold flex items-center gap-1">
                    Nombre completo <span className="text-error font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Carlos Ramírez Morales"
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface text-xs shadow-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-on-surface font-semibold">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface text-xs shadow-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <span className="text-[11px] text-on-surface-variant leading-tight">
                    Necesario si decides invitarlo a Skedly o para notificaciones.
                  </span>
                </div>

                {/* Teléfono Móvil */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-on-surface font-semibold">
                    Teléfono móvil
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface text-xs shadow-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <span className="text-[11px] text-on-surface-variant leading-tight">
                    Para recordatorios internos y contacto de emergencia.
                  </span>
                </div>

                {/* Cargo o Especialidad */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs text-on-surface font-semibold">
                    Cargo o especialidad comercial
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ej. Barbero Master • Especialista en Fades y Degradados"
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface text-xs shadow-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Breve Biografía Pública */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-on-surface font-semibold">
                      Breve biografía pública
                    </label>
                    <span className="text-[11px] text-primary font-medium">Visible en web pública</span>
                  </div>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe la trayectoria, técnicas o estilo del profesional..."
                    className="w-full p-3.5 rounded-xl bg-surface-container-lowest text-on-surface text-xs shadow-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Servicios que puede realizar */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">content_cut</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface">Servicios que puede realizar</h2>
                    <p className="text-xs text-on-surface-variant">Solo aparecerá disponible para los servicios habilitados</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {selectedServiceIds.length} de {businessServices.length} asignados
                  </span>
                  {businessServices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllCategory()}
                      className="text-primary hover:underline text-xs font-semibold"
                    >
                      {selectedServiceIds.length === businessServices.length
                        ? "Deseleccionar todos"
                        : "Seleccionar todos"}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Selecciona los servicios del catálogo que este empleado está capacitado para brindar. Solo aparecerá en la página de reservas para estos servicios.
              </p>

              {/* Services Checkboxes Grid */}
              {loadingServices ? (
                <div className="p-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg animate-spin text-primary">
                    progress_activity
                  </span>
                  <span>Cargando servicios del negocio...</span>
                </div>
              ) : businessServices.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                  No hay servicios registrados en este negocio aún.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {businessServices.map((srv) => {
                    const isChecked = selectedServiceIds.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                          isChecked
                            ? "bg-primary-fixed/20 border-primary/30 shadow-sm"
                            : "bg-surface-container-low border-transparent hover:bg-surface-container"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(srv.id)}
                          className="mt-0.5 w-4 h-4 rounded text-primary accent-primary"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-on-surface truncate">
                              {srv.name}
                            </span>
                            <span className="text-xs font-bold text-primary font-mono shrink-0">
                              ${srv.price} MXN
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              <span>{srv.duration} min</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-medium">
                              {srv.category}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: Horario de trabajo semanal */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">more_time</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface">Horario de trabajo semanal</h2>
                    <p className="text-xs text-on-surface-variant">Turnos, descansos y disponibilidad para agendamiento</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMondayToWeekdays}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all border border-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">content_copy</span>
                  <span>Copiar Lunes a Martes-Viernes</span>
                </button>
              </div>

              {/* General Schedule Inheritance Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-on-surface">
                    Usar horario general del negocio
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Heredar automáticamente: Lunes a Sábado de 09:00 a 20:00
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGeneralSchedule}
                    onChange={(e) => setUseGeneralSchedule(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Weekly Schedule Days List */}
              <div className="flex flex-col gap-2.5">
                {weeklySchedule.map((day, idx) => {
                  return (
                    <div
                      key={day.dayKey}
                      className={`p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border transition-all ${
                        day.active
                          ? "bg-surface-container-lowest border-surface-container shadow-sm"
                          : "bg-surface-container-low/70 border-transparent opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={day.active}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setWeeklySchedule((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, active: checked } : d))
                            );
                          }}
                          className="w-5 h-5 rounded text-primary accent-primary cursor-pointer"
                        />
                        <div className="w-24">
                          <span
                            className={`text-xs font-bold ${
                              day.active ? "text-on-surface" : "text-outline line-through"
                            }`}
                          >
                            {day.day}
                          </span>
                        </div>
                      </div>

                      {day.active ? (
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-on-surface">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low font-mono">
                            <input
                              type="time"
                              value={day.start}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWeeklySchedule((prev) =>
                                  prev.map((d, i) => (i === idx ? { ...d, start: val } : d))
                                );
                              }}
                              className="bg-transparent font-bold focus:outline-none cursor-pointer"
                            />
                            <span className="text-on-surface-variant font-sans">a</span>
                            <input
                              type="time"
                              value={day.end}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWeeklySchedule((prev) =>
                                  prev.map((d, i) => (i === idx ? { ...d, end: val } : d))
                                );
                              }}
                              className="bg-transparent font-bold focus:outline-none cursor-pointer"
                            />
                          </div>

                          {day.breakTime ? (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary-container/50 text-on-secondary-container text-xs">
                              <span className="material-symbols-outlined text-[15px]">coffee</span>
                              <span>Pausa: {day.breakTime}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant italic px-1">
                              Sin pausa intermedia
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container text-outline text-xs">
                          <span className="material-symbols-outlined text-[15px]">block</span>
                          <span>Día de descanso (No disponible)</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 self-end md:self-auto">
                        {day.active && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBreakDayIndex(idx);
                              if (day.breakTime) {
                                const parts = day.breakTime.split("-").map((p) => p.trim());
                                if (parts.length === 2) {
                                  setBreakStart(parts[0]);
                                  setBreakEnd(parts[1]);
                                }
                              } else {
                                setBreakStart("14:00");
                                setBreakEnd("15:00");
                              }
                            }}
                            className="text-primary hover:text-primary-container text-xs font-semibold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {day.breakTime ? "tune" : "add_circle"}
                            </span>
                            <span>{day.breakTime ? "Editar pausa" : "Agregar pausa"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: Acceso a Skedly (Gestión de cuenta) */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-1 border-b border-surface-container">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Acceso a Skedly</h2>
                  <p className="text-xs text-on-surface-variant">Gestión de inicio de sesión y privilegios dentro del sistema</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Puedes crear el perfil del empleado ahora y darle acceso a Skedly cuando lo necesites.{" "}
                  <strong className="text-on-surface">No es obligatorio</strong> que tenga cuenta para que el negocio o los clientes le agenden citas.
                </p>
              </div>

              {/* Radio Options */}
              <div className="flex flex-col gap-3">
                {/* Option 1: Operativo */}
                <label
                  onClick={() => setAccessMode("operativo")}
                  className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                    accessMode === "operativo"
                      ? "bg-primary-fixed/20 border-primary/30 shadow-sm"
                      : "bg-surface-container-lowest border-surface-container hover:bg-surface-container-low"
                  }`}
                >
                  <input
                    type="radio"
                    name="skedly-access"
                    checked={accessMode === "operativo"}
                    onChange={() => setAccessMode("operativo")}
                    className="mt-1 w-4 h-4 text-primary accent-primary"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-on-surface">
                      Registrar solo como perfil operativo (Sin acceso a Skedly)
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Administrado exclusivamente por el propietario o recepcionista. No podrá iniciar sesión ni visualizar la app.
                    </span>
                  </div>
                </label>

                {/* Option 2: Invitar */}
                <label
                  onClick={() => setAccessMode("invitar")}
                  className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                    accessMode === "invitar"
                      ? "bg-primary-fixed/20 border-primary/30 shadow-sm"
                      : "bg-surface-container-lowest border-surface-container hover:bg-surface-container-low"
                  }`}
                >
                  <input
                    type="radio"
                    name="skedly-access"
                    checked={accessMode === "invitar"}
                    onChange={() => setAccessMode("invitar")}
                    className="mt-1 w-4 h-4 text-primary accent-primary"
                  />
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-on-surface">
                        Invitar al empleado por correo electrónico
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {isEditing ? "Cuenta activa" : "Invitación lista"}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      Se enviará un enlace seguro a <strong className="text-on-surface">{email || "su correo"}</strong> para activar su usuario y ver su calendario individual de citas.
                    </span>
                    {isEditing && (
                      <div className="mt-2 pt-2 border-t border-surface-container/60 flex items-center justify-between text-on-surface-variant text-[11px]">
                        <span>Último acceso a la plataforma: Hoy a las 09:15</span>
                        <button
                          type="button"
                          onClick={() => showToast(`Enlace de restablecimiento enviado a ${email}`)}
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">send</span>
                          <span>Reenviar credenciales</span>
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* SECTION 5: Actions Bar */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(true)}
                  className="w-full sm:w-auto px-4 h-11 rounded-xl bg-error-container text-error hover:bg-error hover:text-on-error transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">person_off</span>
                  <span>Desactivar empleado temporalmente</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link
                  href="/dashboard/empleados"
                  className="w-full sm:w-auto px-5 h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all flex items-center justify-center"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Live Preview & Summary ================= */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
            {/* Card: Resumen de Disponibilidad & Capacidad */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
                  <span>Resumen de disponibilidad</span>
                </h3>
                <span className="text-[11px] text-on-surface-variant">Semanal</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                    Horas laborales
                  </span>
                  <span className="text-2xl font-bold text-on-surface mt-1">
                    {totalWeeklyHours}h
                  </span>
                  <span className="text-[11px] text-primary font-medium mt-0.5">
                    {activeDaysCount} {activeDaysCount === 1 ? "día activo" : "días activos"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                    Capacidad estimada
                  </span>
                  <span className="text-2xl font-bold text-on-surface mt-1">
                    ~{estimatedCapacity}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                    citas semanales
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Permisos del rol Empleado */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-5 flex flex-col gap-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">security</span>
                <h3 className="text-xs font-bold text-on-surface">
                  Permisos del rol: Empleado
                </h3>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {/* Lo que sí puede hacer */}
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-primary font-bold block">
                    Lo que sí puede hacer
                  </span>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>Ver su agenda individual y próximas citas.</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>Marcar citas como completadas o registrar no-show.</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>Bloquear horarios de descanso puntual o imprevisto.</span>
                  </div>
                </div>

                {/* Lo que NO puede hacer */}
                <div className="space-y-1.5 pt-2 border-t border-surface-container">
                  <span className="text-[11px] uppercase tracking-wider text-error font-bold block">
                    Restringido para este rol
                  </span>
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[15px] text-error shrink-0 mt-0.5">
                      cancel
                    </span>
                    <span>No tiene acceso a la facturación global ni ingresos de otros.</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[15px] text-error shrink-0 mt-0.5">
                      cancel
                    </span>
                    <span>No puede modificar precios, catálogo de servicios ni configuración.</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[15px] text-error shrink-0 mt-0.5">
                      cancel
                    </span>
                    <span>No puede eliminar ni editar los perfiles de otros compañeros.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* =========================================================================
          MODAL: DEACTIVATION CONFIRMATION
      ========================================================================== */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">person_off</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-on-surface">
                ¿Desactivar a {displayName || "este empleado"}?
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                No se recibirán nuevas citas para este colaborador en la página pública ni en el panel.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                verified_user
              </span>
              <span>
                Sus citas históricas, reportes financieros y reseñas de clientes{" "}
                <strong>se conservarán intactas</strong>. Podrás reactivarlo en cualquier momento.
              </span>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateModal(false);
                  showToast(`${displayName} ha sido desactivado.`);
                  setTimeout(() => router.push("/dashboard/empleados"), 800);
                }}
                className="px-4 h-10 rounded-xl bg-error hover:bg-on-error-container text-on-error text-xs font-semibold shadow-sm transition-all"
              >
                Confirmar desactivación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR PAUSA DE DESCANSO
      ========================================================================== */}
      {editingBreakDayIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">coffee</span>
                <h4 className="text-xs font-bold text-on-surface">
                  Pausa de descanso: {weeklySchedule[editingBreakDayIndex].day}
                </h4>
              </div>
              <button
                onClick={() => setEditingBreakDayIndex(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-on-surface font-semibold block mb-1">
                    Inicio de pausa
                  </label>
                  <input
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-mono font-bold border border-surface-container focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-on-surface font-semibold block mb-1">
                    Fin de pausa
                  </label>
                  <input
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-mono font-bold border border-surface-container focus:outline-none"
                  />
                </div>
              </div>

              {weeklySchedule[editingBreakDayIndex].breakTime && (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveBreak(editingBreakDayIndex);
                    setEditingBreakDayIndex(null);
                  }}
                  className="text-error hover:underline text-xs text-left font-medium"
                >
                  Quitar pausa para este día
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setEditingBreakDayIndex(null)}
                className="px-3.5 h-9 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBreak}
                className="px-4 h-9 rounded-xl bg-primary text-on-primary text-xs font-semibold"
              >
                Guardar pausa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmpleadoFormPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-on-surface-variant">
          Cargando formulario de empleado...
        </div>
      }
    >
      <EmpleadoFormContent />
    </Suspense>
  );
}

