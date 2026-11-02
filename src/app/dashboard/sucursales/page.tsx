"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface LocationItem {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_active: boolean;
  is_default: boolean;
}

export default function SucursalesPage() {
  const { currentBusiness } = useAuth();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLocations = async (businessId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("business_id", businessId)
      .order("is_default", { ascending: false });

    if (data) {
      setLocations(data as LocationItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadLocations(currentBusiness.id);
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
            <span>Configuración</span>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Sucursales</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight mt-1">
            Sucursales y Sedes
          </h1>
          <p className="text-sm text-[#45464c] mt-0.5">
            Administra las ubicaciones físicas de tu negocio donde atienden tus
            profesionales.
          </p>
        </div>

        <Link
          href="/dashboard/sucursales/nueva"
          className="h-10 px-4 rounded-xl bg-[#2c4dd6] text-white text-xs font-semibold shadow-md hover:bg-[#4a68f0] transition-all flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined text-base">add_business</span>
          <span>Nueva Sucursal</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-xs text-slate-400">
            Cargando sucursales...
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-400 bg-white rounded-2xl border border-[#dce9ff]">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd]">
              apartment
            </span>
            <p className="text-sm font-semibold text-slate-600">
              No tienes sucursales registradas.
            </p>
            <Link
              href="/dashboard/sucursales/nueva"
              className="px-4 py-2 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg"
            >
              Crear primera sucursal
            </Link>
          </div>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="p-6 bg-white rounded-2xl shadow-sm border border-[#dce9ff] flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">
                      apartment
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b1c30]">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-[#76777d]">
                      {loc.city ? `${loc.city}, ${loc.state || "MX"}` : "Ubicación Central"}
                    </p>
                  </div>
                </div>

                {loc.is_default && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dee1ff] text-[#001257]">
                    Principal
                  </span>
                )}
              </div>

              {loc.address_line && (
                <div className="flex items-center gap-2 text-xs text-[#45464c]">
                  <span className="material-symbols-outlined text-base text-[#76777d]">
                    location_on
                  </span>
                  <span>{loc.address_line}</span>
                </div>
              )}

              {loc.phone && (
                <div className="flex items-center gap-2 text-xs text-[#45464c]">
                  <span className="material-symbols-outlined text-base text-[#76777d]">
                    call
                  </span>
                  <span>{loc.phone}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#2c4dd6] font-semibold">
                <span>Configurar horarios de sede</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
