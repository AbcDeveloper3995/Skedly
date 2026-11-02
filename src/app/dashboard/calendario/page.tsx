"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface AppointmentFull {
  id: string;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  employee?: { display_name: string } | null;
  appointment_services?: Array<{ service_name: string; unit_price: number }>;
}

export default function CalendarPage() {
  const { currentBusiness } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split("T")[0]);

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
      .order("start_at", { ascending: true });

    if (data) {
      setAppointments(data as unknown as AppointmentFull[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadAppointments(currentBusiness.id);
    }
  }, [currentBusiness]);

  const dayAppointments = appointments.filter((app) =>
    app.start_at.startsWith(selectedDay)
  );

  const hours = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
            <Link href="/dashboard" className="hover:text-[#0b1c30]">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Calendario</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight mt-1">
            Calendario de Citas
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Visualiza los turnos, horarios y distribución de citas de tu equipo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#dce9ff] text-xs font-semibold text-[#0b1c30] shadow-sm outline-none"
          />
          <Link
            href="/dashboard/citas/nueva"
            className="h-10 px-4 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-md hover:bg-[#4a68f0] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Nueva Cita</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#eff4ff]">
          <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2c4dd6]">
              schedule
            </span>
            <span>
              Agenda para el día:{" "}
              {new Date(selectedDay + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </h2>
          <span className="text-xs text-[#76777d]">
            {dayAppointments.length} citas programadas
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-xs text-slate-400">
            Cargando agenda...
          </div>
        ) : (
          <div className="space-y-4">
            {hours.map((hour) => {
              const matchingApps = dayAppointments.filter((app) => {
                const appTime = new Date(app.start_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return appTime.startsWith(hour.slice(0, 2));
              });

              return (
                <div
                  key={hour}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#f8f9ff] transition-colors border-b border-[#eff4ff]/60"
                >
                  <div className="w-16 font-mono text-xs font-bold text-[#76777d] pt-1">
                    {hour}
                  </div>
                  <div className="flex-1">
                    {matchingApps.length === 0 ? (
                      <span className="text-xs text-[#c6c6cd] italic">
                        Franja libre
                      </span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {matchingApps.map((app) => (
                          <div
                            key={app.id}
                            className="p-3 bg-[#eff4ff] border border-[#dce9ff] rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-[#0b1c30]">
                                {app.customer_name_snapshot || "Cliente"}
                              </p>
                              <p className="text-[11px] text-[#45464c]">
                                {app.appointment_services?.[0]?.service_name || "Servicio"} ·{" "}
                                {app.employee?.display_name && `con ${app.employee.display_name}`}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                app.status === "confirmed"
                                  ? "bg-[#7ffc97] text-[#002109]"
                                  : "bg-[#dee1ff] text-[#001257]"
                              }`}
                            >
                              {app.status === "confirmed" ? "Confirmada" : app.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
