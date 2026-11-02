"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface AppointmentRow {
  id: string;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  employee?: { display_name: string } | null;
  appointment_services?: Array<{ service_name: string; unit_price: number }>;
}

export default function CitasListPage() {
  const { currentBusiness } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadAppointments = async (businessId: string) => {
    setLoading(true);
    const { data } = await supabase
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
      .order("start_at", { ascending: false });

    if (data) {
      setAppointments(data as unknown as AppointmentRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadAppointments(currentBusiness.id);
    }
  }, [currentBusiness]);

  const updateStatus = async (id: string, newStatus: "confirmed" | "cancelled" | "completed") => {
    await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
    if (currentBusiness?.id) {
      loadAppointments(currentBusiness.id);
    }
  };

  const filtered = appointments.filter((app) => {
    if (filterStatus === "all") return true;
    return app.status === filterStatus;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
            <Link href="/dashboard" className="hover:text-[#0b1c30]">
              Inicio
            </Link>
            <span>/</span>
            <span>General</span>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Citas</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight mt-1">
            Gestión de Citas
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Listado completo de reservas, estado de confirmación y cobro.
          </p>
        </div>

        <Link
          href="/dashboard/citas/nueva"
          className="h-10 px-4 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-md hover:bg-[#4a68f0] transition-all flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Nueva Cita</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] overflow-hidden">
        <div className="p-4 border-b border-[#eff4ff] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === st
                    ? "bg-[#2c4dd6] text-white shadow-sm"
                    : "text-[#45464c] hover:bg-[#eff4ff]"
                }`}
              >
                {st === "all" ? "Todas" : st === "pending" ? "Pendientes" : st === "confirmed" ? "Confirmadas" : st === "completed" ? "Completadas" : "Canceladas"}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#76777d]">
            {filtered.length} citas registradas
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-xs text-slate-400">
            Cargando citas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd]">
              event_busy
            </span>
            <p className="text-sm font-semibold text-slate-600">
              No hay citas con este filtro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#45464c] font-semibold border-b border-[#dce9ff]">
                <tr>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Servicio</th>
                  <th className="py-3.5 px-4">Profesional</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff4ff]">
                {filtered.map((item) => {
                  const dateStr = new Date(item.start_at).toLocaleString("es-ES", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });

                  return (
                    <tr key={item.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0b1c30]">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#0b1c30]">
                          {item.customer_name_snapshot || "Cliente"}
                        </p>
                        <p className="text-[11px] text-[#76777d]">
                          {item.customer_phone_snapshot || "Sin teléfono"}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[#45464c]">
                        {item.appointment_services?.[0]?.service_name || "Servicio"}
                      </td>
                      <td className="py-3 px-4 text-[#45464c]">
                        {item.employee?.display_name || "Sin asignar"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === "confirmed"
                              ? "bg-[#7ffc97] text-[#002109]"
                              : item.status === "pending"
                              ? "bg-[#dee1ff] text-[#001257]"
                              : item.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== "confirmed" && (
                            <button
                              onClick={() => updateStatus(item.id, "confirmed")}
                              className="px-2 py-1 bg-[#dee1ff] text-[#001257] hover:bg-[#b9c3ff] rounded font-semibold text-[10px]"
                            >
                              Confirmar
                            </button>
                          )}
                          {item.status !== "completed" && (
                            <button
                              onClick={() => updateStatus(item.id, "completed")}
                              className="px-2 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded font-semibold text-[10px]"
                            >
                              Completar
                            </button>
                          )}
                          {item.status !== "cancelled" && (
                            <button
                              onClick={() => updateStatus(item.id, "cancelled")}
                              className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded font-semibold text-[10px]"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
