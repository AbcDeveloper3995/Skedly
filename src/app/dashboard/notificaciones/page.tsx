"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";

interface NotificationLog {
  id: string;
  timestamp: string;
  relativeTime: string;
  recipientName: string;
  recipientRole: "Cliente" | "Empleado" | "Negocio";
  recipientEmail: string;
  avatar: string;
  avatarBg: string;
  type: string;
  typeIcon: string;
  appointmentId: string;
  serviceName: string;
  status: "Entregada" | "Pendiente" | "Fallida";
  statusCode?: string;
  subject: string;
  phone?: string;
  errorCode?: string;
  errorMessage?: string;
}

const INITIAL_LOGS: NotificationLog[] = [];

const TEMPLATES = [
  {
    id: "confirmacion_cliente",
    name: "Confirmación de reserva (Cliente)",
    subject: "Tu cita en {{business_name}} está confirmada - #{{appointment_id}}",
    preheader: "Preparamos todo para tu llegada. Revisa los detalles de tu turno.",
    heading: "¡Tu cita está confirmada!",
    body: "Hola, {{customer_name}}.\n\nTu cita en {{business_name}} ha sido confirmada con éxito. Nuestro equipo te estará esperando con la estación lista. Recuerda que no necesitas crear cuentas ni contraseñas con Skedly.",
  },
  {
    id: "solicitud_pendiente",
    name: "Solicitud pendiente de aprobación",
    subject: "Recibimos tu solicitud de cita en {{business_name}}",
    preheader: "Tu turno está siendo revisado por el equipo.",
    heading: "Solicitud en proceso de validación",
    body: "Hola, {{customer_name}}.\n\nHemos recibido tu solicitud de cita para {{service_name}}. Te notificaremos tan pronto como nuestro profesional confirme la disponibilidad en agenda.",
  },
  {
    id: "recordatorio_24h",
    name: "Recordatorio de cita 24h",
    subject: "Recordatorio: Tu cita en {{business_name}} es mañana",
    preheader: "Te esperamos mañana para tu servicio.",
    heading: "Te recordamos tu próxima visita",
    body: "Hola, {{customer_name}}.\n\nTe recordamos que tienes una cita programada para mañana a las {{appointment_time}} hrs con {{employee_name}}.",
  },
  {
    id: "cita_cancelada",
    name: "Cita cancelada",
    subject: "Tu cita en {{business_name}} ha sido cancelada",
    preheader: "Tu turno ha sido liberado de la agenda.",
    heading: "Aviso de cancelación de cita",
    body: "Hola, {{customer_name}}.\n\nTu cita programada para {{appointment_date}} ha sido cancelada. Si deseas agendar nuevamente en otro horario libre, puedes hacerlo en nuestra página de reservas.",
  },
  {
    id: "cita_reprogramada",
    name: "Cita reprogramada",
    subject: "Tu cita en {{business_name}} ha sido reprogramada",
    preheader: "Hemos actualizado tu nuevo horario.",
    heading: "Nuevo horario confirmado",
    body: "Hola, {{customer_name}}.\n\nTu cita ha sido actualizada para el día {{appointment_date}} a las {{appointment_time}} hrs.",
  },
];

