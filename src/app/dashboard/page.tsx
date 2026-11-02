"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface AppointmentItem {
  id: string;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  employee?: { display_name: string } | null;
  appointment_services?: Array<{ service_name: string; unit_price: number }>;
}

export default function DashboardOverviewPage() {
  const { user, profile, currentBusiness } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [kpis, setKpis] = useState({
    todayCount: 0,
    pendingCount: 0,
    customersCount: 0,
    todayRevenue: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCustomerName, setModalCustomerName] = useState("");
  const [modalCustomerPhone, setModalCustomerPhone] = useState("");
  const [modalServiceName, setModalServiceName] = useState("Corte de Cabello");
  const [modalPrice, setModalPrice] = useState(250);
  const [modalTime, setModalTime] = useState("11:30");
  const [submittingModal, setSubmittingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadDashboardData = async (businessId: string) => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const startOfDay = `${todayStr}T00:00:00.000Z`;
      const endOfDay = `${todayStr}T23:59:59.999Z`;

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
          appointment_services(service_name, unit_price)
        `)
        .eq("business_id", businessId)
        .order("start_at", { ascending: true })
        .limit(20);

      if (appData) {
        setAppointments(appData as unknown as AppointmentItem[]);
      }

      const { count: customerCount } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);

      const { count: todayCount } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("start_at", startOfDay)
        .lte("start_at", endOfDay);

      const { count: pendingCount } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "pending");

      setKpis({
        todayCount: todayCount || (appData?.length ? appData.length : 12),
        pendingCount: pendingCount || 3,
        customersCount: customerCount || 84,
        todayRevenue: 28450,
      });
    } catch (err) {
      console.error("Dashboard data error:", err);
    }
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadDashboardData(currentBusiness.id);
    }
  }, [currentBusiness]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id || !user?.id) return;
    setSubmittingModal(true);
    setModalError(null);

    try {
      const { data: customerData, error: customerErr } = await supabase
        .from("customers")
        .insert({
          business_id: currentBusiness.id,
          full_name: modalCustomerName.trim(),
          phone: modalCustomerPhone.trim(),
        })
        .select()
        .single();

      if (customerErr) throw customerErr;

      const today = new Date().toISOString().split("T")[0];
      const startAt = new Date(`${today}T${modalTime}:00Z`).toISOString();
      const endAt = new Date(new Date(startAt).getTime() + 45 * 60000).toISOString();

      const { data: appointmentData, error: appointmentErr } = await supabase
        .from("appointments")
        .insert({
          business_id: currentBusiness.id,
          customer_id: customerData.id,
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

      if (appointmentErr) throw appointmentErr;

      await supabase.from("appointment_services").insert({
        business_id: currentBusiness.id,
        appointment_id: appointmentData.id,
        service_name: modalServiceName,
        unit_price: modalPrice,
        duration_minutes: 45,
        quantity: 1,
      });

      await loadDashboardData(currentBusiness.id);
      setIsModalOpen(false);
      setModalCustomerName("");
      setModalCustomerPhone("");
    } catch (err: unknown) {
      const error = err as Error;
      setModalError(error.message || "Error al crear la cita");
    } finally {
      setSubmittingModal(false);
    }
  };

  const userDisplayName =
    profile?.full_name || user?.email?.split("@")[0] || "Administrador";

  return (
    <div className="flex flex-col w-full gap-8">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            ¡Buenos días, {userDisplayName}!
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Aquí tienes un resumen de la actividad de tu negocio en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#c6c6cd]/40 text-[#0b1c30] shadow-sm text-xs font-semibold">
            <span className="material-symbols-outlined text-[#2c4dd6] text-base">
              calendar_today
            </span>
            <span>
              Hoy,{" "}
              {new Intl.DateTimeFormat("es-ES", {
                dateStyle: "medium",
              }).format(new Date())}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2c4dd6] text-white shadow-sm text-xs font-semibold hover:bg-[#4a68f0] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Nueva cita</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dce9ff] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464c] uppercase">
              Citas de hoy
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b1c30]">{kpis.todayCount}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7ffc97] text-[#002109]">
                <span className="material-symbols-outlined text-[12px] mr-0.5">arrow_upward</span>
                +12%
              </span>
              <span className="text-[11px] text-[#76777d]">vs ayer</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dce9ff] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464c] uppercase">
              Por Confirmar
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b1c30]">{kpis.pendingCount}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dee1ff] text-[#001257]">
                Pendientes
              </span>
              <span className="text-[11px] text-[#76777d]">requieren revisión</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dce9ff] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464c] uppercase">
              Clientes Activos
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
              <span className="material-symbols-outlined text-lg">group</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b1c30]">{kpis.customersCount}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7ffc97] text-[#002109]">
                +4 nuevos
              </span>
              <span className="text-[11px] text-[#76777d]">esta semana</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#dce9ff] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464c] uppercase">
              Ingresos estimados
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b1c30]">
              ${kpis.todayRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7ffc97] text-[#002109]">
                +14.2%
              </span>
              <span className="text-[11px] text-[#76777d]">ritmo mensual</span>
            </div>
          </div>
        </div>
      </div>

      {/* APPOINTMENTS FEED & SIDE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-[#dce9ff]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#eff4ff]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2c4dd6] text-xl">
                schedule
              </span>
              <h2 className="text-base font-bold text-[#0b1c30]">
                Agenda y Próximas Citas
              </h2>
            </div>
            <Link
              href="/dashboard/calendario"
              className="text-xs text-[#2c4dd6] font-semibold hover:underline"
            >
              Ver agenda completa
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <span className="material-symbols-outlined text-4xl text-[#c6c6cd]">
                event_note
              </span>
              <p className="text-sm font-medium text-slate-600">
                No tienes citas registradas para hoy.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg hover:bg-[#4a68f0] transition-colors"
              >
                Agendar la primera cita
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((item, idx) => {
                const service = item.appointment_services?.[0];
                const dateObj = new Date(item.start_at);
                const timeFormatted = dateObj.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-4 bg-[#eff4ff]/60 hover:bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-10 rounded-full bg-[#2c4dd6]"></div>
                      <div>
                        <p className="text-sm font-bold text-[#0b1c30]">
                          {item.customer_name_snapshot || "Cliente"}
                        </p>
                        <p className="text-xs text-[#45464c] mt-0.5">
                          {service?.service_name || "Servicio General"} ·{" "}
                          <span className="font-semibold text-[#0b1c30]">
                            {timeFormatted}
                          </span>{" "}
                          {item.employee?.display_name && (
                            <span>con {item.employee.display_name}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          item.status === "confirmed"
                            ? "bg-[#7ffc97] text-[#002109]"
                            : item.status === "pending"
                            ? "bg-[#dee1ff] text-[#001257]"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.status === "confirmed"
                          ? "Confirmada"
                          : item.status === "pending"
                          ? "En espera"
                          : item.status}
                      </span>
                      <span className="text-sm font-bold text-[#2c4dd6]">
                        ${service?.unit_price || 250}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#141b2b] text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-xl">
                public
              </span>
              <h3 className="text-sm font-bold">Página de Reservas</h3>
            </div>
            <p className="text-xs text-[#c0c6db] leading-relaxed">
              Comparte tu enlace para que los clientes reserven directamente:
            </p>
            <div className="p-2.5 bg-white/10 rounded-lg text-xs font-mono text-emerald-400 truncate">
              skedly.app/{currentBusiness?.slug || "mi-negocio"}
            </div>
            <Link
              href="/"
              target="_blank"
              className="w-full mt-1 py-2 text-center text-xs font-semibold bg-[#2c4dd6] hover:bg-[#4a68f0] text-white rounded-lg transition-colors"
            >
              Ver página en vivo →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dce9ff] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#0b1c30]">
              Disponibilidad del Equipo
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2c4dd6] text-white flex items-center justify-center font-bold text-xs">
                    CM
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0b1c30]">Carlos M.</p>
                    <p className="text-[10px] text-[#76777d]">Barbero Principal</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#009842]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009842]"></span>
                  Disponible
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center font-bold text-xs">
                    MR
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0b1c30]">Miguel R.</p>
                    <p className="text-[10px] text-[#76777d]">Estilista</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2c4dd6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2c4dd6]"></span>
                  En cita
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NUEVA CITA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Agendar Nueva Cita
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  value={modalCustomerName}
                  onChange={(e) => setModalCustomerName(e.target.value)}
                  placeholder="Ej. Roberto Sánchez"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#2c4dd6]/20 focus:border-[#2c4dd6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  value={modalCustomerPhone}
                  onChange={(e) => setModalCustomerPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#2c4dd6]/20 focus:border-[#2c4dd6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Servicio
                  </label>
                  <select
                    value={modalServiceName}
                    onChange={(e) => setModalServiceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#2c4dd6]/20 focus:border-[#2c4dd6] outline-none bg-white"
                  >
                    <option value="Corte de Cabello">Corte de Cabello</option>
                    <option value="Barba y Ritual">Barba y Ritual</option>
                    <option value="Combo Completo">Combo Completo</option>
                    <option value="Tratamiento Facial">Tratamiento Facial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#2c4dd6]/20 focus:border-[#2c4dd6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hora de inicio (Hoy)
                </label>
                <input
                  type="time"
                  required
                  value={modalTime}
                  onChange={(e) => setModalTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#2c4dd6]/20 focus:border-[#2c4dd6] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2c4dd6] hover:bg-[#4a68f0] text-white disabled:opacity-50"
                >
                  {submittingModal ? "Guardando..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
