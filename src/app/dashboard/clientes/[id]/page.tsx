"use client";

import React, { Suspense, use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  getCustomerById,
  CustomerDetail,
  CustomerInternalNote,
  CustomerAppointment,
} from "@/lib/customers-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

function ClienteDetalleContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currentBusiness } = useAuth();

  // Load customer data
  const baseCustomer = useMemo(() => {
    return getCustomerById(resolvedParams.id);
  }, [resolvedParams.id]);

  const [customer, setCustomer] = useState<CustomerDetail>(baseCustomer);

  // Tabs for history
  const [historyFilter, setHistoryFilter] = useState<"all" | "completed" | "upcoming" | "cancelled">("all");

  // New Note state
  const [newNoteText, setNewNoteText] = useState("");

  // Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(customer.full_name);
  const [editPhone, setEditPhone] = useState(customer.phone);
  const [editEmail, setEditEmail] = useState(customer.email || "");
  const [editTag, setEditTag] = useState<"Recurrente" | "VIP" | "Nuevo">(customer.statusTag);

  // Download toast
  const [downloadNotice, setDownloadNotice] = useState(false);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (historyFilter === "all") return customer.appointments;
    return customer.appointments.filter((a) => a.status === historyFilter);
  }, [customer.appointments, historyFilter]);

  // Appointments counts
  const totalApts = customer.appointments.length;
  const completedApts = customer.appointments.filter((a) => a.status === "completed").length;
  const upcomingApts = customer.appointments.filter((a) => a.status === "upcoming").length;
  const cancelledApts = customer.appointments.filter((a) => a.status === "cancelled").length;

  // Add Note handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const noteItem: CustomerInternalNote = {
      id: `note-${Date.now()}`,
      author: "María Ramos",
      date: "Ahora mismo",
      text: newNoteText.trim(),
    };

    setCustomer((prev) => ({
      ...prev,
      notes: [noteItem, ...prev.notes],
    }));

    setNewNoteText("");
  };

  // Remove Note handler
  const handleDeleteNote = (noteId: string) => {
    setCustomer((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  };

  // Save Edit modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomer((prev) => ({
      ...prev,
      full_name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || null,
      statusTag: editTag,
      isVip: editTag === "VIP",
    }));
    setIsEditModalOpen(false);
  };

  // Download history simulator
  const handleDownloadHistory = () => {
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* DOWNLOAD TOAST */}
      {downloadNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#009842] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Historial descargado en PDF para {customer.full_name}.</span>
        </div>
      )}

      {/* TOP BREADCRUMB & RETURN */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <nav className="flex items-center gap-1.5 text-[#575e70] flex-wrap">
          <Link
            href="/dashboard/clientes"
            className="hover:text-[#2c4dd6] transition-colors flex items-center gap-1 font-semibold text-[#191c1e]"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Volver a Clientes</span>
          </Link>
          <span className="text-[#c4c5d7]">/</span>
          <span>Principal</span>
          <span className="text-[#c4c5d7]">/</span>
          <Link href="/dashboard/clientes" className="hover:text-[#2c4dd6]">
            Clientes
          </Link>
          <span className="text-[#c4c5d7]">/</span>
          <span className="font-semibold text-[#191c1e]">{customer.full_name}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[#dee1ff] text-[#001257] text-[10px] tracking-wide uppercase font-semibold">
            {customer.statusTag === "VIP"
              ? "Cliente VIP"
              : customer.statusTag === "Recurrente"
              ? "Cliente Recurrente"
              : "Nuevo Cliente"}
          </span>
        </nav>
        <div className="flex items-center gap-1.5 text-[#575e70] text-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sincronizado hace 2 min • ID: {customer.code}</span>
        </div>
      </div>

      {/* CLIENT HEADER HERO CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-xs border border-[#e0e3e5]">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#dee1ff]/40 blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Identity & Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-[#2c4dd6] text-white flex items-center justify-center text-2xl font-bold shadow-md tracking-tight">
                {customer.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs">
                <span className="flex w-3.5 h-3.5 rounded-full bg-emerald-500" title="Activo"></span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
                  {customer.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {customer.statusTag} ({customer.appointmentsCount} citas)
                </span>
                {customer.isVip && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    VIP
                  </span>
                )}
              </div>

              {/* Contact meta strip */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[#575e70] text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2c4dd6]">phone</span>
                  <span className="font-semibold text-[#191c1e]">{customer.phone}</span>
                  <a
                    href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-xs"
                    title="Enviar WhatsApp directo"
                  >
                    <span className="material-symbols-outlined text-[13px]">chat</span>
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#747686]">mail</span>
                  <span className="text-[#191c1e]">{customer.email || "Sin correo"}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#575e70]">
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>Registrado: {customer.registeredAt} vía Reserva Web</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <Link
              href={`/dashboard/citas/nueva?clientId=${customer.id}&clientName=${encodeURIComponent(
                customer.full_name
              )}&clientPhone=${encodeURIComponent(customer.phone)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Agendar nueva cita</span>
            </Link>

            <button
              onClick={() => {
                setEditName(customer.full_name);
                setEditPhone(customer.phone);
                setEditEmail(customer.email || "");
                setEditTag(customer.statusTag);
                setIsEditModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Editar datos</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN GRID CONTENT (65% History / 35% Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: History (65%) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-6">
            {/* History Section Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#191c1e]">Historial de Citas</h2>
                <p className="text-xs text-[#575e70]">
                  Registro cronológico de servicios en {currentBusiness?.name || "Urban Cuts"}
                </p>
              </div>

              {/* Tab Pills */}
              <div className="flex items-center p-1 rounded-xl bg-[#f2f4f6] gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setHistoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    historyFilter === "all"
                      ? "bg-white text-[#191c1e] shadow-xs"
                      : "text-[#575e70] hover:text-[#191c1e]"
                  }`}
                >
                  Todas ({totalApts})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("completed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    historyFilter === "completed"
                      ? "bg-white text-[#191c1e] shadow-xs"
                      : "text-[#575e70] hover:text-[#191c1e]"
                  }`}
                >
                  Completadas ({completedApts})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("upcoming")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    historyFilter === "upcoming"
                      ? "bg-white text-[#191c1e] shadow-xs"
                      : "text-[#575e70] hover:text-[#191c1e]"
                  }`}
                >
                  Próximas ({upcomingApts})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("cancelled")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    historyFilter === "cancelled"
                      ? "bg-white text-[#191c1e] shadow-xs"
                      : "text-[#575e70] hover:text-[#191c1e]"
                  }`}
                >
                  Canceladas ({cancelledApts})
                </button>
              </div>
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-[#747686] text-4xl mb-2">
                  event_busy
                </span>
                <span className="text-sm font-semibold text-[#191c1e]">
                  No hay citas en este estado
                </span>
                <span className="text-xs text-[#575e70] mt-0.5">
                  No se encontraron registros que coincidan con el filtro seleccionado.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredAppointments.map((apt) => {
                  const isUpcoming = apt.status === "upcoming";

                  if (isUpcoming) {
                    return (
                      <div
                        key={apt.id}
                        className="relative rounded-2xl bg-gradient-to-r from-[#dee1ff]/30 via-white to-white p-5 shadow-xs border border-[#dee1ff] transition-transform hover:-translate-y-0.5 duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#2c4dd6] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                              <span className="text-[10px] uppercase font-bold leading-tight">
                                {apt.month}
                              </span>
                              <span className="text-base leading-none font-bold">
                                {apt.day}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[#191c1e]">
                                  {apt.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {apt.statusLabel}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#2c4dd6]/10 text-[#2c4dd6] text-[11px] font-semibold">
                                  Próxima cita
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#575e70]">
                                <span className="flex items-center gap-1 text-[#191c1e] font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-[#2c4dd6]">
                                    schedule
                                  </span>
                                  {apt.dateText} ({apt.duration})
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[16px] text-[#747686]">
                                    person
                                  </span>
                                  {apt.professional}
                                </span>
                                <span className="flex items-center gap-1 font-medium text-[#191c1e]">
                                  <span className="material-symbols-outlined text-[16px] text-[#747686]">
                                    payments
                                  </span>
                                  {apt.price} ({apt.paymentMethod})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <Link
                              href="/dashboard/citas"
                              className="px-3 py-1.5 rounded-lg bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold transition-colors"
                            >
                              Ver detalle
                            </Link>
                            <Link
                              href={`/dashboard/citas/nueva?reschedule=true&appointmentId=${apt.id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-xs transition-colors"
                            >
                              Reprogramar
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Completed or past appointments
                  return (
                    <div
                      key={apt.id}
                      className="rounded-xl bg-[#f2f4f6]/70 hover:bg-[#f2f4f6] p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 border border-[#e0e3e5]/40"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-[#e0e3e5] text-[#575e70] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] uppercase font-bold">{apt.month}</span>
                          <span className="text-xs font-extrabold text-[#191c1e]">{apt.day}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#191c1e]">
                              {apt.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#e0e3e5] text-[#575e70] text-[10px] font-semibold">
                              {apt.statusLabel}
                            </span>
                            {apt.isFirst && (
                              <span className="px-1.5 py-0.5 rounded bg-[#dce2f7] text-[#141b2b] text-[10px] font-semibold">
                                Primera Cita
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-[#575e70]">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {apt.dateText} ({apt.duration})
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">badge</span>
                              {apt.professional}
                            </span>
                            <span className="font-medium text-[#191c1e]">
                              {apt.price} • {apt.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Link
                          href="/dashboard/citas"
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#eceef0] text-[#191c1e] text-xs font-semibold transition-colors border border-[#e0e3e5]"
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Studio Activity Footnote Bar */}
          <div className="rounded-2xl bg-[#f2f4f6] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#575e70] border border-[#e0e3e5]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#2c4dd6]">
                auto_graph
              </span>
              <span>
                Gasto acumulado total en el estudio:{" "}
                <strong className="text-[#191c1e]">${customer.totalSpent} MXN</strong> (Promedio por ticket: ${customer.avgTicket} MXN)
              </span>
            </div>
            <button
              onClick={handleDownloadHistory}
              type="button"
              className="text-[#2c4dd6] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Descargar historial</span>
              <span className="material-symbols-outlined text-[14px]">download</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Metrics, Internal Notes & Account Rules (35%) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Metrics Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2c4dd6] text-[20px]">
                  monitoring
                </span>
                <span>Métricas de Cliente</span>
              </h3>
              <span className="text-[11px] text-[#575e70]">Últimos 14 meses</span>
            </div>

            {/* Bento mini-grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#f2f4f6] rounded-xl p-3 flex flex-col">
                <span className="text-[11px] text-[#575e70]">Citas completadas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-[#191c1e]">
                    {customer.completedAppointments}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    de {customer.totalScheduled} agendadas
                  </span>
                </div>
              </div>

              <div className="bg-[#f2f4f6] rounded-xl p-3 flex flex-col">
                <span className="text-[11px] text-[#575e70]">Puntualidad</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-emerald-600">
                    {customer.punctuality}
                  </span>
                  <span className="text-[11px] text-[#575e70]">0 canceladas</span>
                </div>
              </div>

              <div className="col-span-2 bg-[#f2f4f6] rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#575e70]">Profesional preferido</span>
                  <span className="text-xs font-bold text-[#191c1e] mt-0.5">
                    {customer.preferredProfessional}
                  </span>
                  <span className="text-[11px] text-[#2c4dd6] font-semibold">
                    {customer.preferredProfessionalPct}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">content_cut</span>
                </div>
              </div>

              <div className="col-span-2 bg-[#f2f4f6] rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#575e70]">Servicio favorito</span>
                  <span className="text-xs font-bold text-[#191c1e] mt-0.5">
                    {customer.favoriteService}
                  </span>
                  <span className="text-[11px] text-[#575e70]">
                    {customer.favoriteServiceTime}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#d9dff5] text-[#5c6274] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
              </div>
            </div>

            {/* Attendance reliability progress */}
            <div className="p-3 rounded-xl bg-[#dee1ff]/30 flex items-center gap-3 border border-[#dee1ff]/60">
              <svg className="w-11 h-11 shrink-0 -rotate-90 text-[#2c4dd6]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#e0e3e5" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="currentColor"
                  strokeDasharray="88 88"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#191c1e]">Excelente fiabilidad</span>
                <span className="text-[11px] text-[#575e70] leading-snug">
                  Nunca ha registrado faltas sin previo aviso ni cancelaciones tardías.
                </span>
              </div>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2c4dd6] text-[20px]">lock</span>
                <h3 className="text-sm font-bold text-[#191c1e]">Notas Internas</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                Privado
              </span>
            </div>

            {/* Note privacy banner */}
            <div className="p-3 rounded-xl bg-[#f2f4f6] text-[#575e70] flex items-start gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px] text-[#747686] shrink-0 mt-0.5">
                visibility_off
              </span>
              <span>
                Solo visible para el personal de <strong>{currentBusiness?.name || "Urban Cuts"}</strong>. El cliente nunca ve estas notas.
              </span>
            </div>

            {/* Quick Note Form */}
            <form onSubmit={handleAddNote} className="flex flex-col gap-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                placeholder="Escribe una nota sobre preferencias, estilo o detalles del cliente..."
                className="w-full rounded-xl bg-[#f2f4f6] p-3 text-xs text-[#191c1e] placeholder:text-[#747686] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Añadir nota</span>
                </button>
              </div>
            </form>

            {/* Existing Notes List */}
            <div className="flex flex-col gap-2.5">
              {customer.notes.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#747686]">
                  No hay notas internas registradas aún.
                </div>
              ) : (
                customer.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#f2f4f6] flex flex-col gap-1.5 hover:bg-[#e6e8ea] transition-colors"
                  >
                    {note.alert && (
                      <div className="flex items-center gap-1.5 text-rose-700 text-[11px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        <span>Atención estética</span>
                      </div>
                    )}
                    <p className="text-xs text-[#191c1e] leading-snug">{note.text}</p>
                    <div className="flex items-center justify-between pt-1 text-[#575e70] text-[11px]">
                      <span>
                        {note.author} • {note.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-rose-600 hover:underline font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Details & Rules Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2c4dd6] text-[20px]">badge</span>
              <span>Datos y Gestión de Contacto</span>
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#575e70]">Teléfono / WhatsApp</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-[#191c1e] text-sm">{customer.phone}</span>
                  <span className="px-2 py-0.5 rounded bg-[#f2f4f6] text-[10px] text-[#575e70] uppercase font-bold">
                    ID Primario
                  </span>
                </div>
              </div>

              <div className="flex flex-col pt-1">
                <span className="text-[11px] text-[#575e70]">Correo Electrónico</span>
                <span className="font-semibold text-[#191c1e] mt-0.5">
                  {customer.email || "No registrado"}
                </span>
              </div>

              {/* No password explanation */}
              <div className="mt-2 p-3.5 rounded-xl bg-[#dee1ff]/30 text-[#575e70] flex items-start gap-2.5 border border-[#dee1ff]/60">
                <span className="material-symbols-outlined text-[20px] text-[#2c4dd6] shrink-0 mt-0.5">
                  admin_panel_settings
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-[#191c1e]">Sin cuenta de usuario</span>
                  <span className="mt-0.5 leading-relaxed text-[11px]">
                    Contacto gestionado por el negocio. No requiere contraseña ni inicio de sesión. Las confirmaciones y recordatorios se envían directamente por WhatsApp y SMS.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e0e3e5] animate-fade-in flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </div>
                <h3 className="text-base font-bold text-[#191c1e]">Editar Datos del Cliente</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#575e70] hover:bg-[#f2f4f6]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Teléfono / WhatsApp (ID Primario)
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Categoría / Etiqueta de fidelidad
                </label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                >
                  <option value="Recurrente">Cliente Recurrente</option>
                  <option value="VIP">Cliente VIP (Exclusivo)</option>
                  <option value="Nuevo">Cliente Nuevo</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#575e70] hover:bg-[#f2f4f6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-xs"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClienteDetallePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          Cargando perfil del cliente...
        </div>
      }
    >
      <ClienteDetalleContent params={params} />
    </Suspense>
  );
}

