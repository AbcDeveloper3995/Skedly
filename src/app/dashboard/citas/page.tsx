"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface AppointmentRow {
  id: string;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  customer_email_snapshot?: string | null;
  internal_notes?: string | null;
  employee?: { display_name: string } | null;
  appointment_services?: Array<{ service_name: string; unit_price: number; duration_minutes?: number }>;
}

function CitasListContent() {
  const router = useRouter();
  const { currentBusiness } = useAuth();

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Load live DB appointments
  const loadAppointments = async (businessId: string) => {
    setLoading(true);
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
          customer_email_snapshot,
          internal_notes,
          employee:employees(display_name),
          appointment_services(service_name, unit_price, duration_minutes)
        `)
        .eq("business_id", businessId)
        .order("start_at", { ascending: false });

      if (!error && data) {
        setAppointments(data as unknown as AppointmentRow[]);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Error loading appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadAppointments(currentBusiness.id);
    } else {
      setAppointments([]);
    }
  }, [currentBusiness]);

  // Status Updater
  const updateStatus = async (
    id: string,
    newStatus: "confirmed" | "cancelled" | "completed" | "no_show"
  ) => {
    try {
      if (currentBusiness?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
      }
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
      const labels = {
        confirmed: "Cita Confirmada",
        completed: "Cita Marcada como Completada",
        cancelled: "Cita Cancelada",
        no_show: "Cita Marcada como No Asistió",
      };
      setActionFeedback(labels[newStatus]);
      setTimeout(() => setActionFeedback(null), 2500);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete cancelled appointment
  const deleteAppointment = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar permanentemente esta cita cancelada? Esta acción no se puede deshacer."
    );
    if (!confirmDelete) return;

    try {
      if (currentBusiness?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        // Also cascade deletes appointment_services
        const { error } = await supabase.from("appointments").delete().eq("id", id);
        if (error) {
          console.error("Error deleting appointment:", error);
          alert(`No se pudo eliminar la cita: ${error.message}`);
          return;
        }
      }

      setAppointments((prev) => prev.filter((app) => app.id !== id));
      setActionFeedback("Cita eliminada permanentemente");
      setTimeout(() => setActionFeedback(null), 2500);
    } catch (err) {
      console.error("Error deleting appointment:", err);
    }
  };

  // Filtered Appointments
  const filtered = useMemo(() => {
    return appointments.filter((app) => {
      const matchesStatus = filterStatus === "all" ? true : app.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const name = (app.customer_name_snapshot || "").toLowerCase();
      const phone = (app.customer_phone_snapshot || "").toLowerCase();
      const staff = ((app.employee as any)?.display_name || "").toLowerCase();
      const service = (app.appointment_services?.[0]?.service_name || "").toLowerCase();
      const idStr = app.id.toLowerCase();

      const matchesSearch =
        name.includes(q) ||
        phone.includes(q) ||
        staff.includes(q) ||
        service.includes(q) ||
        idStr.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, filterStatus, searchQuery]);

  // Counts for Micro HUD
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="flex flex-col gap-6 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-16">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-on-surface text-surface text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold">
            <Link href="/dashboard" className="hover:text-on-surface">
              Inicio
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Citas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Gestión de Citas</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Control de reservas en tiempo real, confirmaciones, reprogramaciones y estado de asistencia.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/dashboard/calendario"
            className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant/30 text-xs font-semibold shadow-sm hover:bg-surface-container transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
            <span>Ver en Calendario</span>
          </Link>
          <Link
            href="/dashboard/citas/nueva"
            className="h-11 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-md hover:bg-primary-container transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Nueva Cita Manual</span>
          </Link>
        </div>
      </div>

      {/* Micro HUD Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Total Reservas</span>
            <span className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">{totalCount}</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">En registro activo</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[20px]">calendar_view_day</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-tertiary tracking-wider">Pendientes</span>
            <span className="text-xl sm:text-2xl font-bold text-tertiary mt-0.5">{pendingCount}</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Requieren aprobación</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Confirmadas</span>
            <span className="text-xl sm:text-2xl font-bold text-primary mt-0.5">{confirmedCount}</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Listas en agenda</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Completadas</span>
            <span className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">{completedCount}</span>
            <span className="text-[11px] text-primary font-semibold mt-0.5">Servicio prestado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        {/* Search & Filter Top Bar */}
        <div className="p-4 bg-surface-container-low/60 border-b border-surface-container-high/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: "all", label: "Todos" },
              { id: "pending", label: "Pendientes", badge: pendingCount > 0 ? pendingCount : null },
              { id: "confirmed", label: "Confirmadas" },
              { id: "completed", label: "Completadas" },
              { id: "cancelled", label: "Canceladas" },
              { id: "no_show", label: "No asistió" },
            ].map((st) => {
              const isSelected = filterStatus === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/30 hover:bg-surface-container"
                  }`}
                >
                  <span>{st.label}</span>
                  {st.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? "bg-on-primary text-primary" : "bg-tertiary-fixed text-tertiary"
                      }`}
                    >
                      {st.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex items-center min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, teléfono o código..."
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-surface-container-lowest text-on-surface text-xs focus:outline-none border border-outline-variant/30 focus:border-primary shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Appointment Rows Container */}
        {filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-[28px]">event_busy</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">No se encontraron citas</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mt-1">
              No hay turnos que coincidan con los filtros seleccionados o la búsqueda realizada.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterStatus("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-high/60">
            {filtered.map((app) => {
              const startDate = new Date(app.start_at);
              const formattedDate = !isNaN(startDate.getTime())
                ? startDate.toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "26 Oct";
              const formattedTime = !isNaN(startDate.getTime())
                ? startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                : "10:15";

              // Generate Clean Human Reservation Code based on UUID or sequence
              const reservationCode = `#SK-${app.id.slice(0, 5).toUpperCase()}`;

              const service = app.appointment_services?.[0] || {
                service_name: "Corte General",
                unit_price: 180,
                duration_minutes: 45,
              };

              const initials = (app.customer_name_snapshot || "C")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              // WhatsApp Link generator
              const rawPhone = (app.customer_phone_snapshot || "").replace(/[^0-9]/g, "");
              const waText = encodeURIComponent(
                `Hola ${app.customer_name_snapshot || ""}, te contactamos de ${
                  currentBusiness?.name || "nuestro local"
                } respecto a tu reserva ${reservationCode} agendada para el ${formattedDate} a las ${formattedTime}.`
              );
              const waLink = rawPhone ? `https://wa.me/${rawPhone}?text=${waText}` : null;

              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 hover:bg-surface-container-low/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Code, Customer info & Service */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Customer Avatar Initials */}
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {initials}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      {/* Top Meta Line: Reservation Code, Customer Name & Status */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Reservation Code Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface font-mono text-[11px] font-bold border border-outline-variant/30 tracking-wider">
                          <span className="material-symbols-outlined text-[13px] text-primary">tag</span>
                          <span>{reservationCode}</span>
                        </span>

                        <span className="text-sm font-bold text-on-surface truncate">
                          {app.customer_name_snapshot || "Cliente Anónimo"}
                        </span>

                        {/* Status Chip */}
                        {app.status === "confirmed" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Confirmada</span>
                          </span>
                        )}
                        {app.status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Pendiente Aprobación</span>
                          </span>
                        )}
                        {app.status === "completed" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                            <span>Completada</span>
                          </span>
                        )}
                        {app.status === "cancelled" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">cancel</span>
                            <span>Cancelada</span>
                          </span>
                        )}
                        {app.status === "no_show" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-bold inline-flex items-center gap-1">
                            <span>No asistió</span>
                          </span>
                        )}
                      </div>

                      {/* Service Details & Client Contacts */}
                      <div className="flex items-center gap-2.5 text-xs text-on-surface-variant flex-wrap mt-1.5">
                        <span className="font-semibold text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-primary">content_cut</span>
                          <span>{service.service_name}</span>
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{service.duration_minutes || 30} min</span>
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-bold text-primary">${service.unit_price} MXN</span>

                        {app.customer_phone_snapshot && (
                          <>
                            <span className="text-outline-variant">•</span>
                            <span className="text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">call</span>
                              <span>{app.customer_phone_snapshot}</span>
                            </span>
                          </>
                        )}

                        {app.customer_email_snapshot && (
                          <>
                            <span className="text-outline-variant">•</span>
                            <span className="text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">mail</span>
                              <span>{app.customer_email_snapshot}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {app.internal_notes && (
                        <p className="text-[11px] text-secondary italic mt-1 line-clamp-1 bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/20 inline-block self-start">
                          Nota: {app.internal_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Scheduled Date & Assigned Specialist */}
                  <div className="flex items-center gap-6 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/20">
                    <div className="flex flex-col text-left lg:text-right min-w-[150px]">
                      <div className="flex items-center lg:justify-end gap-1.5 text-xs font-bold text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                        <span>{formattedDate}</span>
                        <span className="text-primary font-bold">({formattedTime})</span>
                      </div>
                      <div className="flex items-center lg:justify-end gap-1.5 text-[11px] text-secondary mt-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
                        <span className="font-medium text-on-surface">
                          {app.employee?.display_name || "Sin especialista asignado"}
                        </span>
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-[#25D366] flex items-center justify-center transition-colors shadow-sm"
                          title="Contactar vía WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                        </a>
                      )}

                      {app.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(app.id, "confirmed")}
                          className="px-3 h-9 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span>Aceptar</span>
                        </button>
                      )}

                      <Link
                        href={`/dashboard/citas/nueva?mode=reschedule&id=${app.id}`}
                        className="px-3 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                        <span>Reprogramar</span>
                      </Link>

                      {app.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(app.id, "completed")}
                          className="px-3 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Marcar completada"
                        >
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">done</span>
                          <span>Completar</span>
                        </button>
                      )}

                      {app.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(app.id, "cancelled")}
                          className="px-2.5 h-9 rounded-xl hover:bg-red-50 text-secondary hover:text-red-600 text-xs font-medium transition-colors flex items-center gap-1"
                          title="Cancelar cita"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>Cancelar</span>
                        </button>
                      )}

                      {/* Delete permanently if cancelled */}
                      {app.status === "cancelled" && (
                        <button
                          type="button"
                          onClick={() => deleteAppointment(app.id)}
                          className="px-3 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm border border-red-200"
                          title="Eliminar cita definitivamente"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CitasListPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[500px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            <span>Cargando listado de citas...</span>
          </div>
        </div>
      }
    >
      <CitasListContent />
    </Suspense>
  );
}
