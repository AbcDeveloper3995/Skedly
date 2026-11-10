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
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (currentBusiness?.id) {
        const { error } = await supabase.from("service_categories").insert({
          business_id: currentBusiness.id,
          name: name.trim(),
          description: description.trim() || null,
          display_order: Number(displayOrder) || 1,
          is_active: isActive,
        });

        if (error) throw error;
      }
      router.push("/dashboard/categorias");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al crear la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-1 font-semibold">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/dashboard/categorias" className="hover:text-primary transition-colors">
              Categorías
            </Link>
            <span>/</span>
            <span className="text-on-surface font-bold">Nueva</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Nueva Categoría de Servicios
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Agrupa tus servicios en secciones como Cortes, Barba o Tratamientos.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface">
                Nombre de la categoría <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Cortes de cabello"
                className="h-10 px-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-colors"
              />
              <span className="text-[10px] text-on-surface-variant">
                Se mostrará como sección principal en tu catálogo público.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface">
                Descripción <span className="text-outline font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve explicación para orientar al cliente al momento de agendar..."
                className="p-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Prioridad / Orden</label>
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="h-10 px-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 justify-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="text-xs text-on-surface font-semibold">Visible en web</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-container">
              <Link
                href="/dashboard/categorias"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? "Guardando..." : "Crear Categoría"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
