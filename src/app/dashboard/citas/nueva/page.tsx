"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface EmployeeOption {
  id: string;
  display_name: string;
}

interface LocationOption {
  id: string;
  name: string;
}

export default function NewCitaPage() {
  const router = useRouter();
  const { user, currentBusiness } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness?.id) {
      supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("business_id", currentBusiness.id)
        .eq("is_active", true)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setServices(data);
            setSelectedServiceId(data[0].id);
          }
        });

      supabase
        .from("employees")
        .select("id, display_name")
        .eq("business_id", currentBusiness.id)
        .eq("is_active", true)
        .then(({ data }) => {
          if (data) setEmployees(data);
        });

      supabase
        .from("locations")
        .select("id, name")
        .eq("business_id", currentBusiness.id)
        .eq("is_active", true)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setLocations(data);
            setSelectedLocationId(data[0].id);
          }
        });
    }
  }, [currentBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id || !user?.id) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Create or find customer
      const { data: customerData, error: custErr } = await supabase
        .from("customers")
        .insert({
          business_id: currentBusiness.id,
          full_name: customerName.trim(),
          phone: customerPhone.trim() || null,
          email: customerEmail.trim() || null,
        })
        .select()
        .single();

      if (custErr) throw custErr;

      // 2. Calculate start and end timestamps
      const selectedService = services.find((s) => s.id === selectedServiceId);
      const duration = selectedService?.duration_minutes || 45;
      const startAt = new Date(`${date}T${time}:00Z`).toISOString();
      const endAt = new Date(new Date(startAt).getTime() + duration * 60000).toISOString();

      // 3. Create appointment
      const { data: appointmentData, error: appErr } = await supabase
        .from("appointments")
        .insert({
          business_id: currentBusiness.id,
          customer_id: customerData.id,
          employee_id: selectedEmployeeId || null,
          location_id: selectedLocationId || null,
          status: "confirmed",
          source: "dashboard",
          start_at: startAt,
          end_at: endAt,
          customer_name_snapshot: customerName.trim(),
          customer_phone_snapshot: customerPhone.trim() || null,
          customer_email_snapshot: customerEmail.trim() || null,
          internal_notes: notes.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (appErr) throw appErr;

      // 4. Create appointment service detail
      if (selectedService) {
        await supabase.from("appointment_services").insert({
          business_id: currentBusiness.id,
          appointment_id: appointmentData.id,
          service_id: selectedService.id,
          service_name: selectedService.name,
          unit_price: selectedService.price,
          duration_minutes: selectedService.duration_minutes,
          quantity: 1,
        });
      }

      router.push("/dashboard/calendario");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al agendar la cita. Verifica que no haya solapamiento de horarios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
          <Link href="/dashboard" className="hover:text-[#0b1c30]">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/dashboard/calendario" className="hover:text-[#0b1c30]">
            Calendario
          </Link>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Nueva Cita</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
          Agendar Nueva Cita
        </h1>
        <p className="text-sm text-[#45464c] mt-0.5">
          Registra una cita manual desde el panel operativo con validación de horarios.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] p-6 lg:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Roberto Sánchez"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Servicio a Reservar *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6] bg-white"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${s.price} - {s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Profesional Asignado
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6] bg-white"
              >
                <option value="">Cualquier profesional disponible</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sucursal
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6] bg-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hora de Inicio *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notas Internas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para el profesional o indicaciones especiales..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            ></textarea>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href="/dashboard/calendario"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#2c4dd6] text-white text-xs font-semibold hover:bg-[#4a68f0] shadow-sm disabled:opacity-50"
            >
              {loading ? "Confirmando cita..." : "Crear Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
