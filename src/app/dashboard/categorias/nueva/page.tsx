"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const { currentBusiness } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("service_categories").insert({
        business_id: currentBusiness.id,
        name: name.trim(),
        description: description.trim() || null,
        display_order: Number(displayOrder) || 0,
        is_active: isActive,
      });

      if (error) throw error;
      router.push("/dashboard/categorias");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al crear la categoría");
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
          <Link href="/dashboard/categorias" className="hover:text-[#0b1c30]">
            Categorías
          </Link>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Nueva</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
          Nueva Categoría
        </h1>
        <p className="text-sm text-[#45464c] mt-0.5">
          Crea una agrupación de servicios (ej. Cortes, Barba, Tratamientos, etc.).
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
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cortes Masculinos"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descripción Opcional
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve detalle sobre los servicios que agrupa esta categoría."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Orden de Visualización
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-[#2c4dd6]"
                />
                <span className="text-xs font-semibold text-[#0b1c30]">
                  Categoría Activa
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href="/dashboard/categorias"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#2c4dd6] text-white text-xs font-semibold hover:bg-[#4a68f0] shadow-sm disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
