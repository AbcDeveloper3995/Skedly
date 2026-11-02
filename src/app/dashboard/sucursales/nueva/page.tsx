"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

export default function NuevaSucursalPage() {
  const router = useRouter();
  const { currentBusiness } = useAuth();

  const [name, setName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("locations").insert({
        business_id: currentBusiness.id,
        name: name.trim(),
        address_line: addressLine.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        phone: phone.trim() || null,
        country: "MX",
        is_active: true,
        is_default: false,
      });

      if (error) throw error;
      router.push("/dashboard/sucursales");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al crear la sucursal");
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
          <Link href="/dashboard/sucursales" className="hover:text-[#0b1c30]">
            Sucursales
          </Link>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Nueva</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
          Nueva Sucursal
        </h1>
        <p className="text-sm text-[#45464c] mt-0.5">
          Agrega una nueva sede o punto físico de atención para tu negocio.
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre de la Sucursal *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sucursal Norte"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dirección Física
            </label>
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Calle, número y colonia..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ciudad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Monterrey"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estado / Provincia
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Ej. Nuevo León"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 81 1234 5678"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href="/dashboard/sucursales"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#2c4dd6] text-white text-xs font-semibold hover:bg-[#4a68f0] shadow-sm disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Sucursal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
