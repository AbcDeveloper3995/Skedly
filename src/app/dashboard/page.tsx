"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { useDashboardView } from "./view-context";

interface AppointmentItem {
  id: string;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "in_progress" | "no_show";
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  employee_name?: string;
  service_name?: string;
  duration_minutes?: number;
  price?: number;
  notes?: string;
}

export default function DashboardOverviewPage() {
  const { user, profile, currentBusiness } = useAuth();
  const { viewMode, isQuickAppointmentOpen, setIsQuickAppointmentOpen, employeeName } =
    useDashboardView();

  // State
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [simulateEmpty, setSimulateEmpty] = useState<boolean>(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("week");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Note Modal State
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    customerName: string;
    notes: string;
  }>({
    isOpen: false,
    customerName: "",
    notes: "",
  });

  // Modal Nueva Cita Form
  const [modalCustomerName, setModalCustomerName] = useState("");
  const [modalCustomerPhone, setModalCustomerPhone] = useState("");
  const [modalServiceName, setModalServiceName] = useState("Corte Degradado Moderno");
  const [modalSpecialist, setModalSpecialist] = useState("Mateo Ramos");
  const [modalPrice, setModalPrice] = useState(18);
  const [modalTime, setModalTime] = useState("11:30");
  const [submittingModal, setSubmittingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Client-safe formatted date to avoid Next.js 16 prerender mismatches
  const [currentDateFormatted, setCurrentDateFormatted] = useState(
    "Miércoles, 24 de Octubre de 2025"
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const copyPublicLink = () => {
    const slug = currentBusiness?.slug || "urban-cuts";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://skedly.com";
    const url = `${origin}/reservas/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("¡Enlace copiado al portapapeles: " + url + "!");
    } else {
      showToast("Enlace de reservas: " + url);
    }
  };

  // Customers count from Supabase
  const [customersCount, setCustomersCount] = useState<number>(0);

  // Load from Supabase real data
  const loadDashboardData = async (businessId: string) => {
    try {
      const { data: appData } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status,
          customer_name_snapshot,
          customer_phone_snapshot,
          employee:employees(display_name),
          appointment_services(service_name, unit_price, duration_minutes)
        `)
        .eq("business_id", businessId)
        .order("start_at", { ascending: true })
        .limit(50);

      if (appData && appData.length > 0) {
        const mapped: AppointmentItem[] = appData.map((item: any) => {
          const service = item.appointment_services?.[0];
          const time = new Date(item.start_at).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            id: item.id,
            start_at: time,
            end_at: item.end_at,
            status: item.status,
            customer_name_snapshot: item.customer_name_snapshot || "Cliente",
            customer_phone_snapshot: item.customer_phone_snapshot || "",
            employee_name: item.employee?.display_name || "Especialista",
            service_name: service?.service_name || "Servicio General",
            duration_minutes: service?.duration_minutes || 45,
            price: service?.unit_price || 0,
          };
        });
        setAppointments(mapped);
      } else {
        setAppointments([]);
      }

      // Fetch real customers count
      const { count } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);

      setCustomersCount(count || 0);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setAppointments([]);
    }
  };

  useEffect(() => {
    try {
      const today = new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
      setCurrentDateFormatted(today.charAt(0).toUpperCase() + today.slice(1));
    } catch {
      // fallback
    }

    if (currentBusiness?.id) {
      loadDashboardData(currentBusiness.id);
    } else {
      setAppointments([]);
    }
  }, [currentBusiness]);

  // Appointment actions
  const handleUpdateStatus = async (id: string, newStatus: AppointmentItem["status"]) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );

    if (currentBusiness?.id && id.length > 20) {
      try {
        await supabase
          .from("appointments")
          .update({ status: newStatus })
          .eq("id", id)
          .eq("business_id", currentBusiness.id);
      } catch (e) {
        console.error("Status update error", e);
      }
    }

    if (newStatus === "completed") {
      showToast("Cita marcada como completada con éxito.");
    } else if (newStatus === "confirmed") {
      showToast("Cita confirmada correctamente.");
    } else if (newStatus === "cancelled") {
      showToast("Cita cancelada.");
    }
  };

  // Create appointment handler
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingModal(true);
    setModalError(null);

    const newApt: AppointmentItem = {
      id: "apt-manual-" + Date.now(),
      start_at: modalTime,
      end_at: modalTime,
      status: "confirmed",
      customer_name_snapshot: modalCustomerName.trim(),
      customer_phone_snapshot: modalCustomerPhone.trim(),
      employee_name: modalSpecialist,
      service_name: modalServiceName,
      duration_minutes: 45,
      price: modalPrice,
      notes: "Agendada manualmente en mostrador.",
    };

    setAppointments((prev) => [newApt, ...prev]);

    if (currentBusiness?.id && user?.id) {
      try {
        const { data: customerData } = await supabase
          .from("customers")
          .insert({
            business_id: currentBusiness.id,
            full_name: modalCustomerName.trim(),
            phone: modalCustomerPhone.trim(),
          })
          .select()
          .single();

        const today = new Date().toISOString().split("T")[0];
        const startAt = new Date(`${today}T${modalTime}:00Z`).toISOString();
        const endAt = new Date(new Date(startAt).getTime() + 45 * 60000).toISOString();

        const { data: appointmentData } = await supabase
          .from("appointments")
          .insert({
            business_id: currentBusiness.id,
            customer_id: customerData?.id,
            status: "confirmed",
            source: "dashboard",
            start_at: startAt,
            end_at: endAt,
            customer_name_snapshot: modalCustomerName.trim(),
            customer_phone_snapshot: modalCustomerPhone.trim(),
            created_by: user.id,
          })
          .select()
          .single();

        if (appointmentData) {
          await supabase.from("appointment_services").insert({
            business_id: currentBusiness.id,
            appointment_id: appointmentData.id,
            service_name: modalServiceName,
            unit_price: modalPrice,
            duration_minutes: 45,
            quantity: 1,
          });
        }
      } catch (err: unknown) {
        console.error("Error creating manual appointment in Supabase:", err);
      }
    }

    setSubmittingModal(false);
    setIsQuickAppointmentOpen(false);
    setModalCustomerName("");
    setModalCustomerPhone("");
    showToast("¡Cita agendada exitosamente para " + modalCustomerName + "!");
  };

  const userDisplayName =
    profile?.full_name || user?.email?.split("@")[0] || "María Ramos";

  // Filtered list
  const filteredAppointments = appointments.filter((apt) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return apt.status === "pending";
    if (activeFilter === "confirmed") return apt.status === "confirmed";
    if (activeFilter === "completed") return apt.status === "completed";
    if (activeFilter === "cancelled") return apt.status === "cancelled";
    return true;
  });

  return (
    <div className="w-full">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-on-surface text-surface-container-lowest shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-surface-container-high">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: PROPIETARIO / ADMIN DASHBOARD
      ========================================================================== */}
      {viewMode === "owner" && (
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 space-y-8">
          {/* 1. Header & Live Status Banner */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-medium mb-1 shadow-sm border border-surface-container-high/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">Negocio abierto (09:00 - 20:00)</span>
                <span className="text-outline">•</span>
                <span className="text-secondary font-normal">3 especialistas activos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                ¡Buenos días, {userDisplayName}!
              </h1>
              <p className="text-sm text-secondary">
                Esto es lo que está pasando hoy en tu negocio •{" "}
                <span className="font-semibold text-on-surface">{currentDateFormatted}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container text-xs font-semibold shadow-sm border border-surface-container transition-all group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                  storefront
                </span>
                <span>Ver página pública</span>
                <span className="font-mono text-secondary text-[11px] ml-1">
                  (skedly.com/{currentBusiness?.slug || "barberia-elite"})
                </span>
                <span className="material-symbols-outlined text-[15px]">arrow_outward</span>
              </Link>
            </div>
          </section>

          {/* 2. KPI Metrics Grid (4 cards with real Supabase calculations) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-secondary">Citas de hoy</span>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">{appointments.length}</span>
                </div>
                <p className="text-xs text-secondary">
                  {appointments.filter((a) => a.status === "completed" || a.status === "in_progress").length} completadas o en curso
                </p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-secondary">Próximas citas</span>
                <div className="w-9 h-9 rounded-xl bg-secondary-container/60 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">upcoming</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">
                    {appointments.filter((a) => a.status === "confirmed" || a.status === "pending").length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
                    Programadas
                  </span>
                </div>
                <p className="text-xs text-secondary">Total activas en agenda</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-secondary">Clientes registrados</span>
                <div className="w-9 h-9 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">person_check</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">{customersCount}</span>
                </div>
                <p className="text-xs text-secondary">Clientes en base de datos</p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-secondary">Tasa de cancelación</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">
                    {appointments.length > 0
                      ? Math.round(
                          (appointments.filter((a) => a.status === "cancelled").length /
                            appointments.length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-xs text-secondary">Sobre citas registradas</p>
              </div>
            </div>
          </section>

          {/* 3. Central Two-Column Layout (7/12 & 5/12) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ==================== LEFT COLUMN (7 / 12) ==================== */}
            <div className="lg:col-span-7 space-y-8">
              {/* Module A: Citas de Hoy */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-6 space-y-4">
                {/* Header and Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-on-surface">Citas de hoy</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                      {appointments.length} citas
                    </span>
                  </div>
                  <Link
                    href="/dashboard/citas"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors group"
                  >
                    <span>Ver todas las citas</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: "all", label: `Todas (${appointments.length})` },
                    {
                      key: "pending",
                      label: `Pendientes (${
                        appointments.filter((a) => a.status === "pending").length
                      })`,
                    },
                    {
                      key: "confirmed",
                      label: `Confirmadas (${
                        appointments.filter((a) => a.status === "confirmed").length
                      })`,
                    },
                    {
                      key: "completed",
                      label: `Completadas (${
                        appointments.filter((a) => a.status === "completed").length
                      })`,
                    },
                    {
                      key: "cancelled",
                      label: `Canceladas (${
                        appointments.filter((a) => a.status === "cancelled").length
                      })`,
                    },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer ${
                        activeFilter === filter.key
                          ? "bg-on-surface text-surface-container-lowest shadow-sm"
                          : "bg-surface-container-low text-secondary hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Real Empty State or Active Appointment List */}
                {appointments.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-surface-container-low text-center flex flex-col items-center justify-center space-y-4 my-2 border border-surface-container">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mx-auto shadow-sm">
                      <span className="material-symbols-outlined text-[32px]">event_busy</span>
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-on-surface">
                        Hoy todavía no tienes citas programadas
                      </h3>
                      <p className="text-xs text-secondary leading-relaxed">
                        Comparte tu enlace de reservas con tus clientes en redes sociales o WhatsApp,
                        o crea una cita manual en cualquier momento.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-center flex-wrap pt-2">
                      <Link
                        href="/dashboard/calendario"
                        className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm transition-all"
                      >
                        Ver calendario completo
                      </Link>
                      <button
                        type="button"
                        onClick={copyPublicLink}
                        className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container shadow-sm border border-surface-container transition-all"
                      >
                        Copiar enlace de reserva
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {filteredAppointments.length === 0 ? (
                      <p className="text-center py-6 text-xs text-secondary">
                        No hay citas en este filtro.
                      </p>
                    ) : (
                      filteredAppointments.map((item) => {
                        const isInProgress = item.status === "in_progress";
                        const isPending = item.status === "pending";
                        const isCompleted = item.status === "completed";
                        const isCancelled = item.status === "cancelled";

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group border ${
                              isInProgress
                                ? "bg-primary-fixed/25 hover:bg-primary-fixed/35 border-primary/20 shadow-sm"
                                : isPending
                                ? "bg-amber-50/70 hover:bg-amber-100/70 border-amber-200/60"
                                : isCancelled
                                ? "bg-surface-container-low/60 border-surface-container opacity-75"
                                : "bg-surface-container-low hover:bg-surface-container border-surface-container/60"
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              {/* Time badge */}
                              <div
                                className={`flex flex-col items-center justify-center w-14 py-2 px-1 rounded-lg shadow-sm flex-shrink-0 ${
                                  isInProgress
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container-lowest text-on-surface border border-surface-container"
                                }`}
                              >
                                <span className="text-sm font-bold tracking-tight">
                                  {item.start_at}
                                </span>
                                <span
                                  className={`text-[10px] ${
                                    isInProgress ? "text-primary-fixed" : "text-secondary"
                                  }`}
                                >
                                  {item.duration_minutes || 45} min
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p
                                    className={`text-sm font-semibold truncate ${
                                      isCancelled
                                        ? "line-through text-secondary"
                                        : "text-on-surface"
                                    }`}
                                  >
                                    {item.customer_name_snapshot}
                                  </p>

                                  {/* Status chip */}
                                  {isCompleted && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      Completada
                                    </span>
                                  )}
                                  {isInProgress && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                      En curso
                                    </span>
                                  )}
                                  {item.status === "confirmed" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                                      Confirmada
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      Pendiente confirmación
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary text-[11px] font-semibold">
                                      Cancelada
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-secondary truncate mt-0.5">
                                  {item.service_name}
                                </p>
                                <p className="text-[11px] text-outline flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px]">
                                    badge
                                  </span>
                                  {item.employee_name || "Mateo Ramos"}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 sm:self-center self-end flex-wrap">
                              {isInProgress && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(item.id, "completed")}
                                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 shadow-sm transition-colors cursor-pointer"
                                >
                                  Marcar completada
                                </button>
                              )}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item.id, "confirmed")}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                                  >
                                    Confirmar cita
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item.id, "cancelled")}
                                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-error hover:bg-error-container text-xs font-semibold shadow-sm border border-surface-container transition-colors cursor-pointer"
                                  >
                                    Rechazar
                                  </button>
                                </>
                              )}
                              {!isInProgress && !isPending && !isCancelled && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      isOpen: true,
                                      customerName: item.customer_name_snapshot || "Cliente",
                                      notes: item.notes || "Sin notas registradas aún.",
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface text-xs font-semibold shadow-sm border border-surface-container transition-colors cursor-pointer"
                                >
                                  Ver ficha
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setNoteModal({
                                    isOpen: true,
                                    customerName: item.customer_name_snapshot || "Cliente",
                                    notes: item.notes || "Notas de servicio para " + item.customer_name_snapshot,
                                  })
                                }
                                title="Añadir nota"
                                className="w-8 h-8 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center shadow-sm border border-surface-container transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  sticky_note_2
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Module B: Rendimiento del Negocio */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">Rendimiento del negocio</h2>
                    <p className="text-xs text-secondary">
                      Flujo semanal de reservas y servicios con mayor demanda
                    </p>
                  </div>
                  <div className="flex items-center p-1 bg-surface-container-low rounded-lg self-start sm:self-auto border border-surface-container">
                    {[
                      { key: "week", label: "Esta semana" },
                      { key: "month", label: "Este mes" },
                      { key: "30d", label: "Últimos 30 días" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSelectedTimeRange(tab.key)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          selectedTimeRange === tab.key
                            ? "bg-surface-container-lowest text-on-surface shadow-sm"
                            : "text-secondary hover:text-on-surface"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart: Evolución y servicios */}
                {appointments.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-surface-container-low/50 border border-dashed border-surface-container flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-secondary">trending_up</span>
                    <p className="text-xs font-semibold text-on-surface">Sin estadísticas de reservas aún</p>
                    <p className="text-[11px] text-secondary max-w-sm">
                      A medida que tus clientes agenden turnos o registres citas en mostrador, verás reflejada aquí la evolución de tu negocio y tus servicios más solicitados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Resumen de citas */}
                    <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">Resumen de actividad</span>
                        <span className="text-xs font-semibold text-primary">{appointments.length} citas registradas</span>
                      </div>
                      <p className="text-xs text-secondary">
                        {appointments.filter((a) => a.status === "completed").length} citas completadas con éxito.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ==================== RIGHT COLUMN (5 / 12) ==================== */}
            <div className="lg:col-span-5 space-y-8">
              {/* Module C: Quick Actions Grid */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-on-surface">Acciones rápidas</h2>
                  <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Action 1 */}
                  <button
                    type="button"
                    onClick={() => setIsQuickAppointmentOpen(true)}
                    className="p-4 rounded-xl bg-surface-container-low hover:bg-primary-fixed/40 transition-all flex flex-col justify-between text-left group border border-surface-container cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
                        Crear cita manual
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5">Agendar cliente en mostrador</p>
                    </div>
                  </button>

                  {/* Action 2 */}
                  <Link
                    href="/dashboard/servicios"
                    className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between text-left group border border-surface-container"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">add_circle</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
                        Agregar servicio
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5">Nuevo precio y duración</p>
                    </div>
                  </Link>

                  {/* Action 3 */}
                  <Link
                    href="/dashboard/empleados"
                    className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between text-left group border border-surface-container"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">person_add</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
                        Nuevo empleado
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5">Asignar agenda y turno</p>
                    </div>
                  </Link>

                  {/* Action 4 */}
                  <button
                    type="button"
                    onClick={copyPublicLink}
                    className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between text-left group border border-surface-container cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">link</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
                        Copiar enlace público
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5">Compartir con clientes</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Module D: Próximas Citas (Upcoming widget) */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">Próximas citas</h2>
                    <p className="text-xs text-secondary">Agenda confirmada para los siguientes días</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
                    12 pendientes
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { day: "MAÑ", time: "09:30", customer: "Marcos Silva", service: "Corte Clásico • Mateo R.", status: "Confirmada", color: "bg-emerald-100 text-emerald-800" },
                    { day: "MAÑ", time: "11:00", customer: "Pablo Echeverría", service: "Perfilado Barba • Sofía G.", status: "Confirmada", color: "bg-emerald-100 text-emerald-800" },
                    { day: "JUE", time: "15:30", customer: "Gonzalo Ruiz", service: "Pack Completo • David L.", status: "Confirmada", color: "bg-secondary-container text-on-secondary-container" },
                    { day: "JUE", time: "17:00", customer: "Andrés Morales", service: "Corte Degradado • Mateo R.", status: "Confirmada", color: "bg-secondary-container text-on-secondary-container" },
                  ].map((up, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between gap-3 border border-surface-container/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center shadow-sm flex-shrink-0 border border-surface-container">
                          <span className="text-[11px] text-primary font-bold">{up.day}</span>
                          <span className="text-[10px] text-secondary">{up.time}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">{up.customer}</p>
                          <p className="text-[11px] text-secondary truncate">{up.service}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${up.color}`}>
                        {up.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <Link
                    href="/dashboard/calendario"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors group"
                  >
                    <span>Ir a vista semanal de calendario</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>

              {/* Module E: Resumen Operativo */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-6 space-y-4">
                <h2 className="text-lg font-bold text-on-surface">Resumen operativo</h2>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                    <span className="text-lg font-bold text-on-surface block">8</span>
                    <span className="text-[10px] text-secondary leading-tight block mt-0.5">
                      Servicios catálogo
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                    <span className="text-lg font-bold text-primary block">3</span>
                    <span className="text-[10px] text-secondary leading-tight block mt-0.5">
                      Especialistas
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                    <span className="text-lg font-bold text-on-surface block">248</span>
                    <span className="text-[10px] text-secondary leading-tight block mt-0.5">
                      Clientes activos
                    </span>
                  </div>
                </div>

                {/* Banner Informativo */}
                <div className="p-3.5 rounded-xl bg-secondary-container/30 border border-secondary-container/60 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">
                    notifications_active
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-on-surface">
                      Recordatorios automáticos activos
                    </p>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Tus clientes reciben aviso por WhatsApp / SMS 24 horas antes.
                    </p>
                  </div>
                </div>

                {/* Quick Business Profile Link */}
                <div className="flex items-center justify-between pt-1 text-xs text-secondary border-t border-surface-container">
                  <span className="truncate">Sede Central • Gran Vía 42, Madrid</span>
                  <Link
                    href="/dashboard/configuracion"
                    className="text-primary font-semibold hover:underline shrink-0 ml-2"
                  >
                    Configurar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: EMPLEADO / VISTA COLABORADOR
      ========================================================================== */}
      {viewMode === "employee" && (
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 space-y-6">
          {/* Role Banner & Restrictive Notice */}
          <section className="p-4 rounded-xl bg-surface-container-low border border-surface-container shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-on-surface">Perfil de Colaborador</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                    {employeeName} · Barbero Principal
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[11px]">
                    Barbería Élite Central
                  </span>
                </div>
                <p className="text-xs text-secondary truncate mt-0.5">
                  Vista operativa individual. Los balances contables y configuración son gestionados
                  por Administración.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-secondary text-xs font-semibold shadow-sm border border-surface-container">
                <span className="material-symbols-outlined text-primary text-[16px]">
                  verified_user
                </span>
                <span>Permisos: Agenda Personal</span>
              </div>
            </div>
          </section>

          {/* Greeter & Day Summary Bar */}
          <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container p-6">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-tertiary-fixed/30 to-transparent blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold uppercase tracking-wider">
                    Jornada Activa
                  </span>
                  <span className="text-xs text-secondary">{currentDateFormatted}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                  ¡Hola, {employeeName.split(" ")[0]}! Tu jornada de hoy
                </h1>
                <p className="text-sm text-secondary">
                  Turno programado:{" "}
                  <span className="font-bold text-on-surface">09:00 - 18:30</span> • Tienes{" "}
                  <span className="text-primary font-bold">6 citas asignadas</span> y 1 receso programado.
                </p>
              </div>

              {/* Employee Actions */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-2.5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                  <div>
                    <p className="text-[10px] text-secondary uppercase font-semibold">Estado</p>
                    <p className="text-xs font-bold text-on-surface">En Servicio (Sillón 02)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast("Pausa solicitada. Tu agenda no aceptará nuevas reservas durante el descanso.")}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-sm border border-surface-container transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">coffee</span>
                  <span>Solicitar Pausa</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast("Agenda sincronizada con tu dispositivo móvil.")}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  <span>Sincronizar Turno</span>
                </button>
              </div>
            </div>
          </section>

          {/* Personal KPIs Grid (4 cards) */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
                    Citas de Hoy
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-on-surface">6</span>
                    <span className="text-xs text-secondary">programadas</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center border border-surface-container">
                  <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-container flex items-center justify-between text-secondary text-xs">
                <span>1 finalizada · 1 en curso</span>
                <span className="font-bold text-primary">33% completado</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
                    Mis Próximas Citas
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-on-surface">18</span>
                    <span className="text-xs text-secondary">esta semana</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low text-tertiary flex items-center justify-center border border-surface-container">
                  <span className="material-symbols-outlined text-[22px]">date_range</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-container flex items-center justify-between text-secondary text-xs">
                <span>Miér (5) · Jue (4) · Vie (6)</span>
                <span className="font-semibold text-on-surface">Lun-Sáb</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
                    Tiempo Reservado
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-on-surface">5h 15m</span>
                  </div>
                </div>
                {/* SVG Progress Ring */}
                <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-primary transition-all duration-1000"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="75, 100"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-primary">75%</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-container flex items-center justify-between text-secondary text-xs">
                <span>De 7h efectivas turno</span>
                <span className="font-bold text-primary">75% ocupación</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
                    Clientes Este Mes
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-on-surface">64</span>
                    <span className="text-xs text-secondary">atendidos</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center border border-surface-container">
                  <span className="material-symbols-outlined text-[22px]">person_check</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-container flex items-center justify-between text-secondary text-xs">
                <span>Satisfacción media</span>
                <span className="font-bold text-on-surface flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px] text-amber-500 fill-1">
                    star
                  </span>
                  4.9 / 5.0
                </span>
              </div>
            </div>
          </section>

          {/* Asymmetric 2-Column Split: 8 cols / 4 cols */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Agenda & Timeline */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-on-surface tracking-tight">
                        Mi Agenda de Hoy
                      </h2>
                      <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-xs font-semibold">
                        {employeeName}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-0.5">
                      Lista cronológica de servicios reservados en tu sillón
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Filtrar:</span>
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold border border-surface-container focus:bg-surface-container-lowest outline-none"
                    >
                      <option value="all">Todas las franjas (6)</option>
                      <option value="pending">Pendientes de realizar</option>
                      <option value="completed">Completadas</option>
                    </select>
                  </div>
                </div>

                {/* Timeline Items */}
                <div className="space-y-3.5">
                  {/* Item 1: 09:30 - Carlos Mendoza [Completada] */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 opacity-90">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-container text-secondary flex-shrink-0 text-center border border-surface-container-high/60">
                        <span className="text-xs font-bold text-on-surface">09:30</span>
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check_circle
                        </span>
                        <span className="text-[10px] text-secondary">45 min</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-on-surface">Carlos Mendoza</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary text-[11px] font-semibold">
                            Completada
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[10px]">
                            Cliente habitual
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            content_cut
                          </span>
                          Corte Degradado + Lavado
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          Finalizada a las 10:15 · Sin incidencias registradas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() =>
                          setNoteModal({
                            isOpen: true,
                            customerName: "Carlos Mendoza",
                            notes:
                              "Prefiere acabado mate con cera natural. Corte con máquina 0.5 a los lados.",
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-sm border border-surface-container transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          notes
                        </span>
                        <span>Ver notas</span>
                      </button>
                    </div>
                  </div>

                  {/* Item 2: 11:15 - Alejandro Peña [En curso] */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-md border-l-4 border-l-primary border-t border-r border-b border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex-shrink-0 text-center">
                        <span className="text-sm font-bold">11:15</span>
                        <span className="material-symbols-outlined text-[16px] animate-spin">
                          refresh
                        </span>
                        <span className="text-[10px] font-semibold">60 min</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-on-surface">Alejandro Peña</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container animate-ping"></span>
                            En curso
                          </span>
                          <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-semibold">
                            Sillón 02
                          </span>
                        </div>
                        <p className="text-xs text-primary font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">content_cut</span>
                          Pack Completo Corte + Barba
                        </p>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">
                            info
                          </span>
                          Nota del cliente:{" "}
                          <span className="font-semibold text-on-surface">
                            &quot;Degradado medio, aceite de sándalo para la barba.&quot;
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => showToast("Cita de Alejandro Peña marcada como completada.")}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Marcar completada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNoteModal({
                            isOpen: true,
                            customerName: "Alejandro Peña",
                            notes:
                              "Degradado medio, aceite de sándalo para la barba. Sensibilidad en la zona del cuello tras afeitado a navaja.",
                          })
                        }
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary border border-surface-container cursor-pointer"
                        title="Ver notas"
                      >
                        <span className="material-symbols-outlined text-[18px]">notes</span>
                      </button>
                    </div>
                  </div>

                  {/* Item 3: 14:00 - Bloqueo / Pausa de Almuerzo */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-11 rounded-lg bg-surface-container-highest text-secondary flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-semibold">14:00</span>
                        <span className="text-[10px]">60 min</span>
                      </div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">restaurant</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">
                            PAUSA / ALMUERZO PROGRAMADO
                          </p>
                          <p className="text-[10px] text-secondary truncate">
                            Bloqueo de horario no reservable en la página web pública
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-secondary text-[10px] uppercase font-bold shrink-0">
                      Descanso personal
                    </span>
                  </div>

                  {/* Item 4: 15:30 - David Soria [Confirmada] */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-container-low text-on-surface flex-shrink-0 text-center border border-surface-container">
                        <span className="text-sm font-semibold">15:30</span>
                        <span className="text-[10px] text-secondary">40 min</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-on-surface">David Soria</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                            Confirmada
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-low text-secondary text-[10px]">
                            Pago en local
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            content_cut
                          </span>
                          Corte de Autor
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          Ficha previa: Prefiere tijera superior sin entresacar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => showToast("Servicio a David Soria completado.")}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>Completar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast("Registrado: David Soria no asistió.")}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-error-container text-secondary hover:text-on-error-container text-xs font-semibold border border-surface-container transition-all flex items-center gap-1 cursor-pointer"
                        title="No asistió"
                      >
                        <span className="material-symbols-outlined text-[15px]">person_off</span>
                        <span>No asistió</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNoteModal({
                            isOpen: true,
                            customerName: "David Soria",
                            notes:
                              "Prefiere corte con tijera superior sin entresacar, raya lateral limpia a la izquierda.",
                          })
                        }
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary border border-surface-container cursor-pointer"
                        title="Ver notas"
                      >
                        <span className="material-symbols-outlined text-[18px]">notes</span>
                      </button>
                    </div>
                  </div>

                  {/* Item 5: 16:30 - Iván Valdés [Confirmada] */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-container-low text-on-surface flex-shrink-0 text-center border border-surface-container">
                        <span className="text-sm font-semibold">16:30</span>
                        <span className="text-[10px] text-secondary">35 min</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-on-surface">Iván Valdés</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                            Confirmada
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            content_cut
                          </span>
                          Corte Degradado
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          Nota del cliente: &quot;Prefiere degradado al cero, poco producto final.&quot;
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => showToast("Servicio a Iván Valdés completado.")}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>Completar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNoteModal({
                            isOpen: true,
                            customerName: "Iván Valdés",
                            notes:
                              "Prefiere degradado al cero muy pulido, nada de fijador en gel, solo agua de peinado o talco neutro.",
                          })
                        }
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary border border-surface-container cursor-pointer"
                        title="Ver notas"
                      >
                        <span className="material-symbols-outlined text-[18px]">notes</span>
                      </button>
                    </div>
                  </div>

                  {/* Item 6: 17:30 - Jorge Alarcón [Confirmada] */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-container-low text-on-surface flex-shrink-0 text-center border border-surface-container">
                        <span className="text-sm font-semibold">17:30</span>
                        <span className="text-[10px] text-secondary">30 min</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-on-surface">
                            Jorge Alarcón
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                            Confirmada
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            face_retouching_natural
                          </span>
                          Arreglo de Barba
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          Última cita del turno de {employeeName.split(" ")[0]} hoy.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => showToast("Servicio a Jorge Alarcón completado.")}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>Completar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNoteModal({
                            isOpen: true,
                            customerName: "Jorge Alarcón",
                            notes:
                              "Delineado recto con toalla caliente previa. Acabado con bálsamo hidratante.",
                          })
                        }
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary border border-surface-container cursor-pointer"
                        title="Ver notas"
                      >
                        <span className="material-symbols-outlined text-[18px]">notes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Performance & Punctuality Summary */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Puntualidad en agenda: 98%</p>
                    <p className="text-xs text-secondary">
                      Tus servicios se están ejecutando con precisión horaria este mes.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-secondary uppercase font-semibold">
                      Promedio cita
                    </span>
                    <p className="text-sm font-bold text-on-surface">42 min</p>
                  </div>
                  <div className="h-8 w-px bg-surface-container"></div>
                  <div className="text-right">
                    <span className="text-[10px] text-secondary uppercase font-semibold">
                      Retención
                    </span>
                    <p className="text-sm font-bold text-primary">89%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Assigned Services & Shift Schedule */}
            <div className="lg:col-span-4 space-y-6">
              {/* Assigned Services Panel */}
              <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      content_cut
                    </span>
                    <h3 className="text-base font-bold text-on-surface">Mis Servicios Asignados</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-xs font-semibold">
                    3 activos
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Servicios que los clientes pueden agendar específicamente con {employeeName}:
                </p>

                <div className="space-y-2.5">
                  {[
                    { num: "01", name: "Corte de Autor", meta: "40 min · Asignado exclusivo", price: "22 €" },
                    { num: "02", name: "Corte Degradado + Lavado", meta: "45 min · Alta demanda", price: "18 €" },
                    { num: "03", name: "Pack Completo Corte + Barba", meta: "60 min · Paquete premium", price: "28 €" },
                  ].map((srv) => (
                    <div
                      key={srv.num}
                      className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center font-bold text-xs shadow-sm border border-surface-container">
                          {srv.num}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{srv.name}</p>
                          <p className="text-[10px] text-secondary truncate">{srv.meta}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface text-xs font-bold shadow-sm border border-surface-container">
                        {srv.price}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-secondary text-xs border-t border-surface-container">
                  <span className="material-symbols-outlined text-[15px]">lock</span>
                  <span className="text-[11px]">Tarifas y catálogo configurados por administración</span>
                </div>
              </div>

              {/* Weekly Shift Schedule */}
              <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      schedule
                    </span>
                    <h3 className="text-base font-bold text-on-surface">Mi Horario Semanal</h3>
                  </div>
                  <span className="text-xs text-primary font-bold">Semana 43</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-primary-fixed/30 border border-primary/20 flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      Hoy (Miércoles)
                    </span>
                    <span className="font-bold text-primary">09:00 - 18:30</span>
                  </div>
                  {[
                    { day: "Jueves", hours: "09:30 - 19:00" },
                    { day: "Viernes", hours: "09:00 - 20:00 (Intensivo)" },
                    { day: "Sábado", hours: "09:00 - 14:30" },
                    { day: "Domingo / Lunes", hours: "Descanso semanal", off: true },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-xs ${
                        s.off ? "opacity-60 text-secondary" : "text-secondary"
                      }`}
                    >
                      <span>{s.day}</span>
                      <span className="font-medium text-on-surface">{s.hours}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => showToast("Solicitud de cambio enviada al Administrador.")}
                    className="w-full py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    <span>Solicitar cambio de turno</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NUEVA CITA MANUAL (Shared by Owner & Employee)
      ========================================================================== */}
      {isQuickAppointmentOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">Agendar Nueva Cita</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAppointmentOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  value={modalCustomerName}
                  onChange={(e) => setModalCustomerName(e.target.value)}
                  placeholder="Ej. Roberto Sánchez"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Teléfono (WhatsApp para avisos)
                </label>
                <input
                  type="tel"
                  required
                  value={modalCustomerPhone}
                  onChange={(e) => setModalCustomerPhone(e.target.value)}
                  placeholder="+34 612 345 678"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Servicio
                  </label>
                  <select
                    value={modalServiceName}
                    onChange={(e) => {
                      setModalServiceName(e.target.value);
                      if (e.target.value === "Corte Degradado Moderno") setModalPrice(18);
                      else if (e.target.value === "Perfilado Barba") setModalPrice(14);
                      else if (e.target.value === "Pack Completo Corte + Barba") setModalPrice(28);
                      else setModalPrice(22);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                  >
                    <option value="Corte Degradado Moderno">Corte Degradado Moderno</option>
                    <option value="Perfilado Barba">Perfilado Barba</option>
                    <option value="Pack Completo Corte + Barba">Pack Completo Corte + Barba</option>
                    <option value="Corte de Autor">Corte de Autor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Especialista
                  </label>
                  <select
                    value={modalSpecialist}
                    onChange={(e) => setModalSpecialist(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                  >
                    <option value="Mateo Ramos">Mateo Ramos</option>
                    <option value="Sofía Gómez">Sofía Gómez</option>
                    <option value="David León">David León</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Hora de inicio (Hoy)
                  </label>
                  <input
                    type="time"
                    required
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Precio (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsQuickAppointmentOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-container text-on-primary shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingModal ? "Guardando..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VER FICHA / NOTAS DEL CLIENTE
      ========================================================================== */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">sticky_note_2</span>
                <h3 className="text-base font-bold text-on-surface">
                  Ficha de {noteModal.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoteModal({ isOpen: false, customerName: "", notes: "" })}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-secondary">
                Preferencias y notas de atención:
              </label>
              <textarea
                rows={4}
                value={noteModal.notes}
                onChange={(e) => setNoteModal((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface leading-relaxed outline-none focus:border-primary focus:bg-surface-container-lowest"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => {
                  setNoteModal({ isOpen: false, customerName: "", notes: "" });
                  showToast("Nota guardada en la ficha del cliente.");
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
