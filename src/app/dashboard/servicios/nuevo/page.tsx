"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface CategoryOption {
  id: string;
  name: string;
}

export default function NuevoServicioPage() {
  const router = useRouter();
  const { currentBusiness } = useAuth();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [price, setPrice] = useState(250);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness?.id) {
      supabase
        .from("service_categories")
        .select("id, name")
        .eq("business_id", currentBusiness.id)
        .then(({ data }) => {
          if (data) setCategories(data);
        });
    }
  }, [currentBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("services").insert({
        business_id: currentBusiness.id,
        category_id: categoryId || null,
        name: name.trim(),
        description: description.trim() || null,
        duration_minutes: Number(durationMinutes) || 30,
        buffer_minutes: Number(bufferMinutes) || 0,
        price: Number(price) || 0,
        is_active: isActive,
      });

      if (error) throw error;
      router.push("/dashboard/servicios");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al crear el servicio");
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
          <Link href="/dashboard/servicios" className="hover:text-[#0b1c30]">
            Servicios
          </Link>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Nuevo</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
          Nuevo Servicio
        </h1>
        <p className="text-sm text-[#45464c] mt-0.5">
          Registra un servicio indicando su nombre, precio y tiempo de duración.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] p-6 lg:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre del Servicio *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Corte Clásico + Barba"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6] bg-white"
            >
              <option value="">Sin categoría asignada</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla lo que incluye este servicio..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Duración (min) *
              </label>
              <input
                type="number"
                min="5"
                step="5"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Buffer (descanso min)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Precio ($) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded text-[#2c4dd6]"
              />
              <span className="text-xs font-semibold text-[#0b1c30]">
                Servicio disponible para reservas
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href="/dashboard/servicios"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#2c4dd6] text-white text-xs font-semibold hover:bg-[#4a68f0] shadow-sm disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
