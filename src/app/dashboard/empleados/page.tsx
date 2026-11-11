"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  MOCK_EMPLOYEES,
  FullEmployee,
  EmployeeService,
} from "./mock-data";

export default function EquipoTrabajoPage() {
  const router = useRouter();
  const { currentBusiness } = useAuth();

  // State
  const [employees, setEmployees] = useState<FullEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isForcedEmpty, setIsForcedEmpty] = useState(false);

  // Modals & Drawers
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<FullEmployee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FullEmployee | null>(null);
  const [servicesPreviewTarget, setServicesPreviewTarget] = useState<FullEmployee | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Load from Supabase real data
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentBusiness?.id) {
        setEmployees([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: FullEmployee[] = data.map((dbEmp) => ({
            id: dbEmp.id,
            business_id: dbEmp.business_id,
            display_name: dbEmp.display_name,
            job_title: dbEmp.profile_id ? "Propietario / Especialista" : "Especialista",
            email: dbEmp.email || "Sin email",
            phone: dbEmp.phone || "Sin teléfono",
            bio: dbEmp.bio || "",
            avatar_url: dbEmp.avatar_url || "",
            is_active: dbEmp.is_active,
            role: "specialist",
            access_status: "activo",
            color_tag: "bg-primary-fixed text-primary",
            location_name: "Sucursal Principal",
            services: [],
            weekly_hours: [],
            exceptions: [],
            recent_appointments: [],
            rating: 5.0,
            reviewsCount: 0,
            monthlyAppointmentsCount: 0,
            monthlyRevenueEst: 0,
          }));
          setEmployees(mapped);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.error("Error loading employees:", err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentBusiness]);

  // KPIs
  const activeCount = useMemo(() => employees.filter((e) => e.is_active).length, [employees]);
  const inactiveCount = useMemo(() => employees.filter((e) => !e.is_active).length, [employees]);
  const pendingCount = useMemo(() => employees.filter((e) => e.access_status === "pendiente").length, [employees]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    if (isForcedEmpty) return [];

    return employees.filter((emp) => {
      // Search
      const matchesSearch =
        searchQuery.trim() === "" ||
        emp.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = emp.is_active;
      if (statusFilter === "inactive") matchesStatus = !emp.is_active;

      // Access
      let matchesAccess = true;
      if (accessFilter !== "all") {
        matchesAccess = emp.access_status === accessFilter;
      }

      // Service
      let matchesService = true;
      if (serviceFilter !== "all") {
        matchesService = (emp.services || []).some((s) =>
          s.category.toLowerCase().includes(serviceFilter.toLowerCase()) ||
          s.name.toLowerCase().includes(serviceFilter.toLowerCase())
        );
      }

      return matchesSearch && matchesStatus && matchesAccess && matchesService;
    });
  }, [employees, searchQuery, statusFilter, accessFilter, serviceFilter, isForcedEmpty]);

  // Actions
  const handleToggleActive = async (emp: FullEmployee) => {
    const updatedStatus = !emp.is_active;
    setEmployees((prev) =>
      prev.map((item) => (item.id === emp.id ? { ...item, is_active: updatedStatus } : item))
    );
    showToast(
      updatedStatus
        ? `${emp.display_name} ha sido reactivado para reservas públicas.`
        : `${emp.display_name} ha sido pausado temporalmente.`
    );
    setDeactivateTarget(null);
    setActiveDropdownId(null);

    if (currentBusiness?.id && !emp.id.startsWith("emp-")) {
      await supabase
        .from("employees")
        .update({ is_active: updatedStatus })
        .eq("id", emp.id);
    }
  };

  const handleResendInvite = (emp: FullEmployee) => {
    showToast(`Enlace de invitación reenviado a ${emp.email}`);
    setActiveDropdownId(null);
  };

  const handleDeleteEmployee = async (emp: FullEmployee) => {
    setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
    showToast(`Empleado ${emp.display_name} eliminado.`);
    setDeleteTarget(null);
    setActiveDropdownId(null);

    if (currentBusiness?.id && !emp.id.startsWith("emp-")) {
      await supabase.from("employees").delete().eq("id", emp.id);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nombre", "Cargo", "Email", "Teléfono", "Acceso", "Estado", "Horas_Semana"];
    const rows = employees.map((e) => [
      e.internal_id,
      `"${e.display_name}"`,
      `"${e.job_title}"`,
      e.email,
      e.phone,
      e.access_status,
      e.is_active ? "Activo" : "Inactivo",
      e.weekly_hours,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equipo_skedly_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exportación de equipo descargada correctamente.");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setServiceFilter("all");
    setAccessFilter("all");
    setStatusFilter("all");
    setIsForcedEmpty(false);
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

      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">
        {/* =========================================================================
            HEADER SECTION
        ========================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 max-w-2xl">
            <div className="flex items-center gap-1.5 text-primary text-xs tracking-wider uppercase font-semibold">
              <span>Gestión operativa</span>
              <span className="text-outline">/</span>
              <span>Talento humano</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
              Equipo de trabajo
            </h1>
            <p className="text-sm text-on-surface-variant">
              Administra a las personas que forman parte de tu negocio y organiza sus servicios y horarios asignados.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="h-10 px-4 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-semibold shadow-sm transition-all flex items-center gap-2 border border-surface-container"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">
                calendar_month
              </span>
              <span>Ver disponibilidad general</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="h-10 px-4 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-semibold shadow-sm transition-all flex items-center gap-2 border border-surface-container"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                file_download
              </span>
              <span>Exportar equipo</span>
            </button>

            <Link
              href="/dashboard/empleados/nuevo"
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              <span>+ Agregar empleado</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            SUMMARY KPI INDICATORS
        ========================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KPI 1: Activos */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex items-center justify-between relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Empleados activos
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-on-surface">{activeCount}</span>
                <span className="text-xs text-on-surface-variant">profesionales</span>
              </div>
              <span className="text-xs text-primary flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                Disponibles para reservas públicas
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">badge</span>
            </div>
          </div>

          {/* KPI 2: Inactivos */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex items-center justify-between relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Empleados inactivos
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-on-surface">{inactiveCount}</span>
                <span className="text-xs text-on-surface-variant">profesional</span>
              </div>
              <span className="text-xs text-secondary flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-outline inline-block"></span>
                Pausado temporalmente
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-container text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">pause_circle</span>
            </div>
          </div>

          {/* KPI 3: Invitaciones pendientes */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex items-center justify-between relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Invitaciones pendientes
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-on-surface">{pendingCount}</span>
                <span className="text-xs text-on-surface-variant">invitación</span>
              </div>
              <span className="text-xs text-tertiary flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-tertiary inline-block animate-pulse"></span>
                Esperando activación de cuenta
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">mark_email_unread</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FILTERS, SEARCH & ACTION BAR
        ========================================================================== */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre de colaborador..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface text-on-surface text-xs placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all border border-surface-container"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Service Filter Dropdown */}
            <div className="relative min-w-[190px]">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-surface text-on-surface text-xs appearance-none focus:outline-none cursor-pointer border border-surface-container"
              >
                <option value="all">Todos los servicios</option>
                <option value="cortes">Cortes de Cabello</option>
                <option value="barba">Afeitados &amp; Barba</option>
                <option value="tratamientos">Tratamientos Capilares</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            {/* Access Level Dropdown */}
            <div className="relative min-w-[180px]">
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-surface text-on-surface text-xs appearance-none focus:outline-none cursor-pointer border border-surface-container"
              >
                <option value="all">Acceso: Todos</option>
                <option value="activa">Con cuenta activa</option>
                <option value="pendiente">Invitación pendiente</option>
                <option value="sin-acceso">Sin acceso a Skedly</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Pill Tabs for Status */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => {
                setStatusFilter("all");
                setIsForcedEmpty(false);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "all"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface font-medium"
              }`}
            >
              <span>Todos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[11px]">
                {employees.length}
              </span>
            </button>

            <button
              onClick={() => {
                setStatusFilter("active");
                setIsForcedEmpty(false);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "active"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface font-medium"
              }`}
            >
              <span>Activos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface text-secondary text-[11px]">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => {
                setStatusFilter("inactive");
                setIsForcedEmpty(false);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "inactive"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface font-medium"
              }`}
            >
              <span>Inactivos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface text-secondary text-[11px]">
                {inactiveCount}
              </span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            ACTIVE TEAM GRID CONTAINER
        ========================================================================== */}
        {filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => {
              const isPaused = !emp.is_active;
              return (
                <div
                  key={emp.id}
                  className={`bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col justify-between gap-4 hover:shadow-md transition-all relative overflow-visible ${
                    isPaused ? "opacity-85" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Profile Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm bg-surface-container flex-shrink-0">
                          <img
                            src={emp.avatar_url}
                            alt={emp.display_name}
                            className={`w-full h-full object-cover ${isPaused ? "grayscale" : ""}`}
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                              emp.is_active ? "bg-primary" : "bg-outline"
                            }`}
                            title={emp.is_active ? "Activo" : "Inactivo"}
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/dashboard/empleados/${emp.id}`}
                            className="text-sm font-bold text-on-surface hover:text-primary transition-colors truncate"
                          >
                            {emp.display_name}
                          </Link>
                          <p className="text-[11px] text-primary font-medium truncate">
                            {emp.job_title}
                          </p>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            ID: {emp.internal_id}
                          </span>
                        </div>
                      </div>

                      {/* Access Status Badge */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isPaused ? (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-error">pause</span>
                            <span>Pausado</span>
                          </span>
                        ) : emp.access_status === "activa" ? (
                          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">verified_user</span>
                            <span>Cuenta activa</span>
                          </span>
                        ) : emp.access_status === "pendiente" ? (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold flex items-center gap-1" title={emp.email}>
                            <span className="material-symbols-outlined text-[13px] text-tertiary">schedule</span>
                            <span>Invitación pend.</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">person_off</span>
                            <span>Sin acceso</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pending Notice Box if Pending */}
                    {emp.access_status === "pendiente" && (
                      <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between text-on-surface">
                          <span className="text-on-surface-variant truncate">
                            Invitado a: <strong className="font-semibold">{emp.email}</strong>
                          </span>
                          <span className="text-outline text-[11px] flex-shrink-0">{emp.invited_at || "Reciente"}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-on-surface-variant">Aún no crea su contraseña</span>
                          <button
                            onClick={() => handleResendInvite(emp)}
                            className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            <span>Reenviar enlace</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Operational Note if Sin Acceso */}
                    {emp.access_status === "sin-acceso" && (
                      <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0 mt-0.5">
                          info
                        </span>
                        <p className="text-[11px] text-on-surface-variant leading-snug">
                          Solo perfil operativo. Las citas se administran desde recepción. No tiene credenciales de acceso.
                        </p>
                      </div>
                    )}

                    {/* Inactive Notice if Paused */}
                    {isPaused && (
                      <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
                        <span className="text-xs text-error font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">block</span>
                          <span>No recibe reservas públicas</span>
                        </span>
                        <span className="text-[11px] text-outline">Pausado</span>
                      </div>
                    )}

                    {/* Services Badges Box */}
                    <div className="flex flex-col gap-1.5 bg-surface-container-low p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                          Servicios ({emp.services.length} vinculados)
                        </span>
                        <button
                          onClick={() => setServicesPreviewTarget(emp)}
                          className="text-[11px] text-primary font-medium cursor-pointer hover:underline"
                        >
                          Ver lista
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {emp.services.slice(0, 3).map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px] font-medium"
                          >
                            {s.name}
                          </span>
                        ))}
                        {emp.services.length > 3 && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-container text-primary font-bold text-[11px]">
                            +{emp.services.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Schedule Summary */}
                    <div className="flex items-start gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0 mt-0.5">
                        schedule
                      </span>
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-on-surface">
                          {emp.schedule_summary}
                        </span>
                        <span className="text-[11px] text-outline">
                          {emp.break_summary}
                        </span>
                      </div>
                    </div>

                    {/* Performance Metric Pill (if active) */}
                    {!isPaused && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary-container/30">
                        <div className="flex items-center gap-1.5 text-xs text-on-secondary-fixed">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            event_available
                          </span>
                          <span>
                            <strong>{emp.today_appointments} citas</strong> programadas hoy
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <span className="material-symbols-outlined text-[15px]">star</span>
                          <span>{emp.satisfaction}% satisfacción</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-surface-container/60">
                    <div className="flex items-center gap-2 flex-1">
                      <Link
                        href={`/dashboard/empleados/${emp.id}`}
                        className="h-9 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex-1 flex items-center justify-center text-center"
                      >
                        Ver perfil
                      </Link>

                      {isPaused ? (
                        <button
                          onClick={() => handleToggleActive(emp)}
                          className="h-9 px-3 rounded-xl bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary text-xs font-semibold transition-colors"
                        >
                          Reactivar
                        </button>
                      ) : emp.access_status === "pendiente" ? (
                        <button
                          onClick={() => handleResendInvite(emp)}
                          className="h-9 px-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-colors"
                        >
                          Reenviar
                        </button>
                      ) : emp.access_status === "sin-acceso" ? (
                        <Link
                          href={`/dashboard/empleados/nuevo?id=${emp.id}`}
                          className="h-9 px-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">mail</span>
                          <span>Invitar</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/empleados/${emp.id}?tab=horarios`}
                          className="h-9 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center justify-center"
                        >
                          Horarios
                        </Link>
                      )}
                    </div>

                    {/* More Menu Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdownId(activeDropdownId === emp.id ? null : emp.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
                        title="Más opciones"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {activeDropdownId === emp.id && (
                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <Link
                            href={`/dashboard/empleados/nuevo?id=${emp.id}`}
                            className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"
                            onClick={() => setActiveDropdownId(null)}
                          >
                            <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                            <span>Editar empleado</span>
                          </Link>
                          <Link
                            href={`/dashboard/empleados/${emp.id}?tab=horarios`}
                            className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"
                            onClick={() => setActiveDropdownId(null)}
                          >
                            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                            <span>Editar turnos</span>
                          </Link>
                          <button
                            onClick={() => {
                              setActiveDropdownId(null);
                              setDeactivateTarget(emp);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px] text-outline">
                              {emp.is_active ? "pause" : "play_arrow"}
                            </span>
                            <span>{emp.is_active ? "Pausar empleado" : "Reactivar"}</span>
                          </button>
                          <div className="my-1 border-t border-surface-container" />
                          <button
                            onClick={() => {
                              setActiveDropdownId(null);
                              setDeleteTarget(emp);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error-container/40 flex items-center gap-2 font-medium"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Eliminar registro</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =========================================================================
              EMPTY STATE CONTAINER
          ========================================================================== */
          <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-12 shadow-sm border border-surface-container flex flex-col items-center justify-center text-center max-w-xl mx-auto my-6">
            <div className="w-20 h-20 rounded-full bg-secondary-container/40 text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[40px]">group_off</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1.5">
              No se encontraron empleados
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Ajusta tus criterios de búsqueda o añade nuevos miembros a tu equipo de trabajo para asignarles servicios y horarios.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
              >
                Restablecer filtros
              </button>
              <Link
                href="/dashboard/empleados/nuevo"
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Agregar empleado</span>
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            EDUCATIONAL CALLOUT / BOTTOM EXPLANATORY BANNER
        ========================================================================== */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">lightbulb</span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-on-surface">
                Diferencia entre Empleado y Cuenta de Skedly
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Un empleado puede estar registrado para prestar servicios y recibir reservas públicas en tu negocio{" "}
                <strong className="text-on-surface">sin necesidad de tener una cuenta de usuario</strong>. La invitación por correo es 100% opcional y solo es necesaria cuando deseas que el colaborador inicie sesión para consultar su propio calendario individual desde su móvil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
            <button
              onClick={() => setIsForcedEmpty(!isForcedEmpty)}
              className="text-primary hover:text-primary-container text-xs font-semibold underline underline-offset-4 cursor-pointer transition-colors"
            >
              {isForcedEmpty ? "Restaurar equipo completo" : "Simular estado vacío"}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: DISPONIBILIDAD GENERAL DEL EQUIPO
      ========================================================================== */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-3xl w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Disponibilidad semanal del equipo</h3>
                  <p className="text-xs text-on-surface-variant">Resumen de días operativos y turnos de cada colaborador</p>
                </div>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <img src={emp.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{emp.display_name}</h4>
                      <p className="text-[11px] text-primary">{emp.job_title}</p>
                    </div>
                  </div>

                  {/* Day Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {emp.weekly_schedule.map((day) => (
                      <span
                        key={day.dayKey}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex flex-col items-center min-w-[34px] ${
                          day.active
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-container text-outline line-through"
                        }`}
                        title={day.active ? `${day.day}: ${day.start} - ${day.end}` : `${day.day}: Cerrado`}
                      >
                        {day.dayShort}
                      </span>
                    ))}
                  </div>

                  <span className="text-xs font-mono font-bold text-on-surface text-right">
                    {emp.weekly_hours}h / sem
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-container">
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PREVIEW DE SERVICIOS VINCULADOS
      ========================================================================== */}
      {servicesPreviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">content_cut</span>
                <h3 className="text-sm font-bold text-on-surface">
                  Servicios de {servicesPreviewTarget.display_name}
                </h3>
              </div>
              <button
                onClick={() => setServicesPreviewTarget(null)}
                className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {servicesPreviewTarget.services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-on-surface">{srv.name}</h5>
                    <span className="text-[11px] text-on-surface-variant">
                      {srv.category} • {srv.duration} min
                    </span>
                  </div>
                  <span className="font-bold text-primary font-mono">${srv.price} MXN</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-container">
              <button
                onClick={() => setServicesPreviewTarget(null)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRMACIÓN DESACTIVAR / PAUSAR EMPLEADO
      ========================================================================== */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">person_off</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-on-surface">
                {deactivateTarget.is_active
                  ? `¿Desactivar a ${deactivateTarget.display_name}?`
                  : `¿Reactivar a ${deactivateTarget.display_name}?`}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {deactivateTarget.is_active
                  ? "No se recibirán nuevas citas para este colaborador en la página pública ni en el panel de reservas."
                  : "El colaborador volverá a aparecer disponible en el calendario y página pública."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                verified_user
              </span>
              <span>
                Sus citas históricas, reportes financieros y reseñas de clientes{" "}
                <strong>se conservarán intactas</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeactivateTarget(null)}
                className="px-4 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleToggleActive(deactivateTarget)}
                className={`px-4 h-10 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                  deactivateTarget.is_active
                    ? "bg-error hover:bg-on-error-container text-on-error"
                    : "bg-primary hover:bg-primary-container text-on-primary"
                }`}
              >
                {deactivateTarget.is_active ? "Confirmar desactivación" : "Confirmar reactivación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRMACIÓN ELIMINAR EMPLEADO
      ========================================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">delete_forever</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-on-surface">
                ¿Eliminar permanentemente a {deleteTarget.display_name}?
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Esta acción retirará al empleado del catálogo y desvinculará sus turnos. Esta operación no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteEmployee(deleteTarget)}
                className="px-4 h-10 rounded-xl bg-error hover:bg-on-error-container text-on-error text-xs font-semibold shadow-sm transition-all"
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
