"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface DaySchedule {
  weekday: number;
  name: string;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

const defaultDays = [
  { weekday: 1, name: "Lunes", is_available: true, start_time: "09:00", end_time: "19:00" },
  { weekday: 2, name: "Martes", is_available: true, start_time: "09:00", end_time: "19:00" },
  { weekday: 3, name: "Miércoles", is_available: true, start_time: "09:00", end_time: "19:00" },
  { weekday: 4, name: "Jueves", is_available: true, start_time: "09:00", end_time: "19:00" },
  { weekday: 5, name: "Viernes", is_available: true, start_time: "09:00", end_time: "20:00" },
  { weekday: 6, name: "Sábado", is_available: true, start_time: "09:00", end_time: "18:00" },
  { weekday: 0, name: "Domingo", is_available: false, start_time: "10:00", end_time: "14:00" },
];

export default function ConfiguracionHorariosPage() {
  const { currentBusiness } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultDays);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (currentBusiness?.id) {
      supabase
        .from("working_hours")
        .select("*")
        .eq("business_id", currentBusiness.id)
        .is("employee_id", null)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const mapped = defaultDays.map((d) => {
              const found = data.find((row) => row.weekday === d.weekday);
              if (found) {
                return {
                  ...d,
                  is_available: found.is_available,
                  start_time: found.start_time.slice(0, 5),
                  end_time: found.end_time.slice(0, 5),
                };
              }
              return d;
            });
            setSchedule(mapped);
          }
        });
    }
  }, [currentBusiness]);

  const handleToggle = (index: number) => {
    const updated = [...schedule];
    updated[index].is_available = !updated[index].is_available;
    setSchedule(updated);
  };

  const handleTimeChange = (index: number, field: "start_time" | "end_time", val: string) => {
    const updated = [...schedule];
    updated[index][field] = val;
    setSchedule(updated);
  };

  const handleSave = async () => {
    if (!currentBusiness?.id) return;
    setSaving(true);
    setSuccessMsg(false);

    try {
      // Upsert working hours
      for (const day of schedule) {
        await supabase.from("working_hours").upsert(
          {
            business_id: currentBusiness.id,
            weekday: day.weekday,
            is_available: day.is_available,
            start_time: day.start_time + ":00",
            end_time: day.end_time + ":00",
          },
          { onConflict: "business_id,weekday" }
        );
      }
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error("Save schedule error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
          <Link href="/dashboard" className="hover:text-[#0b1c30]">
            Inicio
          </Link>
          <span>/</span>
          <span>Configuración</span>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Horarios</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
          Horarios de Atención
        </h1>
        <p className="text-sm text-[#45464c] mt-0.5">
          Configura los días de trabajo y las franjas horarias habilitadas para reservas.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] p-6 lg:p-8">
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>¡Horarios guardados correctamente en la base de datos!</span>
          </div>
        )}

        <div className="space-y-4">
          {schedule.map((day, idx) => (
            <div
              key={day.weekday}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#eff4ff]/60 border border-[#dce9ff]/60 gap-3"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={day.is_available}
                  onChange={() => handleToggle(idx)}
                  className="h-4 w-4 rounded text-[#2c4dd6]"
                />
                <span className="text-xs font-bold text-[#0b1c30] w-24">
                  {day.name}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    day.is_available
                      ? "bg-[#7ffc97] text-[#002109]"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {day.is_available ? "Abierto" : "Cerrado"}
                </span>
              </div>

              {day.is_available ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.start_time}
                    onChange={(e) => handleTimeChange(idx, "start_time", e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none bg-white"
                  />
                  <span className="text-xs text-slate-400">a</span>
                  <input
                    type="time"
                    value={day.end_time}
                    onChange={(e) => handleTimeChange(idx, "end_time", e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none bg-white"
                  />
                </div>
              ) : (
                <span className="text-xs text-[#76777d] italic">
                  No se aceptan reservas
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="pt-6 mt-6 flex justify-end border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg hover:bg-[#4a68f0] shadow-sm disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Horarios"}
          </button>
        </div>
      </div>
    </div>
  );
}
