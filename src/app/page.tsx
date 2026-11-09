"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [selectedStaff, setSelectedStaff] = useState<"mateo" | "sofia" | "cualquiera">("mateo");

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed pb-20 md:pb-0">
      {/* ========================================== */}
      {/* HEADER / NAVIGATION (Desktop & Mobile)     */}
      {/* ========================================== */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-base tracking-wider shadow-sm">
                SK
              </div>
              <span className="font-bold text-xl tracking-tight text-on-surface">
                Skedly
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant">
              <a
                href="#producto"
                className="text-primary font-semibold hover:text-primary transition-colors"
              >
                Producto
              </a>
              <a
                href="#caracteristicas"
                className="hover:text-on-surface transition-colors"
              >
                Características
              </a>
              <a
                href="#como-funciona"
                className="hover:text-on-surface transition-colors"
              >
                Cómo funciona
              </a>
              <a
                href="#beneficios"
                className="hover:text-on-surface transition-colors"
              >
                Beneficios
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3.5 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-primary text-on-primary font-medium text-sm px-4 sm:px-5 py-2 rounded-lg hover:bg-primary-container transition-all shadow-sm"
            >
              Crear mi cuenta
            </Link>
            <Link
              href="/login"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary md:hidden"
              aria-label="Perfil de usuario"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-surface">
        {/* ========================================== */}
        {/* 1. HERO SECTION                            */}
        {/* ========================================== */}
        <section
          id="producto"
          className="relative w-full pt-10 pb-16 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-surface to-surface-container-low"
        >
          {/* Subtle architectural ambient glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[420px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-96 -right-24 w-80 h-80 bg-tertiary-fixed/30 rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Header & Value Proposition */}
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 md:mb-14">
              {/* Pill Badge Superior */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs sm:text-sm font-medium shadow-sm mb-6 transition-all hover:bg-secondary-container">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Plataforma SaaS para negocios de servicios · Gestión integral de citas</span>
              </div>

              {/* Titular Exacto */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold text-on-surface tracking-tight leading-[1.15] mb-5">
                Tu negocio organizado.
                <br />
                <span className="text-primary">Tus citas bajo control.</span>
              </h1>

              {/* Subtítulo Exacto */}
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
                Gestiona tus servicios, empleados y reservas desde un solo lugar. Dale a tus clientes una forma sencilla de reservar online, sin complicaciones.
              </p>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-container hover:-translate-y-0.5 transition-all"
                >
                  <span>Comenzar gratis</span>
                  <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                </Link>
                <a
                  href="#como-funciona"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-white text-on-surface font-semibold text-sm shadow-sm border border-surface-container-high hover:bg-surface-container transition-colors"
                >
                  <span>Conocer cómo funciona</span>
                  <span className="material-symbols-outlined ml-1.5 text-[18px] text-on-surface-variant">expand_more</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-on-surface-variant text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  <span>Sin tarjeta requerida</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-outline-variant" />
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
                  <span>Activo en 5 minutos</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-outline-variant" />
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                  <span>Soporte en español</span>
                </div>
              </div>
            </div>

            {/* Connecting Visual Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs sm:text-sm font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                <span>Tu panel privado gestiona todo · Tus clientes reservan en segundos</span>
              </div>
            </div>

            {/* SHOWCASE INTERACTIVO DOBLE VISTA */}
            <div className="relative max-w-6xl mx-auto">
              {/* 1. Panel Administrativo Skedly (Vista Escritorio & Tablet) */}
              <div className="w-full bg-white rounded-2xl shadow-xl border border-surface-container-high overflow-hidden p-5 sm:p-7 md:p-8">
                {/* Top Window Bar */}
                <div className="flex flex-wrap items-center justify-between pb-5 mb-6 bg-surface-container-low rounded-xl px-4 py-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-on-surface-variant font-mono text-xs hidden sm:inline-block">
                      app.skedly.com/admin/agenda
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center gap-1.5 text-on-surface text-xs font-semibold bg-white px-2.5 py-1 rounded-md shadow-xs border border-surface-container-high">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Barbería Elite • Sucursal Central
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      notifications
                    </span>
                  </div>
                </div>

                {/* Métricas en Tiempo Real (3 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-surface-container-high/60">
                    <div>
                      <span className="text-xs text-on-surface-variant block font-medium">14 Citas para hoy</span>
                      <span className="text-lg sm:text-xl font-bold text-on-surface">14 reservadas</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                      <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-surface-container-high/60">
                    <div>
                      <span className="text-xs text-on-surface-variant block font-medium">94% Asistencia</span>
                      <span className="text-lg sm:text-xl font-bold text-on-surface">+6% vs semana ant.</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                      <span className="material-symbols-outlined text-[20px] text-secondary">how_to_reg</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-surface-container-high/60">
                    <div>
                      <span className="text-xs text-on-surface-variant block font-medium">3 Profesionales activos</span>
                      <span className="text-lg sm:text-xl font-bold text-on-surface">100% operativos</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                      <span className="material-symbols-outlined text-[20px] text-tertiary">badge</span>
                    </div>
                  </div>
                </div>

                {/* Work Area: Timeline & Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Timeline de Citas de Hoy */}
                  <div className="lg:col-span-8 bg-white border border-surface-container-high rounded-xl p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-on-surface">
                          Agenda en Vivo — Hoy
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
                          En tiempo real
                        </span>
                      </div>
                      <div className="flex gap-1.5 text-xs font-medium">
                        <button className="px-2.5 py-1 rounded bg-primary text-on-primary font-medium">Día</button>
                        <button className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-medium">Semana</button>
                      </div>
                    </div>

                    {/* Listado de citas */}
                    <div className="space-y-3">
                      {/* Item 1 */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-right w-14 sm:w-16">
                            <span className="font-bold text-sm text-on-surface block tabular-nums">10:00</span>
                            <span className="text-[11px] text-on-surface-variant">45 min</span>
                          </div>
                          <div className="w-1 h-8 rounded-full bg-primary" />
                          <div>
                            <span className="font-semibold text-sm text-on-surface block">Carlos Mendoza</span>
                            <span className="text-xs text-on-surface-variant">
                              Corte Degradado + Barba • Atiende: <strong className="text-on-surface">Mateo R.</strong>
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          En curso
                        </span>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-right w-14 sm:w-16">
                            <span className="font-bold text-sm text-on-surface block tabular-nums">11:00</span>
                            <span className="text-[11px] text-on-surface-variant">30 min</span>
                          </div>
                          <div className="w-1 h-8 rounded-full bg-tertiary" />
                          <div>
                            <span className="font-semibold text-sm text-on-surface block">Rodrigo Salinas</span>
                            <span className="text-xs text-on-surface-variant">
                              Perfilado de Barba • Atiende: <strong className="text-on-surface">Sofía G.</strong>
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          Confirmada
                        </span>
                      </div>

                      {/* Item 3 */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-right w-14 sm:w-16">
                            <span className="font-bold text-sm text-on-surface block tabular-nums">11:45</span>
                            <span className="text-[11px] text-on-surface-variant">60 min</span>
                          </div>
                          <div className="w-1 h-8 rounded-full bg-amber-500" />
                          <div>
                            <span className="font-semibold text-sm text-on-surface block">Alejandro Peña</span>
                            <span className="text-xs text-on-surface-variant">
                              Ritual Spa Capilar • Atiende: <strong className="text-on-surface">Mateo R.</strong>
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Pendiente
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico Reservas de la Semana */}
                  <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-4 sm:p-5 flex flex-col justify-between border border-surface-container-high/60">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-on-surface">Reservas Semanales</span>
                        <span className="text-xs text-primary font-bold">+18%</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-4">Total: 78 reservas confirmadas</p>

                      {/* Bar Chart Visual */}
                      <div className="h-32 w-full flex items-end justify-between gap-2 pt-4 px-2">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-primary-fixed rounded-t-sm h-14" />
                          <span className="text-[11px] text-on-surface-variant font-medium">L</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-primary-fixed rounded-t-sm h-20" />
                          <span className="text-[11px] text-on-surface-variant font-medium">M</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-primary-fixed rounded-t-sm h-16" />
                          <span className="text-[11px] text-on-surface-variant font-medium">X</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-primary-container rounded-t-sm h-28" />
                          <span className="text-[11px] text-on-surface font-bold">J</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-primary rounded-t-sm h-24" />
                          <span className="text-[11px] text-on-surface-variant font-medium">V</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-primary-fixed rounded-t-sm h-32" />
                          <span className="text-[11px] text-on-surface-variant font-medium">S</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Servicio estrella:</span>
                      <span className="font-semibold text-on-surface">Corte Clásico (41%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Página Pública Móvil Flotante Superpuesta (Desktop) */}
              <div className="hidden lg:block absolute -bottom-10 -right-6 w-80 bg-white rounded-2xl shadow-2xl p-4 border border-surface-container-high transform translate-y-4 hover:translate-y-2 transition-all">
                <div className="bg-surface rounded-xl p-3 border border-surface-container-high/60">
                  {/* Simulated Browser URL Bar */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-md text-on-surface-variant text-[11px] mb-3 shadow-xs border border-surface-container-high">
                    <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
                    <span className="truncate font-mono">skedly.com/barberia-elite</span>
                  </div>

                  {/* Header Negocio */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-surface-container-high">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed text-sm">
                      BE
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-on-surface block truncate">Barbería Elite</span>
                      <span className="text-[11px] text-on-surface-variant">Reserva online directa</span>
                    </div>
                  </div>

                  {/* Servicio Selector Card */}
                  <div className="p-3 bg-white rounded-lg shadow-xs border border-surface-container-high mb-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-on-surface">Corte &amp; Barba</span>
                      <span className="text-xs font-bold text-primary">$22</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>45 min</span>
                      <span>•</span>
                      <span>Incluye lavado</span>
                    </div>
                  </div>

                  {/* Selección de profesional */}
                  <div className="mb-3">
                    <span className="text-[11px] text-on-surface-variant block mb-1.5">Elige tu barbero:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStaff("mateo")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          selectedStaff === "mateo"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        Mateo
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStaff("sofia")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          selectedStaff === "sofia"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        Sofía
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStaff("cualquiera")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          selectedStaff === "cualquiera"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        Cualquiera
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-full py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs flex items-center justify-center gap-1">
                    <span>Reservar sin registrarse</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Overlay (Only on small viewports) */}
              <div className="block lg:hidden mt-4 bg-white rounded-2xl p-4 shadow-lg border border-surface-container-high">
                <div className="flex items-center justify-between pb-2 bg-surface-container-low rounded-lg px-3 py-1.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">lock</span>
                    <span className="text-[11px] text-on-surface-variant font-mono truncate">skedly.com/barberia-elite</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                    4.9 ★
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-on-surface">Corte Degradado</p>
                    <p className="text-[11px] text-on-surface-variant">45 min · $18.00</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                  <span className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs">11:15 AM</span>
                  <span className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs shadow-sm font-semibold">12:00 PM</span>
                  <span className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs">01:30 PM</span>
                </div>
                <button
                  type="button"
                  className="w-full h-10 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>Confirmar Cita sin registro</span>
                  <span className="material-symbols-outlined text-[16px]">done</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 2. PROBLEMA Y SOLUCIÓN                     */}
        {/* ========================================== */}
        <section className="w-full py-16 md:py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-2">
                Transformación Operativa
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">
                Menos tiempo organizando citas. Más tiempo haciendo crecer tu negocio.
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant">
                Elimina las fricciones de la gestión manual y moderniza la atención a tus clientes.
              </p>
            </div>

            {/* 3 Bloques Comparativos Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bloque 1: Agenda Centralizada */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  {/* Estado Antes (Problema) */}
                  <div className="p-4 rounded-xl bg-error-container/40 border border-error-container mb-6">
                    <div className="flex items-center gap-2 mb-2 text-on-error-container">
                      <span className="material-symbols-outlined text-[20px]">cancel</span>
                      <span className="font-bold text-sm">Citas organizadas manualmente</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Mensajes dispersos de WhatsApp, cuadernos con tachaduras, llamadas contestadas a mitad de un servicio y clientes esperando respuesta.
                    </p>
                  </div>

                  {/* Estado Con Skedly (Solución) */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-bold text-sm">Agenda centralizada</span>
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed">
                      Registro unificado y sincronizado en tiempo real, accesible desde el móvil o el ordenador por todo el equipo sin solapamientos.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Ahorro estimado:</span>
                  <span className="font-bold text-primary">~12 horas / semana</span>
                </div>
              </div>

              {/* Bloque 2: Disponibilidad por Profesional */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  {/* Estado Antes (Problema) */}
                  <div className="p-4 rounded-xl bg-error-container/40 border border-error-container mb-6">
                    <div className="flex items-center gap-2 mb-2 text-on-error-container">
                      <span className="material-symbols-outlined text-[20px]">cancel</span>
                      <span className="font-bold text-sm">Confusión con los horarios</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Dobles reservas accidentales, profesionales atendiendo en sus descansos o asignados a servicios para los que no están disponibles.
                    </p>
                  </div>

                  {/* Estado Con Skedly (Solución) */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-bold text-sm">Disponibilidad organizada</span>
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed">
                      Horarios, turnos y descansos asignados individualmente para cada especialista. El sistema solo permite agendar en huecos reales.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Tasa de colisión:</span>
                  <span className="font-bold text-primary">0% dobles citas</span>
                </div>
              </div>

              {/* Bloque 3: Reservas Online Autónomas */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  {/* Estado Antes (Problema) */}
                  <div className="p-4 rounded-xl bg-error-container/40 border border-error-container mb-6">
                    <div className="flex items-center gap-2 mb-2 text-on-error-container">
                      <span className="material-symbols-outlined text-[20px]">cancel</span>
                      <span className="font-bold text-sm">Dificultad para reservar</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Barreras de horario comercial: el cliente quiere agendar un domingo a las 11:00 PM y no tiene cómo hacerlo hasta el lunes por la mañana.
                    </p>
                  </div>

                  {/* Estado Con Skedly (Solución) */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-bold text-sm">Reservas online disponibles</span>
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed">
                      Página pública 24/7 sin necesidad de crear cuenta ni instalar aplicaciones. Reserva completada en 3 toques desde cualquier dispositivo.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Conversión nocturna:</span>
                  <span className="font-bold text-primary">+35% reservas fuera de hora</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. CARACTERÍSTICAS PRINCIPALES             */}
        {/* ========================================== */}
        <section className="w-full py-16 md:py-20 bg-surface-container-low" id="caracteristicas">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-2">
                Funcionalidades Esenciales
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">
                Todo lo que necesitas para gestionar tus reservas.
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant">
                Herramientas esenciales diseñadas para resolver la operativa diaria de tu negocio de servicios.
              </p>
            </div>

            {/* Grid 3x2 Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Gestión de Citas */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">event_available</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mb-2">Gestión de citas</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Flujo completo de control con ciclo de vida automatizado y filtrado rápido para tu recepción o mostrador.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-surface-container-high">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">Pendiente</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">Confirmada</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold">Completada</span>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold">Cancelada</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">No asistió</span>
                </div>
              </div>

              {/* Card 2: Servicios y Categorías */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">category</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mb-2">Servicios y categorías</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Estructura tu catálogo con categorías visuales, precios informativos, duraciones en minutos y tiempos adicionales de buffer para limpieza.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                  <span>Tiempos de buffer y descanso automáticos</span>
                </div>
              </div>

              {/* Card 3: Gestión de Empleados */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">group</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mb-2">Gestión de empleados</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Perfiles individuales para tus profesionales, asignación de servicios específicos según especialidad y permisos definidos por rol.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">lock_person</span>
                  <span>Roles: Administrador y Especialista</span>
                </div>
              </div>

              {/* Card 4: Calendario Individual por Empleado */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim text-on-primary-fixed-variant flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">calendar_view_week</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mb-2">Calendario individual por empleado</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Alterna al instante entre la vista panorámica del local o la agenda particular de cada profesional para organizar su jornada sin distracciones.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                  <span>Vistas por día, semana y profesional</span>
                </div>
              </div>

              {/* Card 5: Dashboard con Estadísticas Esenciales */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">query_stats</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mb-2">Dashboard con estadísticas esenciales</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Monitorea métricas clave en un vistazo: citas del día, tasa de cancelación, volumen semanal de reservas y tus servicios más demandados.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
                  <span>Decisiones informadas basadas en datos reales</span>
                </div>
              </div>

              {/* Card 6: Página Pública de Reservas */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">public</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mb-2">Página pública de reservas personalizada</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                    Tu propio portal web optimizado para dispositivos móviles, listo para compartir como enlace directo en WhatsApp, bio de Instagram y ficha de Google Maps.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">share</span>
                  <span>skedly.com/tu-negocio listo al instante</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 4. CÓMO FUNCIONA                           */}
        {/* ========================================== */}
        <section className="w-full py-16 md:py-20 bg-surface" id="como-funciona">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-2">
                Implementación Sencilla
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">
                Empieza a recibir reservas en pocos pasos.
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant">
                Sin configuraciones técnicas complejas. Tu sistema de citas listo para operar en menos de 5 minutos.
              </p>
            </div>

            {/* 3 Pasos Conectados Visualmente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting Line Background for Desktop */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-surface-variant -z-0" />

              {/* Paso 1 */}
              <div className="relative bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl font-bold shadow-md mb-6 relative z-10">
                  1
                </div>
                <h3 className="font-bold text-base text-on-surface mb-3">Configura tu negocio</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                  Registra tus datos, define servicios, duraciones y configura los horarios laborales de tus profesionales con total flexibilidad.
                </p>
                <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  <span>2 minutos de configuración</span>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="relative bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl font-bold shadow-md mb-6 relative z-10">
                  2
                </div>
                <h3 className="font-bold text-base text-on-surface mb-3">Comparte tu página</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                  Distribuye tu dirección pública (<strong className="text-on-surface font-mono text-xs">skedly.com/tu-negocio</strong>) en tus canales digitales, bio de Instagram y mensajes directos.
                </p>
                <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>Enlace único e inolvidable</span>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="relative bg-white rounded-2xl p-6 shadow-xs border border-surface-container-high text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl font-bold shadow-md mb-6 relative z-10">
                  3
                </div>
                <h3 className="font-bold text-base text-on-surface mb-3">Recibe reservas</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
                  Los clientes eligen servicio, seleccionan su profesional preferido y confirman su horario en segundos sin crear cuentas.
                </p>
                <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                  <span>Avisos directos en tu agenda</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 5. SHOWCASE DE LA PÁGINA PÚBLICA           */}
        {/* ========================================== */}
        <section className="w-full py-16 md:py-20 bg-surface-container-low overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-14">
              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-2">
                Presencia de Marca Digital
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">
                Tu negocio merece su propio espacio online.
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant">
                Cada negocio disfruta de una plantilla pública optimizada, rápida y elegante, administrada al 100% desde el panel de Skedly.
              </p>
            </div>

            {/* Mockup Expandido de una Página Pública Real */}
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-surface-container-high overflow-hidden">
              {/* Top Browser Header Bar */}
              <div className="bg-surface-container px-4 sm:px-6 py-3 flex items-center justify-between border-b border-surface-variant">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-outline-variant" />
                  <div className="w-3 h-3 rounded-full bg-outline-variant" />
                  <div className="w-3 h-3 rounded-full bg-outline-variant" />
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-white text-on-surface-variant text-xs font-mono shadow-xs border border-surface-container-high">
                  <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
                  <span className="truncate max-w-[200px] sm:max-w-none">https://skedly.com/barberia-elite</span>
                </div>
                <div className="text-xs font-medium text-on-surface-variant hidden sm:block">Vista del Cliente</div>
              </div>

              {/* Portada & Perfil del Negocio */}
              <div className="relative">
                {/* Banner Gradient / Photo */}
                <div className="bg-cover bg-center w-full h-48 sm:h-56 md:h-64 relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent" />
                </div>

                {/* Cabecera de Información Flotante */}
                <div className="px-4 sm:px-6 md:px-10 pb-6 -mt-14 sm:-mt-16 relative flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex items-end gap-4 sm:gap-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center overflow-hidden border border-surface-container-high shrink-0">
                      <div className="w-full h-full rounded-xl bg-primary text-white flex items-center justify-center font-bold text-2xl tracking-wider">
                        BE
                      </div>
                    </div>
                    <div className="text-on-surface">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-on-surface">
                          Barbería Elite • Madrid Centro
                        </h3>
                        <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-on-surface-variant text-xs sm:text-sm mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
                          Calle Gran Vía 42, Madrid
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                          Lun - Sáb: 10:00 - 20:30
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                          4.9 (184 reseñas)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Integrado */}
                  <button
                    type="button"
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold shadow-md hover:bg-primary-container transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>Reservar cita ahora</span>
                  </button>
                </div>
              </div>

              {/* Public Page Internal Sections */}
              <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-10 border-t border-surface-variant">
                {/* 1. Catálogo de Servicios por Categoría */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm sm:text-base text-on-surface">Servicios Destacados</h4>
                    <span className="text-xs text-on-surface-variant">Precios informativos y transparentes</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Servicio 1 */}
                    <div className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between border border-surface-container-high/60">
                      <div>
                        <div className="font-bold text-sm text-on-surface">Corte Degradado Clásico</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">Asesoramiento, lavado y peinado con cera mate.</div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-2 font-medium">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>30 minutos</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-base sm:text-lg font-bold text-primary">$18</div>
                        <button className="mt-1 px-3 py-1 rounded-md bg-white text-on-surface text-xs font-semibold shadow-xs hover:bg-primary hover:text-on-primary transition-colors border border-surface-container-high">
                          Elegir
                        </button>
                      </div>
                    </div>

                    {/* Servicio 2 */}
                    <div className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between border border-surface-container-high/60">
                      <div>
                        <div className="font-bold text-sm text-on-surface">Combo Corte &amp; Barba Completa</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">Ritual con toalla caliente, navaja tradicional y aceites.</div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-2 font-medium">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>50 minutos</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-base sm:text-lg font-bold text-primary">$28</div>
                        <button className="mt-1 px-3 py-1 rounded-md bg-white text-on-surface text-xs font-semibold shadow-xs hover:bg-primary hover:text-on-primary transition-colors border border-surface-container-high">
                          Elegir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Equipo de Profesionales */}
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-on-surface mb-4">Nuestro Equipo Profesional</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Profesional 1 */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 border border-surface-container-high/60">
                      <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        MR
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-on-surface truncate">Mateo Ramos</div>
                        <div className="text-xs text-on-surface-variant">Master Barber • Fades</div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Disponible hoy</div>
                      </div>
                    </div>

                    {/* Profesional 2 */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 border border-surface-container-high/60">
                      <div className="w-12 h-12 rounded-full bg-secondary-fixed text-secondary font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        SG
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-on-surface truncate">Sofía Gómez</div>
                        <div className="text-xs text-on-surface-variant">Estilista • Capilar</div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Disponible hoy</div>
                      </div>
                    </div>

                    {/* Profesional 3 */}
                    <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 border border-surface-container-high/60">
                      <div className="w-12 h-12 rounded-full bg-tertiary-fixed text-tertiary font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        DL
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-on-surface truncate">David León</div>
                        <div className="text-xs text-on-surface-variant">Afeitado Clásico</div>
                        <div className="text-[11px] text-primary font-semibold mt-0.5">Turno tarde</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Galería y Reseñas */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  <div className="md:col-span-12 bg-surface-container-low p-4 sm:p-5 rounded-xl flex flex-col justify-between border border-surface-container-high/60">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-amber-500">
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          <span className="material-symbols-outlined text-[18px]">star</span>
                        </div>
                        <span className="text-xs text-on-surface-variant">Hace 2 días</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface italic mb-3">
                        &ldquo;Puntualidad absoluta. Reservé el domingo por la noche desde mi móvil en menos de un minuto y Mateo me atendió a la hora exacta. La mejor experiencia.&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Javier L.</span>
                      <span>•</span>
                      <span>Cliente recurrente verificado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 6. BENEFICIOS CLAVE                        */}
        {/* ========================================== */}
        <section className="w-full py-16 md:py-20 bg-surface" id="beneficios">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-2">
                Ventajas Reales
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-4">
                Diseñado para hacerte la vida más sencilla.
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-on-surface-variant">
                Creamos Skedly pensando en el día a día real de tu negocio: sin complejidades innecesarias ni curvas de aprendizaje empinadas.
              </p>
            </div>

            {/* Grid de 6 Micro-Tarjetas de Beneficio */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Beneficio 1 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-surface-container-high hover:shadow-md transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">touch_app</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface mb-1">Fácil de usar</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Intuitivo y listo para operar desde el primer día sin necesidad de capacitaciones técnicas prolongadas.
                  </p>
                </div>
              </div>

              {/* Beneficio 2 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-surface-container-high hover:shadow-md transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">phone_disabled</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface mb-1">Menos trabajo administrativo</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ahorra horas semanales respondiendo llamadas de consulta o coordinando horarios por WhatsApp.
                  </p>
                </div>
              </div>

              {/* Beneficio 3 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-surface-container-high hover:shadow-md transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface mb-1">Mejor organización</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Elimina los errores humanos, los cruces de turnos y la duplicidad involuntaria de citas.
                  </p>
                </div>
              </div>

              {/* Beneficio 4 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-surface-container-high hover:shadow-md transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed-dim text-on-primary-fixed-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">devices</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface mb-1">Reservas online cómodas</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Experiencia móvil pulida y ultra-rápida, diseñada para que tus clientes agenden sin fricción.
                  </p>
                </div>
              </div>

              {/* Beneficio 5 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-surface-container-high hover:shadow-md transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface mb-1">Calendarios por empleado</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Autonomía, orden y claridad visual personalizada para cada miembro del equipo de trabajo.
                  </p>
                </div>
              </div>

              {/* Beneficio 6 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-surface-container-high hover:shadow-md transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface mb-1">Presencia online profesional</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Posiciona y eleva la imagen de tu marca con una presentación web estética, moderna e impecable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 7. FINAL CTA BANNER                        */}
        {/* ========================================== */}
        <section className="w-full py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-primary text-on-primary p-8 md:p-14 overflow-hidden shadow-xl text-center flex flex-col items-center">
              {/* Subtle Glow Overlay */}
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-tertiary-container blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
                  Empieza a organizar tu negocio de una forma más sencilla.
                </h2>
                <p className="text-sm sm:text-base text-primary-fixed mb-8 leading-relaxed">
                  Centraliza tus citas y permite que tus clientes reserven cuando quieran.
                </p>

                {/* Botón Principal de Alto Impacto */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-primary font-bold text-sm sm:text-base shadow-lg hover:bg-surface-container hover:scale-105 transition-all"
                  >
                    <span>Crear mi cuenta</span>
                    <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                  </Link>
                </div>

                <p className="text-xs sm:text-sm text-primary-fixed">
                  Comienza en menos de 5 minutos • Sin tarjeta de crédito • Soporte en español
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================== */}
      {/* 8. FOOTER CORPORATIVO                      */}
      {/* ========================================== */}
      <footer className="w-full bg-white border-t border-surface-container-high py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            {/* Columna 1: Brand & Valor */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm tracking-wider">
                  SK
                </div>
                <span className="font-bold text-lg text-on-surface">Skedly</span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-4 leading-relaxed">
                Plataforma SaaS moderna e intuitiva para gestión de citas y páginas públicas de reservas, diseñada para salones de belleza, barberías, spas y especialistas de servicios.
              </p>
              <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Servidores activos · Disponibilidad garantizada 99.9%</span>
              </div>
            </div>

            {/* Columna 2: Producto */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3">Producto</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                <li><a href="#caracteristicas" className="hover:text-primary transition-colors">Características</a></li>
                <li><a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a></li>
                <li><a href="#beneficios" className="hover:text-primary transition-colors">Beneficios</a></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Comenzar gratis</Link></li>
              </ul>
            </div>

            {/* Columna 3: Negocios */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3">Sectores</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                <li><a href="#producto" className="hover:text-primary transition-colors">Barberías</a></li>
                <li><a href="#producto" className="hover:text-primary transition-colors">Salones de Belleza</a></li>
                <li><a href="#producto" className="hover:text-primary transition-colors">Spas y Bienestar</a></li>
                <li><a href="#producto" className="hover:text-primary transition-colors">Profesionales Libres</a></li>
              </ul>
            </div>

            {/* Columna 4: Legal & Contacto */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3">Acceso</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
                <li><Link href="/login" className="hover:text-primary transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Crear cuenta</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Panel privado</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="pt-8 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant">
              © 2025 Skedly SaaS. Todos los derechos reservados.
            </p>
            <div className="text-xs text-on-surface-variant">
              <span>Diseñado para simplificar tu jornada laboral.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================== */}
      {/* 9. MOBILE BOTTOM NAVIGATION BAR (Fixed)    */}
      {/* ========================================== */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-surface-container-high shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 px-2">
          <a
            href="#producto"
            className="flex flex-col items-center justify-center min-w-[48px] py-1 text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span className="text-[11px] font-medium mt-0.5">Inicio</span>
          </a>
          <a
            href="#caracteristicas"
            className="flex flex-col items-center justify-center min-w-[48px] py-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">featured_play_list</span>
            <span className="text-[11px] font-medium mt-0.5">Funciones</span>
          </a>
          <a
            href="#como-funciona"
            className="flex flex-col items-center justify-center min-w-[48px] py-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">route</span>
            <span className="text-[11px] font-medium mt-0.5">Proceso</span>
          </a>
          <a
            href="#beneficios"
            className="flex flex-col items-center justify-center min-w-[48px] py-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">verified</span>
            <span className="text-[11px] font-medium mt-0.5">Beneficios</span>
          </a>
          <Link
            href="/login"
            className="flex flex-col items-center justify-center min-w-[48px] py-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span className="text-[11px] font-medium mt-0.5">Entrar</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
