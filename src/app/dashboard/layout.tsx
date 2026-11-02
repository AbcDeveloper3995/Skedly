"use client";

import React, { useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, currentBusiness, membership, loading, signOut } = useAuth();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut();
    startTransition(() => {
      router.push("/login");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#4F6DF5]/20 border-t-[#4F6DF5] rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">
            Cargando Skedly...
          </span>
        </div>
      </div>
    );
  }

  const businessDisplayName = currentBusiness?.name || "Mi Negocio";
  const userDisplayName =
    profile?.full_name || user?.email?.split("@")[0] || "Administrador";

  const navItems = [
    { section: "General" },
    { name: "Resumen", path: "/dashboard", icon: "grid_view" },
    { name: "Calendario", path: "/dashboard/calendario", icon: "calendar_today" },
    { name: "Citas", path: "/dashboard/citas", icon: "event_available" },

    { section: "Gestión" },
    { name: "Clientes", path: "/dashboard/clientes", icon: "group" },
    { name: "Empleados", path: "/dashboard/empleados", icon: "badge" },
    { name: "Servicios", path: "/dashboard/servicios", icon: "content_cut" },
    { name: "Categorías", path: "/dashboard/categorias", icon: "category" },

    { section: "Configuración" },
    { name: "Sucursales", path: "/dashboard/sucursales", icon: "apartment" },
    { name: "Horarios", path: "/dashboard/configuracion/horarios", icon: "schedule" },
    { name: "Negocio", path: "/dashboard/configuracion/negocio", icon: "settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      {/* SIDEBAR (250px) */}
      <aside className="fixed left-0 top-0 h-full w-[250px] bg-white border-r border-[#c6c6cd]/30 shadow-sm z-50 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col">
          {/* Brand */}
          <div className="h-[72px] px-6 flex items-center gap-3 border-b border-[#eff4ff]">
            <div className="w-8 h-8 rounded-xl bg-[#2c4dd6] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#2c4dd6]/20">
              SK
            </div>
            <span className="font-bold text-lg text-[#0b1c30] tracking-tight">
              SKEDLY
            </span>
          </div>

          {/* Business Selector Pill */}
          <div className="p-4">
            <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] text-left">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="material-symbols-outlined text-[#2c4dd6] text-xl">
                  store
                </span>
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-semibold text-[#45464c] uppercase tracking-wider">
                    Negocio
                  </span>
                  <span className="text-xs font-bold text-[#0b1c30] truncate">
                    {businessDisplayName}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#76777d] text-base">
                unfold_more
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="px-3 flex flex-col gap-1 pb-4">
            {navItems.map((item, idx) => {
              if (item.section) {
                return (
                  <span
                    key={`sec-${idx}`}
                    className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#76777d]"
                  >
                    {item.section}
                  </span>
                );
              }

              const isActive =
                item.path === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.path!);

              return (
                <Link
                  key={item.path}
                  href={item.path!}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#2c4dd6] text-white shadow-sm"
                      : "text-[#45464c] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <span className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
              Presencia Online
            </span>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#45464c] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all"
            >
              <span className="material-symbols-outlined text-lg">language</span>
              Página de Reservas
            </Link>
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 m-3 bg-[#eff4ff] rounded-xl flex items-center justify-between gap-2 border border-[#dce9ff]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#2c4dd6] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {userDisplayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-[#0b1c30] truncate">
                {userDisplayName}
              </span>
              <span className="text-[10px] text-[#45464c] capitalize truncate">
                {membership?.role || "Owner"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-[#76777d] hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="pl-[250px]">
        {/* TOPBAR */}
        <header className="fixed top-0 left-[250px] right-0 h-[72px] bg-white/85 backdrop-blur-xl border-b border-[#c6c6cd]/30 shadow-[0_1px_8px_rgba(0,0,0,0.02)] z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs text-[#76777d]">
            <Link href="/" className="hover:text-[#0b1c30]">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64 lg:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar cliente, cita, servicio..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#eff4ff] border border-transparent focus:border-[#2c4dd6] text-xs text-[#0b1c30] placeholder-[#76777d] focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[#45464c] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors relative">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2c4dd6]"></span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#2c4dd6] text-white flex items-center justify-center font-bold text-xs">
                {userDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-[#0b1c30] hidden sm:inline">
                {userDisplayName}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="w-full pt-[72px] px-8 py-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
