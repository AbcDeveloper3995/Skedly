"use client";

import React, { useEffect, useTransition, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { DashboardViewProvider, useDashboardView } from "./view-context";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, currentBusiness, membership, loading, signOut } = useAuth();
  const [, startTransition] = useTransition();
  const {
    viewMode,
    setViewMode,
    setIsQuickAppointmentOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    employeeName,
  } = useDashboardView();

  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-secondary font-medium tracking-wide">
            Cargando Skedly...
          </span>
        </div>
      </div>
    );
  }

  const businessDisplayName = currentBusiness?.name || "Barbería Élite Central";
  const userDisplayName =
    profile?.full_name || user?.email?.split("@")[0] || "María Ramos";
  const initials = userDisplayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navGroups = [
    {
      title: "Principal",
      items: [
        { name: "Inicio", path: "/dashboard", icon: "grid_view" },
        { name: "Calendario", path: "/dashboard/calendario", icon: "today" },
        { name: "Citas", path: "/dashboard/citas", icon: "event_available" },
        { name: "Clientes", path: "/dashboard/clientes", icon: "group" },
      ],
    },
    {
      title: "Gestión del Negocio",
      items: [
        { name: "Servicios", path: "/dashboard/servicios", icon: "content_cut" },
        { name: "Categorías", path: "/dashboard/categorias", icon: "category" },
        { name: "Equipo de trabajo", path: "/dashboard/empleados", icon: "badge" },
      ],
    },
    {
      title: "Presencia Online",
      items: [
        { name: "Página de reservas", path: "/", icon: "storefront", external: true },
        { name: "Sucursales", path: "/dashboard/sucursales", icon: "apartment" },
      ],
    },
    {
      title: "Configuración",
      items: [
        { name: "Configuración del negocio", path: "/dashboard/configuracion", icon: "tune" },
        { name: "Horarios", path: "/dashboard/configuracion/horarios", icon: "schedule" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
      {/* =========================================================================
          DESKTOP SIDEBAR (w-72)
      ========================================================================== */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex-col justify-between select-none border-r border-surface-container">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between flex-shrink-0 border-b border-surface-container/60">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              <span className="font-semibold text-base text-on-surface tracking-tight">
                Skedly
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] uppercase tracking-wider font-semibold">
              Business
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navGroups.map((group) => (
              <nav key={group.title} className="space-y-1">
                <p className="px-3 pb-1 text-[11px] text-secondary uppercase font-semibold tracking-wider">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const isActive =
                    item.path === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.path) && item.path !== "/";

                  if (item.external) {
                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        target="_blank"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container hover:text-on-surface transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px] text-secondary">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                        <span className="material-symbols-outlined text-[14px] text-outline ml-auto">
                          open_in_new
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                          : "text-on-surface-variant font-medium hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isActive ? "text-on-primary-container" : "text-secondary"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            ))}
          </div>

          {/* Bottom Profile Card */}
          <div className="p-3 bg-surface-container-low border-t border-surface-container">
            <div className="p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-surface-container">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-on-primary font-semibold text-xs shadow-sm">
                    {initials || "SK"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">
                      {userDisplayName}
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      {businessDisplayName}
                    </p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold shrink-0">
                  {viewMode === "owner" ? "Propietario" : "Colaborador"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                <Link
                  href="/dashboard/configuracion"
                  className="flex items-center gap-1 text-[11px] text-secondary hover:text-on-surface transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[15px]">settings</span>
                  Ajustes
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[11px] text-error hover:text-on-error-container transition-colors font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          DESKTOP TOPBAR HEADER (fixed top-0 left-72 right-0)
      ========================================================================== */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 items-center justify-between px-6 border-b border-surface-container">
        <div className="flex items-center gap-4">
          {/* Business Selector Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm border border-surface-container hover:bg-surface-container cursor-pointer transition-all">
            <span className="material-symbols-outlined text-primary text-[20px]">store</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-on-surface leading-tight">
                {businessDisplayName}
              </span>
              <span className="text-[10px] text-secondary leading-none">
                Sede Central
              </span>
            </div>
            <span className="material-symbols-outlined text-secondary text-[18px]">expand_more</span>
          </div>

          <div className="h-5 w-px bg-outline-variant/40"></div>

          {/* View Switcher Toggle: Propietario / Admin vs Empleado */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg border border-surface-container-high/60">
            <button
              type="button"
              onClick={() => setViewMode("owner")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "owner"
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              Vista Propietario / Admin
            </button>
            <button
              type="button"
              onClick={() => setViewMode("employee")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "employee"
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              Vista Empleado ({employeeName})
            </button>
          </div>

          {/* Quick Search */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary border border-surface-container">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar citas, clientes..."
              className="bg-transparent text-xs text-on-surface placeholder-secondary outline-none w-36 focus:w-52 transition-all"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] text-secondary font-semibold">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Topbar Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-medium shadow-sm border border-surface-container hover:bg-surface-container transition-all"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">open_in_new</span>
            <span>Ver página pública</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface shadow-sm border border-surface-container transition-all cursor-pointer"
              title="Notificaciones"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface"></span>
          </div>

          {/* Nueva Cita Action */}
          <button
            type="button"
            onClick={() => setIsQuickAppointmentOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs font-semibold shadow-sm hover:bg-primary transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Nueva cita</span>
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold shadow-sm">
            {initials}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOPBAR (visible on < lg)
      ========================================================================== */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container">
        <div className="h-16 px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-secondary uppercase font-semibold leading-none">
                Skedly
              </span>
              <span className="text-sm font-semibold text-on-surface truncate leading-tight">
                {businessDisplayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View switcher pill on mobile */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "owner" ? "employee" : "owner")}
              className="px-2 py-1 rounded-lg bg-surface-container text-[11px] font-semibold text-secondary hover:text-on-surface"
              title="Cambiar vista"
            >
              {viewMode === "owner" ? "Admin" : "Empleado"}
            </button>

            <button
              type="button"
              aria-label="Notificaciones"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors relative text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
            </button>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          PAGE CONTENT WRAPPER
      ========================================================================== */}
      <div className="lg:pl-72 flex-1 flex flex-col">
        <main className="w-full pt-16 pb-24 lg:pb-12 bg-surface flex-1">
          {children}
        </main>
      </div>

      {/* =========================================================================
          MOBILE FLOATING ACTION BUTTON (Visible on < lg)
      ========================================================================== */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsQuickAppointmentOpen(true)}
          className="inline-flex items-center gap-1.5 h-12 pl-4 pr-5 rounded-full bg-primary-container text-on-primary-container shadow-[0_4px_16px_rgba(74,104,240,0.36)] hover:bg-primary transition-all active:scale-95 font-semibold text-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>+ Cita</span>
        </button>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (Fixed at bottom on < lg)
      ========================================================================== */}
      <nav className="lg:hidden fixed bottom-0 w-full z-50 bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-surface-container">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors ${
              pathname === "/dashboard"
                ? "text-primary font-semibold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-[11px]">Inicio</span>
          </Link>
          <Link
            href="/dashboard/calendario"
            className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors ${
              pathname.startsWith("/dashboard/calendario")
                ? "text-primary font-semibold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            <span className="text-[11px]">Calendario</span>
          </Link>
          <Link
            href="/dashboard/citas"
            className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors ${
              pathname.startsWith("/dashboard/citas")
                ? "text-primary font-semibold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">event_available</span>
            <span className="text-[11px]">Citas</span>
          </Link>
          <Link
            href="/dashboard/clientes"
            className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors ${
              pathname.startsWith("/dashboard/clientes")
                ? "text-primary font-semibold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">group</span>
            <span className="text-[11px]">Clientes</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors ${
              isMobileMenuOpen
                ? "text-primary font-semibold"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
            <span className="text-[11px]">Menú</span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          MOBILE DRAWER MODAL (When clicking "Menú" on mobile)
      ========================================================================== */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-surface-container-lowest rounded-t-2xl p-5 shadow-2xl border-t border-surface-container max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface">Menú Completo</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold">
                  {viewMode === "owner" ? "Propietario" : "Colaborador"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Mode Toggle in Drawer */}
            <div className="p-2 bg-surface-container rounded-xl flex items-center justify-between">
              <span className="text-xs text-secondary font-medium">Modo de pantalla:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("owner")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    viewMode === "owner"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("employee")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    viewMode === "employee"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  Empleado
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/dashboard/servicios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-xs font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">content_cut</span>
                <span>Servicios</span>
              </Link>
              <Link
                href="/dashboard/categorias"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-xs font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">category</span>
                <span>Categorías</span>
              </Link>
              <Link
                href="/dashboard/empleados"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-xs font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">badge</span>
                <span>Equipo</span>
              </Link>
              <Link
                href="/dashboard/sucursales"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-xs font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">apartment</span>
                <span>Sucursales</span>
              </Link>
              <Link
                href="/dashboard/configuracion"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-xs font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                <span>Configuración</span>
              </Link>
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-xs font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">storefront</span>
                <span>Página pública</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-surface-container flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-error-container text-on-error-container font-semibold text-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardViewProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardViewProvider>
  );
}
