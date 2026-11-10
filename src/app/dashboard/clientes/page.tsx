"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  INITIAL_CUSTOMERS,
  CustomerDetail,
} from "@/lib/customers-data";

function ClientesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBusiness } = useAuth();

  // State
  const [customers, setCustomers] = useState<CustomerDetail[]>(INITIAL_CUSTOMERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "recurrent" | "new">("all");
  const [sortBy, setSortBy] = useState<"recent" | "appointments" | "name" | "registered">("recent");
  const [forceEmptyState, setForceEmptyState] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Load from Supabase if available
  useEffect(() => {
    async function fetchFromSupabase() {
      if (!currentBusiness?.id) return;
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge supabase customers with design template format
          const mapped: CustomerDetail[] = data.map((c: any, index: number) => {
            const initials = c.full_name
              ? c.full_name
                  .split(" ")
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "CL";

            return {
              id: c.id,
              code: `CLI-${c.id.slice(0, 4).toUpperCase()}`,
              full_name: c.full_name,
              avatar: initials,
              avatarBg: "bg-[#dee1ff]",
              avatarColor: "text-[#2c4dd6]",
              subtitle: "Cliente del negocio",
              phone: c.phone || "+52 55 0000 0000",
              email: c.email || null,
              appointmentsCount: 1,
              statusTag: index === 0 ? "Nuevo" : "Recurrente",
              lastAppointment: {
                date: "Reciente",
                service: "Corte General",
                professional: "Equipo",
              },
              registeredAt: new Date(c.created_at).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              totalSpent: 350,
              avgTicket: 350,
              completedAppointments: 1,
              totalScheduled: 1,
              punctuality: "100%",
              preferredProfessional: "Carlos Ramírez",
              preferredProfessionalPct: "100%",
              favoriteService: "Corte General",
              favoriteServiceTime: "45 min",
              notes: c.notes
                ? [
                    {
                      id: `note-${c.id}`,
                      author: "Registro",
                      date: "Hoy",
                      text: c.notes,
                    },
                  ]
                : [],
              appointments: [],
            };
          });

          // Prepend newly added supabase customers to mock list
          setCustomers([...mapped, ...INITIAL_CUSTOMERS.filter((m) => !mapped.some((x) => x.id === m.id))]);
        }
      } catch (err) {
        console.warn("Could not fetch customers from Supabase, using mock directory:", err);
      }
    }

    fetchFromSupabase();
  }, [currentBusiness]);

  // Handle Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);

    const initials = name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const newCustomer: CustomerDetail = {
      id: `cli-${Date.now()}`,
      code: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: name.trim(),
      avatar: initials,
      avatarBg: "bg-[#dee1ff]",
      avatarColor: "text-[#2c4dd6]",
      subtitle: "Cliente registrado manualmente",
      phone: phone.trim(),
      email: email.trim() || null,
      appointmentsCount: 0,
      statusTag: "Nuevo",
      lastAppointment: {
        date: "Sin citas previas",
        service: "Pendiente",
        professional: "Sin asignar",
      },
      registeredAt: "Hoy",
      totalSpent: 0,
      avgTicket: 0,
      completedAppointments: 0,
      totalScheduled: 0,
      punctuality: "100%",
      preferredProfessional: "Por definir",
      preferredProfessionalPct: "0%",
      favoriteService: "Por definir",
      favoriteServiceTime: "0 min",
      notes: notes.trim()
        ? [
            {
              id: `note-${Date.now()}`,
              author: "Recepción",
              date: "Hoy",
              text: notes.trim(),
            },
          ]
        : [],
      appointments: [],
    };

    if (currentBusiness?.id) {
      try {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            business_id: currentBusiness.id,
            full_name: name.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
            notes: notes.trim() || null,
          })
          .select()
          .single();

        if (!error && data) {
          newCustomer.id = data.id;
        }
      } catch (err) {
        console.warn("Supabase insert error, saved locally:", err);
      }
    }

    setCustomers([newCustomer, ...customers]);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setIsModalOpen(false);
    setSaving(false);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ["ID", "Nombre", "Telefono", "Email", "Tipo", "Citas", "Registrado"];
    const rows = customers.map((c) => [
      c.code,
      `"${c.full_name}"`,
      `"${c.phone}"`,
      `"${c.email || ""}"`,
      c.statusTag,
      c.appointmentsCount,
      `"${c.registeredAt}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `skedly_clientes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // Filtering & Sorting
  const filteredCustomers = useMemo(() => {
    if (forceEmptyState) return [];

    let list = customers.filter((c) => {
      const matchSearch =
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === "recurrent") {
        return c.statusTag === "Recurrente" || c.statusTag === "VIP";
      }
      if (activeTab === "new") {
        return c.statusTag === "Nuevo";
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "appointments") {
        return b.appointmentsCount - a.appointmentsCount;
      }
      if (sortBy === "name") {
        return a.full_name.localeCompare(b.full_name);
      }
      if (sortBy === "registered") {
        return b.registeredAt.localeCompare(a.registeredAt);
      }
      return 0; // recent (default list order)
    });

    return list;
  }, [customers, search, activeTab, sortBy, forceEmptyState]);

  // Counts for pills
  const totalCount = customers.length;
  const recurrentCount = customers.filter((c) => c.statusTag === "Recurrente" || c.statusTag === "VIP").length;
  const newCount = customers.filter((c) => c.statusTag === "Nuevo").length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* EXPORT TOAST */}
      {exportNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#009842] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Archivo CSV exportado exitosamente con {customers.length} clientes.</span>
        </div>
      )}

      {/* TOP HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#575e70] uppercase">
              Gestión de Directorio
            </span>
            <span className="text-[#c4c5d7]">·</span>
            <span className="text-[11px] font-semibold text-[#2c4dd6] bg-[#dee1ff] px-2 py-0.5 rounded-full">
              {currentBusiness?.name || "Urban Cuts Grooming Studio"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-sm text-[#444654]">
            Consulta el historial de citas, métricas de retención y datos de contacto directo de tus clientes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#c4c5d7]/50 hover:bg-[#f2f4f6] text-[#191c1e] text-xs font-semibold shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#575e70]">download</span>
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Registrar cliente manual</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (3 Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Clientes */}
        <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#e0e3e5] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#575e70] uppercase tracking-wider">
                Total Clientes
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#191c1e] tracking-tight">
                  {348}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  12% este mes
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
          </div>
          {/* Sparkline mini SVG */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-[#575e70]">
            <span>Directorio en tiempo real</span>
            <svg className="w-24 h-6 text-[#2c4dd6]" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 20 Q 25 15, 50 12 T 100 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Nuevos este mes */}
        <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#e0e3e5] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#575e70] uppercase tracking-wider">
                Nuevos este mes
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#191c1e] tracking-tight">
                  42
                </span>
                <span className="text-xs text-[#575e70] font-medium">
                  Primera visita completada
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">person_add</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-medium text-[#575e70]">
              <span>Meta mensual</span>
              <span className="text-[#191c1e] font-semibold">58% (42/72)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#f2f4f6] overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "58%" }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Clientes Recurrentes */}
        <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#e0e3e5] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#575e70] uppercase tracking-wider">
                Clientes Recurrentes
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#191c1e] tracking-tight">
                  68%
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  Alta fidelización
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">published_with_changes</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-[#575e70]">
            <span>236 clientes con 2 o más citas</span>
            <span className="font-semibold text-emerald-600">Retención 4.8★</span>
          </div>
        </div>
      </div>

      {/* PHONE IDENTIFICATION BANNER & SIMULATOR TOGGLE */}
      <div className="rounded-2xl bg-gradient-to-r from-[#dee1ff]/40 via-white to-white p-4 sm:p-5 border border-[#dee1ff] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2c4dd6] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-xl">phone_iphone</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#191c1e]">
                Identificación primaria por Teléfono / WhatsApp
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#2c4dd6]/10 text-[#2c4dd6] text-[10px] font-bold uppercase tracking-wider">
                Sin contraseñas
              </span>
            </div>
            <p className="text-xs text-[#444654] mt-0.5">
              Tus clientes reservan sin necesidad de crear contraseñas ni registrar cuentas de usuario. El número telefónico agrupa automáticamente su historial en el estudio.
            </p>
          </div>
        </div>

        {/* Empty state test simulator */}
        <button
          onClick={() => setForceEmptyState(!forceEmptyState)}
          type="button"
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
            forceEmptyState
              ? "bg-[#2c4dd6] text-white border-[#2c4dd6]"
              : "bg-white text-[#575e70] border-[#c4c5d7]/60 hover:bg-[#f2f4f6]"
          }`}
          title="Alterna entre la lista con clientes y la vista vacía para verificar diseño"
        >
          <span className="material-symbols-outlined text-sm">
            {forceEmptyState ? "toggle_on" : "toggle_off"}
          </span>
          <span>{forceEmptyState ? "Modo vacío activo" : "Simular vista vacía"}</span>
        </button>
      </div>

      {/* DIRECTORY TABLE CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#e0e3e5] overflow-hidden flex flex-col">
        {/* Table Search, Filters and Sort Bar */}
        <div className="p-4 sm:p-5 border-b border-[#e0e3e5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o correo..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] placeholder-[#747686] outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#191c1e]"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Filter Pills and Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-[#f2f4f6] gap-1">
              <button
                onClick={() => setActiveTab("all")}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "all"
                    ? "bg-white text-[#191c1e] shadow-xs"
                    : "text-[#575e70] hover:text-[#191c1e]"
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab("recurrent")}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "recurrent"
                    ? "bg-white text-[#191c1e] shadow-xs"
                    : "text-[#575e70] hover:text-[#191c1e]"
                }`}
              >
                Recurrentes ({recurrentCount})
              </button>
              <button
                onClick={() => setActiveTab("new")}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "new"
                    ? "bg-white text-[#191c1e] shadow-xs"
                    : "text-[#575e70] hover:text-[#191c1e]"
                }`}
              >
                Nuevos ({newCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[#575e70]">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Ordenar clientes por"
                className="bg-[#f2f4f6] text-[#191c1e] font-semibold rounded-lg px-2.5 py-1.5 border-none outline-none cursor-pointer hover:bg-[#e6e8ea] transition-colors"
              >
                <option value="recent">Última cita reciente</option>
                <option value="appointments">Mayor número de citas</option>
                <option value="name">Nombre (A-Z)</option>
                <option value="registered">Fecha de registro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content or Empty State */}
        {filteredCustomers.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#dee1ff]/60 text-[#2c4dd6] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">groups</span>
            </div>
            <h3 className="text-base font-bold text-[#191c1e]">
              Aún no hay clientes registrados
            </h3>
            <p className="text-xs text-[#575e70] max-w-sm">
              Los clientes aparecerán automáticamente cuando reserven desde la página pública o puedes registrarlos de forma manual en este momento.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => {
                  setForceEmptyState(false);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-xs"
              >
                + Registrar primer cliente
              </button>
              {forceEmptyState && (
                <button
                  onClick={() => setForceEmptyState(false)}
                  className="px-4 py-2 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] text-xs font-semibold"
                >
                  Desactivar simulación vacía
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f2f4f6] text-[#575e70] text-[11px] font-semibold uppercase tracking-wider border-b border-[#e0e3e5]">
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Contacto directo</th>
                  <th className="py-3.5 px-4">Historial / Tipo</th>
                  <th className="py-3.5 px-4">Última cita realizada</th>
                  <th className="py-3.5 px-4">Registrado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {filteredCustomers.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#f2f4f6]/60 transition-colors group"
                    >
                      {/* Cliente */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${c.avatarBg} ${c.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                          >
                            {c.avatar}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/dashboard/clientes/${c.id}`}
                                className="text-sm font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors"
                              >
                                {c.full_name}
                              </Link>
                              {c.isVip && (
                                <span
                                  className="material-symbols-outlined text-amber-500 text-[15px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                  title="Cliente VIP"
                                >
                                  star
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#575e70]">
                              {c.subtitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contacto Directo */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-[#191c1e] font-medium">
                            <span className="material-symbols-outlined text-[15px] text-[#575e70]">
                              phone_iphone
                            </span>
                            <span>{c.phone}</span>
                            <a
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir chat en WhatsApp"
                              className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold transition-colors"
                            >
                              <span className="material-symbols-outlined text-[11px]">chat</span>
                              <span>WA</span>
                            </a>
                          </div>
                          {c.email ? (
                            <span className="text-[11px] text-[#575e70]">
                              {c.email}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#575e70] italic">
                              Sin correo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Historial / Tipo */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#191c1e]">
                            {c.appointmentsCount} {c.appointmentsCount === 1 ? "cita" : "citas"}
                          </span>
                          {c.statusTag === "VIP" ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2c4dd6] text-white">
                              VIP
                            </span>
                          ) : c.statusTag === "Recurrente" ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                              Recurrente
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706]">
                              Nuevo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Última Cita Realizada */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#191c1e]">
                            <span className="w-2 h-2 rounded-full bg-[#2c4dd6]"></span>
                            <span>{c.lastAppointment.date}</span>
                          </div>
                          <span className="text-[11px] text-[#575e70] truncate max-w-[220px]">
                            {c.lastAppointment.service}
                            {c.lastAppointment.professional !== "Sin asignar" && (
                              <> con {c.lastAppointment.professional}</>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Registrado */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-[#575e70]">
                        {c.registeredAt}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 whitespace-nowrap text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/clientes/${c.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-[#f2f4f6] text-[#191c1e] text-xs font-medium hover:bg-[#e6e8ea] transition-colors"
                          >
                            Ver perfil
                          </Link>
                          <Link
                            href={`/dashboard/citas/nueva?clientId=${c.id}&clientName=${encodeURIComponent(
                              c.full_name
                            )}&clientPhone=${encodeURIComponent(c.phone)}`}
                            className="px-2.5 py-1.5 rounded-lg bg-[#dee1ff] text-[#2c4dd6] text-xs font-semibold hover:bg-[#2c4dd6] hover:text-white transition-colors"
                          >
                            Nueva cita
                          </Link>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenuId(activeMenuId === c.id ? null : c.id)
                              }
                              aria-label="Más opciones"
                              type="button"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#575e70] hover:bg-[#f2f4f6] hover:text-[#191c1e] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                more_horiz
                              </span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === c.id && (
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-[#e0e3e5] z-30 py-1 text-left text-xs animate-fade-in">
                                <a
                                  href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 text-[#191c1e] hover:bg-[#f2f4f6]"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                                    chat
                                  </span>
                                  <span>Contactar WhatsApp</span>
                                </a>
                                <a
                                  href={`tel:${c.phone}`}
                                  className="flex items-center gap-2 px-3 py-2 text-[#191c1e] hover:bg-[#f2f4f6]"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-[#2c4dd6]">
                                    call
                                  </span>
                                  <span>Llamar por teléfono</span>
                                </a>
                                <Link
                                  href={`/dashboard/clientes/${c.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-[#191c1e] hover:bg-[#f2f4f6]"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-[#575e70]">
                                    edit_note
                                  </span>
                                  <span>Ver notas internas</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-[#f2f4f6]/50 border-t border-[#e0e3e5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#575e70]">
            Mostrando <span className="font-semibold text-[#191c1e]">{filteredCustomers.length}</span> de{" "}
            <span className="font-semibold text-[#191c1e]">{customers.length}</span> clientes
          </span>
          <div className="flex items-center gap-1 text-xs">
            <button
              disabled
              className="px-2.5 py-1 rounded-lg bg-white border border-[#e0e3e5] text-[#747686] opacity-50 cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-[#2c4dd6] text-white font-semibold">
              1
            </span>
            <button
              disabled
              className="px-2.5 py-1 rounded-lg bg-white border border-[#e0e3e5] text-[#747686] opacity-50 cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* INFORMATIONAL TIP CARD */}
      <div className="rounded-2xl bg-[#f2f4f6] p-4 sm:p-5 flex items-start gap-3 border border-[#e0e3e5]">
        <span className="material-symbols-outlined text-[20px] text-[#2c4dd6] shrink-0 mt-0.5">
          lightbulb
        </span>
        <div className="flex flex-col text-xs text-[#575e70]">
          <span className="font-bold text-[#191c1e]">
            Experiencia sin fricción para tus clientes
          </span>
          <p className="mt-0.5">
            En Skedly, el teléfono y WhatsApp son la llave maestra. Tus clientes nunca tendrán que recordar contraseñas ni recuperar accesos. Cuando agendan en tu página pública, el sistema detecta su número y unifica automáticamente sus citas en su perfil.
          </p>
        </div>
      </div>

      {/* MODAL: REGISTRAR CLIENTE MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e0e3e5] animate-fade-in flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <h3 className="text-base font-bold text-[#191c1e]">
                  Registrar Cliente Manual
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#575e70] hover:bg-[#f2f4f6]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. David Soria Gómez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Teléfono / WhatsApp * (ID Primario)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. +52 55 4321 8765"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                />
                <span className="text-[10px] text-[#575e70] mt-0.5 block">
                  Identificador único del cliente para citas y recordatorios por WhatsApp.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Correo electrónico (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Notas iniciales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Preferencias de corte, alergias o detalles del cliente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f2f4f6] border border-transparent focus:border-[#2c4dd6] focus:bg-white text-xs text-[#191c1e] outline-none resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#575e70] hover:bg-[#f2f4f6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !phone.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Registrar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          Cargando directorio de clientes...
        </div>
      }
    >
      <ClientesContent />
    </Suspense>
  );
}
