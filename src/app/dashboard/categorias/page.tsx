"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export default function CategoriasPage() {
  const { currentBusiness } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async (businessId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("service_categories")
      .select("*")
      .eq("business_id", businessId)
      .order("display_order", { ascending: true });

    if (data) {
      setCategories(data as CategoryItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadCategories(currentBusiness.id);
    }
  }, [currentBusiness]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
            <Link href="/dashboard" className="hover:text-[#0b1c30]">
              Inicio
            </Link>
            <span>/</span>
            <span>Gestión</span>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Categorías</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight mt-1">
            Categorías de Servicios
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Organiza tus servicios en grupos temáticos para que tus clientes
            encuentren lo que buscan más rápido.
          </p>
        </div>

        <Link
          href="/dashboard/categorias/nueva"
          className="h-10 px-4 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-md hover:bg-[#4a68f0] transition-all flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Nueva Categoría</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center text-xs text-slate-400">
            Cargando categorías...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd]">
              category
            </span>
            <p className="text-sm font-semibold text-slate-600">
              No tienes categorías configuradas.
            </p>
            <Link
              href="/dashboard/categorias/nueva"
              className="px-4 py-2 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg"
            >
              Crear primera categoría
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#eff4ff]">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-5 flex items-center justify-between hover:bg-[#f8f9ff] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">
                      category
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b1c30]">{cat.name}</h3>
                    <p className="text-xs text-[#76777d] mt-0.5">
                      {cat.description || "Sin descripción"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      cat.is_active
                        ? "bg-[#7ffc97] text-[#002109]"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat.is_active ? "Activa" : "Inactiva"}
                  </span>
                  <span className="text-xs text-[#45464c] font-mono">
                    Orden: {cat.display_order}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