function NotificacionesContent() {
  const { currentBusiness } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"preferences" | "templates" | "history">("preferences");

  // Notifications Preferences State
  const [bizEmail, setBizEmail] = useState(currentBusiness?.email || "");
  const [notifyStaff, setNotifyStaff] = useState(true);

  useEffect(() => {
    if (currentBusiness?.email) {
      setBizEmail(currentBusiness.email);
    }
  }, [currentBusiness]);

  // Business Triggers
  const [tNewBookingBiz, setTNewBookingBiz] = useState(true);
  const [tPendingBiz, setTPendingBiz] = useState(true);
  const [tCancelBiz, setTCancelBiz] = useState(true);
  const [tRescheduleBiz, setTRescheduleBiz] = useState(true);
  const [tDailySummaryBiz, setTDailySummaryBiz] = useState(false);

  // Client Triggers
  const [tConfirmClient, setTConfirmClient] = useState(true);
  const [tPendingClient, setTPendingClient] = useState(true);
  const [tApprovedClient, setTApprovedClient] = useState(true);
  const [tCancelClient, setTCancelClient] = useState(true);
  const [tRescheduleClient, setTRescheduleClient] = useState(true);
  const [tReminderClient, setTReminderClient] = useState(true);
  const [remind24h, setRemind24h] = useState(true);
  const [remind2h, setRemind2h] = useState(true);

  // Templates State
  const [selectedTemplateId, setSelectedTemplateId] = useState("confirmacion_cliente");
  const activeTemplate = useMemo(() => {
    return (
      TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0]
    );
  }, [selectedTemplateId]);

  const [tplSubject, setTplSubject] = useState(activeTemplate.subject);
  const [tplPreheader, setTplPreheader] = useState(activeTemplate.preheader);
  const [tplHeading, setTplHeading] = useState(activeTemplate.heading);
  const [tplBody, setTplBody] = useState(activeTemplate.body);
  const [tplDevice, setTplDevice] = useState<"desktop" | "mobile">("desktop");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includeMaps, setIncludeMaps] = useState(true);

  // When template selection changes, update inputs
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = TEMPLATES.find((t) => t.id === id);
    if (found) {
      setTplSubject(found.subject);
      setTplPreheader(found.preheader);
      setTplHeading(found.heading);
      setTplBody(found.body);
    }
  };

  // Insert token chip into body
  const handleInsertToken = (token: string) => {
    setTplBody((prev) => prev + " " + token);
  };

  // History State
  const [logs, setLogs] = useState<NotificationLog[]>(INITIAL_LOGS);
  const [historySearch, setHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todas" | "Entregada" | "Pendiente" | "Fallida">("Todas");
  const [selectedDrawerLog, setSelectedDrawerLog] = useState<NotificationLog | null>(null);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Save changes handler
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMsg("¡Preferencias de notificaciones guardadas exitosamente!");
      setTimeout(() => setToastMsg(null), 3000);
    }, 600);
  };

  // CSV Export for Logs
  const handleExportCSV = () => {
    const headers = ["ID", "Fecha", "Destinatario", "Rol", "Email", "Tipo", "Cita", "Estado"];
    const rows = logs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.recipientName}"`,
      l.recipientRole,
      `"${l.recipientEmail}"`,
      `"${l.type}"`,
      `"${l.appointmentId}"`,
      l.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encoded;
    link.download = `skedly_notificaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg("Archivo CSV de notificaciones exportado.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.recipientName.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.recipientEmail.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.appointmentId.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.type.toLowerCase().includes(historySearch.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter !== "Todas" && log.status !== statusFilter) return false;
      return true;
    });
  }, [logs, historySearch, statusFilter]);

  // Preview body interpolation
  const previewRenderedBody = useMemo(() => {
    return tplBody
      .replace(/{{customer_name}}/g, "David Soria Gómez")
      .replace(/{{business_name}}/g, currentBusiness?.name || "Urban Cuts Grooming Studio")
      .replace(/{{service_name}}/g, "Corte Premium")
      .replace(/{{employee_name}}/g, "Carlos Ramírez")
      .replace(/{{appointment_date}}/g, "Miércoles 25 Octubre 2025")
      .replace(/{{appointment_time}}/g, "11:45")
      .replace(/{{appointment_duration}}/g, "60 min")
      .replace(/{{business_phone}}/g, "+52 55 9123 4567")
      .replace(/{{business_address}}/g, "Colima 152, Roma Norte, CDMX");
  }, [tplBody, currentBusiness]);

  return (
    <div className="flex flex-col gap-6 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-16">
      {/* TOAST FEEDBACK */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#009842] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#2c4dd6] uppercase tracking-wider">
              Ajustes del Sistema
            </span>
            <span className="text-[#c4c5d7]">•</span>
            <span className="text-[11px] text-[#575e70] font-semibold">
              {currentBusiness?.name || "Urban Cuts Grooming Studio"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
            Notificaciones
          </h1>
          <p className="text-xs sm:text-sm text-[#575e70] max-w-2xl">
            Gestiona qué eventos por correo electrónico y avisos se envían a tu equipo y a tus clientes con cada movimiento de citas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSave}
            disabled={isSaving}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSaving ? "hourglass_top" : "check_circle"}
            </span>
            <span>{isSaving ? "Guardando..." : "Guardar cambios"}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 p-1.5 bg-[#f2f4f6] rounded-2xl min-w-max border border-[#e0e3e5]/60">
          <button
            onClick={() => setActiveTab("preferences")}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "preferences"
                ? "bg-white text-[#2c4dd6] shadow-xs"
                : "text-[#575e70] hover:text-[#191c1e] hover:bg-white/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Preferencias y canales</span>
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-white text-[#2c4dd6] shadow-xs"
                : "text-[#575e70] hover:text-[#191c1e] hover:bg-white/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span>Plantillas de correo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#dee1ff] text-[#2c4dd6] text-[10px] font-bold">
              {TEMPLATES.length} activas
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "bg-white text-[#2c4dd6] shadow-xs"
                : "text-[#575e70] hover:text-[#191c1e] hover:bg-white/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Historial de notificaciones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#dee1ff] text-[#2c4dd6] text-[10px] font-bold">
              428
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PREFERENCIAS Y DISPARADORES
      ========================================================================== */}
      {activeTab === "preferences" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Zero friction banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[#dee1ff]/40 p-4 sm:p-5 border border-[#dee1ff] flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2c4dd6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">forward_to_inbox</span>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#191c1e]">
                    Cero fricción para tus clientes
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#2c4dd6] text-[10px] font-bold shadow-xs">
                    Automático
                  </span>
                </div>
                <p className="text-xs text-[#575e70] mt-0.5 leading-snug">
                  Los clientes no necesitan crear cuenta ni iniciar sesión para recibir correos; se envía automáticamente al correo proporcionado en la reserva pública.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 text-xs text-[#191c1e] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sin contraseñas</span>
              </div>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Negocio y Equipo (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#dce2f7] text-[#575e70] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">store</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#191c1e]">Negocio y Equipo</span>
                      <span className="text-[11px] text-[#575e70]">Recepción interna de avisos</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#f2f4f6] text-[#2c4dd6] text-[10px] font-bold">
                    Transaccional
                  </span>
                </div>

                {/* Email Destination Config */}
                <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#f2f4f6]">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#191c1e] flex items-center justify-between">
                      <span>Correo de recepción principal</span>
                      <span className="text-[10px] text-[#575e70]">Obligatorio</span>
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-xs border border-[#e0e3e5]">
                      <span className="material-symbols-outlined text-[#747686] text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        value={bizEmail}
                        onChange={(e) => setBizEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#191c1e] outline-none"
                      />
                    </div>
                  </label>
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyStaff}
                      onChange={(e) => setNotifyStaff(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#2c4dd6] accent-[#2c4dd6]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Enviar copia al barbero/empleado asignado
                      </span>
                      <span className="text-[10px] text-[#575e70]">
                        Aplica si el miembro del staff cuenta con email verificado en su perfil.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Business triggers */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#575e70] font-bold">
                    Disparadores del negocio
                  </span>

                  {/* Trigger 1 */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#191c1e]">
                          Nueva reserva recibida
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <p className="text-[11px] text-[#575e70]">
                        Notifica de inmediato cada vez que un cliente reserva con éxito.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tNewBookingBiz}
                      onChange={(e) => setTNewBookingBiz(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Trigger 2 */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#191c1e]">
                          Nueva solicitud pendiente
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                          Prioritario
                        </span>
                      </div>
                      <p className="text-[11px] text-[#575e70]">
                        Alerta prioritaria si el negocio opera con aprobación manual de citas.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tPendingBiz}
                      onChange={(e) => setTPendingBiz(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Trigger 3 */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Reserva cancelada por cliente
                      </span>
                      <p className="text-[11px] text-[#575e70]">
                        Libera el turno en agenda y avisa al equipo para reasignar el sillón.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tCancelBiz}
                      onChange={(e) => setTCancelBiz(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Trigger 4 */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Reserva reprogramada
                      </span>
                      <p className="text-[11px] text-[#575e70]">
                        Informa del cambio de fecha/hora solicitado por el usuario.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tRescheduleBiz}
                      onChange={(e) => setTRescheduleBiz(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Trigger 5 */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#f2f4f6]/60">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#191c1e]">
                          Resumen matutino diario
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-white text-[#575e70] text-[9px] font-bold">
                          Opcional
                        </span>
                      </div>
                      <p className="text-[11px] text-[#575e70]">
                        Envía a las 08:00 AM el consolidado de citas del día.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tDailySummaryBiz}
                      onChange={(e) => setTDailySummaryBiz(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Notifications (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">person_check</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#191c1e]">
                        Notificaciones para Clientes
                      </span>
                      <span className="text-[11px] text-[#575e70]">Correos directos al usuario</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Sin login requerido
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Item 1 */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#191c1e]">
                          Confirmación instantánea de reserva
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#dee1ff] text-[#2c4dd6] text-[10px] font-bold">
                          Incluye .ics
                        </span>
                      </div>
                      <p className="text-[11px] text-[#575e70]">
                        Se envía de inmediato con los datos del turno y archivo adjunto compatible con Google Calendar, Apple Calendar y Outlook.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tConfirmClient}
                      onChange={(e) => setTConfirmClient(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Aviso de solicitud recibida (Pendiente de aprobación)
                      </span>
                      <p className="text-[11px] text-[#575e70]">
                        Informa al cliente que su solicitud está en revisión antes de ser confirmada definitivamente.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tPendingClient}
                      onChange={(e) => setTPendingClient(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Confirmación tras aprobación manual
                      </span>
                      <p className="text-[11px] text-[#575e70]">
                        Avisa al cliente en cuanto el barbero o administrador valida su turno en el panel.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tApprovedClient}
                      onChange={(e) => setTApprovedClient(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Aviso de cancelación de cita
                      </span>
                      <p className="text-[11px] text-[#575e70]">
                        Notificación clara con motivo y botón para volver a agendar en otro horario libre.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tCancelClient}
                      onChange={(e) => setTCancelClient(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-[#f2f4f6] transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Aviso de reprogramación de turno
                      </span>
                      <p className="text-[11px] text-[#575e70]">
                        Muestra el horario anterior vs. el nuevo horario confirmado.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tRescheduleClient}
                      onChange={(e) => setTRescheduleClient(e.target.checked)}
                      className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                    />
                  </div>

                  {/* Item 6: Recordatorio de cita previa */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#f2f4f6]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#191c1e]">
                            Recordatorio de cita previa
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Alta efectividad
                          </span>
                        </div>
                        <p className="text-[11px] text-[#575e70]">
                          Reduce hasta un 42% el no-show y citas olvidadas sin esfuerzo manual.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={tReminderClient}
                        onChange={(e) => setTReminderClient(e.target.checked)}
                        className="w-4 h-4 accent-[#2c4dd6] rounded mt-1 shrink-0"
                      />
                    </div>

                    {tReminderClient && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#e0e3e5]/60">
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e0e3e5] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={remind24h}
                            onChange={(e) => setRemind24h(e.target.checked)}
                            className="w-4 h-4 accent-[#2c4dd6] rounded"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#191c1e]">24 horas antes</span>
                            <span className="text-[10px] text-[#575e70]">Recomendado</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e0e3e5] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={remind2h}
                            onChange={(e) => setRemind2h(e.target.checked)}
                            className="w-4 h-4 accent-[#2c4dd6] rounded"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#191c1e]">2 horas antes</span>
                            <span className="text-[10px] text-[#575e70]">Aviso el mismo día</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="w-full rounded-2xl bg-white p-5 shadow-xs border border-[#e0e3e5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] text-[#2c4dd6] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#191c1e]">
                    Proveedor de infraestructura de correo
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Dominio Verificado
                  </span>
                </div>
                <p className="text-xs text-[#575e70] mt-0.5">
                  Conexión activa mediante canal transaccional con certificados SPF, DKIM y DMARC firmados para mail.skedly.io.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Servicio operativo • 99.98% entrega</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PLANTILLAS DE CORREO Y EDITOR
      ========================================================================== */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Left Column: Template Selection & Inputs (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Template Selector Card */}
            <div className="p-5 bg-white rounded-2xl shadow-xs border border-[#e0e3e5] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2c4dd6] text-[18px]">
                    dynamic_form
                  </span>
                  <span>Plantilla seleccionada</span>
                </label>
                <span className="text-[11px] text-[#575e70]">
                  {TEMPLATES.length} plantillas configuradas
                </span>
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#f2f4f6] text-xs font-semibold text-[#191c1e] outline-none cursor-pointer border border-transparent focus:border-[#2c4dd6] focus:bg-white transition-all"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editor Canvas Form */}
            <div className="p-5 bg-white rounded-2xl shadow-xs border border-[#e0e3e5] flex flex-col gap-4">
              {/* Asunto */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#191c1e]">Asunto del correo</label>
                <input
                  type="text"
                  value={tplSubject}
                  onChange={(e) => setTplSubject(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                />
              </div>

              {/* Preencabezado */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#191c1e]">
                  Preencabezado / Subtítulo
                </label>
                <input
                  type="text"
                  value={tplPreheader}
                  onChange={(e) => setTplPreheader(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                />
              </div>

              {/* Título principal */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#191c1e]">Título principal</label>
                <input
                  type="text"
                  value={tplHeading}
                  onChange={(e) => setTplHeading(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                />
              </div>

              {/* Cuerpo del mensaje */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#191c1e]">
                    Cuerpo del mensaje
                  </label>
                  <span className="text-[10px] text-[#575e70]">Texto enriquecido</span>
                </div>
                <textarea
                  rows={5}
                  value={tplBody}
                  onChange={(e) => setTplBody(e.target.value)}
                  className="p-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Variable Chips */}
              <div className="p-3.5 bg-[#f2f4f6] rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#191c1e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#2c4dd6]">
                      data_object
                    </span>
                    <span>Variables dinámicas disponibles</span>
                  </span>
                  <span className="text-[10px] text-[#575e70]">Clic para insertar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "{{customer_name}}",
                    "{{business_name}}",
                    "{{service_name}}",
                    "{{employee_name}}",
                    "{{appointment_date}}",
                    "{{appointment_time}}",
                    "{{appointment_duration}}",
                    "{{business_phone}}",
                    "{{business_address}}",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => handleInsertToken(token)}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-[#dee1ff] text-[#2c4dd6] text-[10px] font-mono font-semibold shadow-xs border border-[#e0e3e5] transition-all"
                    >
                      + {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional toggles */}
              <div className="flex flex-col gap-2 pt-1 border-t border-[#eceef0]">
                <span className="text-xs font-semibold text-[#191c1e]">
                  Elementos complementarios
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#575e70]">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="w-4 h-4 accent-[#2c4dd6] rounded"
                  />
                  <span>Incluir logotipo del estudio en la cabecera</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#575e70]">
                  <input
                    type="checkbox"
                    checked={includeCalendar}
                    onChange={(e) => setIncludeCalendar(e.target.checked)}
                    className="w-4 h-4 accent-[#2c4dd6] rounded"
                  />
                  <span>Incluir botón &apos;Añadir a Google / Apple Calendar&apos; (.ics)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#575e70]">
                  <input
                    type="checkbox"
                    checked={includeMaps}
                    onChange={(e) => setIncludeMaps(e.target.checked)}
                    className="w-4 h-4 accent-[#2c4dd6] rounded"
                  />
                  <span>Incluir dirección y enlace a Google Maps</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Email Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl shadow-xs border border-[#e0e3e5]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2c4dd6] animate-pulse"></span>
                <span className="text-xs font-bold text-[#191c1e]">Simulador de correo</span>
              </div>
              <div className="flex items-center bg-[#f2f4f6] p-1 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => setTplDevice("desktop")}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                    tplDevice === "desktop"
                      ? "bg-white text-[#2c4dd6] shadow-xs"
                      : "text-[#575e70]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                  <span>Escritorio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTplDevice("mobile")}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                    tplDevice === "mobile"
                      ? "bg-white text-[#2c4dd6] shadow-xs"
                      : "text-[#575e70]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">smartphone</span>
                  <span>Móvil</span>
                </button>
              </div>
            </div>

            {/* Email Frame */}
            <div
              className={`bg-white rounded-2xl shadow-md border border-[#e0e3e5] overflow-hidden flex flex-col transition-all duration-300 ${
                tplDevice === "mobile" ? "max-w-[340px] mx-auto" : "w-full"
              }`}
            >
              {/* Envelope Bar */}
              <div className="px-4 py-3 bg-[#f2f4f6] flex flex-col gap-1 border-b border-[#e0e3e5]">
                <div className="flex items-center justify-between text-[#575e70] text-[11px]">
                  <span className="font-semibold text-[#191c1e]">
                    Urban Cuts &lt;citas@skedly.com&gt;
                  </span>
                  <span>Hoy, 10:24</span>
                </div>
                <div className="text-[11px] text-[#575e70]">
                  Para: <strong>david.soria@ejemplo.com</strong>
                </div>
                <div className="text-xs font-bold text-[#191c1e] mt-0.5 truncate">
                  {tplSubject
                    .replace(/{{business_name}}/g, currentBusiness?.name || "Urban Cuts")
                    .replace(/{{appointment_id}}/g, "UC-84920")}
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-5 flex flex-col gap-4">
                {/* Logo Header */}
                {includeLogo && (
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#eceef0]">
                    <div className="w-8 h-8 rounded-lg bg-[#2c4dd6] text-white flex items-center justify-center font-bold text-xs">
                      UC
                    </div>
                    <span className="text-xs font-bold text-[#191c1e]">
                      {currentBusiness?.name || "Urban Cuts Grooming Studio"}
                    </span>
                  </div>
                )}

                <h3 className="text-sm font-bold text-[#191c1e]">{tplHeading}</h3>

                <p className="text-xs text-[#575e70] whitespace-pre-line leading-relaxed">
                  {previewRenderedBody}
                </p>

                {/* Appointment Card inside Email */}
                <div className="p-3.5 rounded-xl bg-[#f2f4f6] flex flex-col gap-2 border border-[#e0e3e5]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#191c1e]">Corte Premium</span>
                    <span className="text-xs font-bold text-[#2c4dd6]">$350 MXN</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-[#575e70]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      <span>Miércoles 25 Octubre 2025, 11:45 hrs (60 min)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      <span>Carlos Ramírez (Barbero asignado)</span>
                    </div>
                    {includeMaps && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>Colima 152, Roma Norte, CDMX</span>
                      </div>
                    )}
                  </div>
                </div>

                {includeCalendar && (
                  <div className="pt-1 flex justify-center">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-xs"
                    >
                      Añadir a Google / Apple Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: HISTORIAL Y REGISTRO DE ENVÍOS
      ========================================================================== */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Header Buttons Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#191c1e]">Auditoría de Envíos</h2>
              <p className="text-xs text-[#575e70]">
                Historial cronológico y estado de entrega de todos los correos transaccionales.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#f2f4f6] text-[#191c1e] text-xs font-semibold border border-[#e0e3e5] shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Exportar registro (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedDrawerLog(logs.find((l) => l.status === "Fallida") || logs[0])
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                <span>Incidencias críticas (1)</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards (4 Bento Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#e0e3e5] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#575e70] uppercase tracking-wider">
                  Total enviadas
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">outbox</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#191c1e]">428</span>
                  <span className="text-xs text-[#575e70]">correos</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
                  +18% vs mes anterior
                </span>
              </div>
            </div>

            {/* Entregadas */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#e0e3e5] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#575e70] uppercase tracking-wider">
                  Entregadas
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#191c1e]">
                    {logs.filter((l) => l.status === "Entregada").length}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    entregadas
                  </span>
                </div>
              </div>
            </div>

            {/* Pendientes */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#e0e3e5] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#575e70] uppercase tracking-wider">
                  Pendientes en cola
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#191c1e]">
                    {logs.filter((l) => l.status === "Pendiente").length}
                  </span>
                  <span className="text-xs text-amber-700 font-medium">en tránsito</span>
                </div>
              </div>
            </div>

            {/* Fallidas */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-rose-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  Envíos fallidos
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">error_outline</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-rose-700">
                    {logs.filter((l) => l.status === "Fallida").length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e0e3e5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por destinatario, tipo o ID de cita..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-[#f2f4f6] rounded-xl gap-1 overflow-x-auto">
              {(["Todas", "Entregada", "Pendiente", "Fallida"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-white text-[#191c1e] shadow-xs"
                      : "text-[#575e70] hover:text-[#191c1e]"
                  }`}
                >
                  {st === "Todas"
                    ? `Todas (${logs.length})`
                    : st === "Entregada"
                    ? `Entregadas (${logs.filter((l) => l.status === "Entregada").length})`
                    : st === "Pendiente"
                    ? `Pendientes (${logs.filter((l) => l.status === "Pendiente").length})`
                    : `Fallidas (${logs.filter((l) => l.status === "Fallida").length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e0e3e5] overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f2f4f6] text-[#575e70] text-[11px] font-semibold uppercase tracking-wider border-b border-[#e0e3e5]">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4">Tipo de Notificación</th>
                    <th className="py-3 px-4">Cita Asociada</th>
                    <th className="py-3 px-4">Estado de Entrega</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#575e70]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[32px] text-[#747686]">
                            mark_email_unread
                          </span>
                          <p className="font-semibold text-[#191c1e]">
                            No hay registros de notificaciones
                          </p>
                          <p className="text-[11px] text-[#575e70] max-w-sm">
                            El historial de correos enviados a clientes y miembros del equipo aparecerá
                            aquí automáticamente cuando se gestionen citas en la plataforma.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-[#f2f4f6]/60 transition-colors ${
                        log.status === "Fallida" ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* Fecha */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#747686]">
                            schedule
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#191c1e]">
                              {log.timestamp}
                            </span>
                            <span className="text-[10px] text-[#575e70]">{log.relativeTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* Destinatario */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full ${log.avatarBg} flex items-center justify-center font-bold text-xs shrink-0`}
                          >
                            {log.avatar}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#191c1e]">
                                {log.recipientName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-[#f2f4f6] text-[#575e70] text-[9px] font-bold">
                                {log.recipientRole}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#575e70] truncate max-w-[180px]">
                              {log.recipientEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#2c4dd6]">
                            {log.typeIcon}
                          </span>
                          <span className="text-xs font-medium text-[#191c1e]">{log.type}</span>
                        </div>
                      </td>

                      {/* Cita */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#2c4dd6]">
                            {log.appointmentId}
                          </span>
                          <span className="text-[11px] text-[#575e70] truncate max-w-[150px]">
                            {log.serviceName}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.status === "Entregada" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px]">
                              check_circle
                            </span>
                            Entregada
                          </span>
                        ) : log.status === "Pendiente" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px] animate-spin">
                              progress_activity
                            </span>
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            Fallida ({log.statusCode || "550"})
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDrawerLog(log)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#f2f4f6] hover:bg-[#eceef0] text-[#191c1e] text-xs font-medium transition-colors"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-3 bg-[#f2f4f6]/60 border-t border-[#e0e3e5] flex items-center justify-between text-xs text-[#575e70]">
              <span>
                Mostrando <strong className="text-[#191c1e]">{filteredLogs.length}</strong> de{" "}
                <strong className="text-[#191c1e]">{logs.length}</strong> registros
              </span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-[#2c4dd6] text-white font-bold text-[11px]">
                  1
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-[#575e70] font-medium text-[11px]">
                  2
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-[#575e70] font-medium text-[11px]">
                  3
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER LATERAL DE INSPECCIÓN DE NOTIFICACIÓN
      ========================================================================== */}
      {selectedDrawerLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Header */}
            <div className="p-5 bg-[#f2f4f6] flex items-start justify-between gap-3 border-b border-[#e0e3e5]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedDrawerLog.status === "Fallida"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {selectedDrawerLog.status === "Fallida" ? "Error Crítico" : "Notificación Entregada"}
                  </span>
                  <span className="text-xs text-[#575e70]">
                    ID: <code>{selectedDrawerLog.id}</code>
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#191c1e] mt-1">
                  Detalle de notificación {selectedDrawerLog.id}
                </h3>
                <span className="text-[11px] text-[#575e70]">{selectedDrawerLog.timestamp}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrawerLog(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#eceef0] flex items-center justify-center text-[#575e70]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col gap-4">
              {/* Error box if failed */}
              {selectedDrawerLog.status === "Fallida" && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-600 text-[22px] shrink-0 mt-0.5">
                    report_problem
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-rose-800">
                      Error de entrega (Rebote duro / 550 User Unknown)
                    </span>
                    <p className="text-xs text-rose-700 mt-0.5 leading-snug">
                      {selectedDrawerLog.errorMessage ||
                        "El servidor de destino rechazó la entrega. La dirección de correo no existe."}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#f2f4f6] flex flex-col">
                  <span className="text-[10px] text-[#575e70] uppercase font-bold">Tipo</span>
                  <span className="font-semibold text-[#191c1e] mt-0.5">
                    {selectedDrawerLog.type}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#f2f4f6] flex flex-col">
                  <span className="text-[10px] text-[#575e70] uppercase font-bold">Canal</span>
                  <span className="font-semibold text-[#191c1e] mt-0.5">Correo (HTML)</span>
                </div>

                <div className="col-span-2 p-3 rounded-xl bg-[#f2f4f6] flex flex-col">
                  <span className="text-[10px] text-[#575e70] uppercase font-bold">Destinatario</span>
                  <span className="font-bold text-[#191c1e] mt-0.5">
                    {selectedDrawerLog.recipientName} ({selectedDrawerLog.recipientRole})
                  </span>
                  <span className="text-xs text-[#575e70]">{selectedDrawerLog.recipientEmail}</span>
                </div>

                <div className="col-span-2 p-3 rounded-xl bg-[#f2f4f6] flex flex-col">
                  <span className="text-[10px] text-[#575e70] uppercase font-bold">Cita Vinculada</span>
                  <span className="font-bold text-[#2c4dd6] mt-0.5">
                    {selectedDrawerLog.appointmentId} · {selectedDrawerLog.serviceName}
                  </span>
                </div>

                <div className="col-span-2 p-3 rounded-xl bg-[#f2f4f6] flex flex-col">
                  <span className="text-[10px] text-[#575e70] uppercase font-bold">Asunto Enviado</span>
                  <span className="font-medium text-[#191c1e] mt-0.5 italic">
                    &quot;{selectedDrawerLog.subject}&quot;
                  </span>
                </div>
              </div>

              {/* Recommended Solution */}
              {selectedDrawerLog.phone && (
                <div className="p-4 rounded-xl bg-[#dee1ff]/30 border border-[#dee1ff] flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2c4dd6]">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    <span>Contacto directo de respaldo</span>
                  </div>
                  <p className="text-xs text-[#575e70] leading-snug">
                    Comunícate con el cliente a su teléfono{" "}
                    <strong className="text-[#191c1e]">{selectedDrawerLog.phone}</strong> para validar su dirección de correo o resolver cualquier consulta.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${selectedDrawerLog.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#f2f4f6] text-[#191c1e] text-xs font-semibold inline-flex items-center gap-1 shadow-xs border border-[#e0e3e5]"
                    >
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">call</span>
                      <span>Llamar</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedDrawerLog.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#f2f4f6] border-t border-[#e0e3e5] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedDrawerLog(null)}
                className="px-4 py-2 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-xs"
              >
                Cerrar detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          Cargando configuración de notificaciones...
        </div>
      }
    >
      <NotificacionesContent />
    </Suspense>
  );
}

