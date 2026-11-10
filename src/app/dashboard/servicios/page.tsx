"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes?: number;
  price: number;
  currency?: string;
  category_id?: string | null;
  category_name?: string;
  is_active: boolean;
  assigned_staff?: string[];
  icon?: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  services: ServiceItem[];
}

export default function ServiciosCatalogPage() {
  const router = useRouter();
  const { currentBusiness } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortOrder, setSortOrder] = useState<"custom" | "price-asc" | "price-desc" | "duration">("custom");

  // Open dropdown ID
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modals & Feedback
  const [deleteModalService, setDeleteModalService] = useState<ServiceItem | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick create form
  const [quickName, setQuickName] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [quickPrice, setQuickPrice] = useState(180);
  const [quickDuration, setQuickDuration] = useState(30);
  const [quickBuffer, setQuickBuffer] = useState(5);
  const [quickDescription, setQuickDescription] = useState("");
  const [savingQuick, setSavingQuick] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Mock initial services matching stitch design if DB empty
  const defaultServices: ServiceItem[] = [
    {
      id: "srv-1",
      name: "Corte Clásico",
      description: "Lavado suave, corte a tijera y máquina con estilizado premium.",
      duration_minutes: 30,
      buffer_minutes: 5,
      price: 180,
      currency: "MXN",
      category_name: "Cortes de cabello",
      is_active: true,
      assigned_staff: ["MR", "SG"],
      icon: "content_cut",
    },
    {
      id: "srv-2",
      name: "Corte Premium",
      description: "Diagnóstico capilar, tratamiento nutritivo y terminación con cera mate.",
      duration_minutes: 45,
      buffer_minutes: 10,
      price: 250,
      currency: "MXN",
      category_name: "Cortes de cabello",
      is_active: true,
      assigned_staff: ["MR"],
      icon: "workspace_premium",
    },
    {
      id: "srv-3",
      name: "Corte Infantil",
      description: "Especial para niños de hasta 12 años, trato paciente y amigable.",
      duration_minutes: 30,
      buffer_minutes: 0,
      price: 150,
      currency: "MXN",
      category_name: "Cortes de cabello",
      is_active: true,
      assigned_staff: ["SG"],
      icon: "child_care",
    },
    {
      id: "srv-4",
      name: "Perfilado de Barba",
      description: "Diseño de líneas precisas con navaja y aplicación de loción refrescante.",
      duration_minutes: 20,
      buffer_minutes: 0,
      price: 100,
      currency: "MXN",
      category_name: "Barba",
      is_active: true,
      assigned_staff: ["MR"],
      icon: "brush",
    },
    {
      id: "srv-5",
      name: "Afeitado Clásico",
      description: "Ritual de toalla caliente, espuma artesanal y afeitado tradicional a navaja.",
      duration_minutes: 30,
      buffer_minutes: 5,
      price: 140,
      currency: "MXN",
      category_name: "Barba",
      is_active: true,
      assigned_staff: ["MR"],
      icon: "auto_fix_high",
    },
    {
      id: "srv-6",
      name: "Tratamiento Capilar",
      description: "Hidratación profunda, masaje craneal estimulante y sellado con ozono.",
      duration_minutes: 45,
      buffer_minutes: 15,
      price: 300,
      currency: "MXN",
      category_name: "Tratamientos",
      is_active: true,
      assigned_staff: ["MR", "SG"],
      icon: "water_drop",
    },
    {
      id: "srv-7",
      name: "Exfoliación Facial Express",
      description: "Limpieza por exfoliación suave con microesferas de carbón vegetal.",
      duration_minutes: 20,
      buffer_minutes: 0,
      price: 120,
      currency: "MXN",
      category_name: "Tratamientos",
      is_active: false,
      assigned_staff: ["SG"],
      icon: "clean_hands",
    },
  ];

  const loadServices = async (businessId: string) => {
    setLoading(true);
    try {
      // 1. Load categories
      const { data: catData } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("business_id", businessId)
        .order("display_order", { ascending: true });

      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories([
          { id: "cat-1", name: "Cortes de cabello" },
          { id: "cat-2", name: "Barba" },
          { id: "cat-3", name: "Tratamientos" },
        ]);
      }

      // 2. Load services
      const { data: srvData } = await supabase
        .from("services")
        .select("*, category:service_categories(name)")
        .eq("business_id", businessId)
        .order("name", { ascending: true });

      if (srvData && srvData.length > 0) {
        const mapped: ServiceItem[] = srvData.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || null,
          duration_minutes: s.duration_minutes || 30,
          buffer_minutes: s.buffer_time_after || s.buffer_minutes || 0,
          price: s.price_amount || s.price || 150,
          currency: s.currency || "MXN",
          category_id: s.category_id,
          category_name: s.category?.name || "General",
          is_active: s.is_active !== false,
          assigned_staff: ["MR", "SG"],
          icon: s.category?.name === "Barba" ? "brush" : s.category?.name === "Tratamientos" ? "spa" : "content_cut",
        }));
        setServices(mapped);
      } else {
        setServices(defaultServices);
      }
    } catch (err) {
      console.error("Error loading services:", err);
      setServices(defaultServices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadServices(currentBusiness.id);
    } else {
      setServices(defaultServices);
      setCategories([
        { id: "cat-1", name: "Cortes de cabello" },
        { id: "cat-2", name: "Barba" },
        { id: "cat-3", name: "Tratamientos" },
      ]);
      setLoading(false);
    }
  }, [currentBusiness]);

  // Toggle active status
  const toggleServiceStatus = async (service: ServiceItem) => {
    const nextStatus = !service.is_active;
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, is_active: nextStatus } : s))
    );

    if (currentBusiness?.id && service.id.length > 20) {
      try {
        await supabase
          .from("services")
          .update({ is_active: nextStatus })
          .eq("id", service.id)
          .eq("business_id", currentBusiness.id);
      } catch (e) {
        console.error("Status update error", e);
      }
    }

    showToast(
      nextStatus
        ? `"${service.name}" está activo y visible para tus clientes.`
        : `"${service.name}" se pausó y quedó oculto en tu página web.`
    );
  };

  // Delete service
  const confirmDeleteService = async () => {
    if (!deleteModalService) return;
    const target = deleteModalService;

    setServices((prev) => prev.filter((s) => s.id !== target.id));
    setDeleteModalService(null);

    if (currentBusiness?.id && target.id.length > 20) {
      try {
        await supabase
          .from("services")
          .delete()
          .eq("id", target.id)
          .eq("business_id", currentBusiness.id);
      } catch (e) {
        console.error("Delete service error", e);
      }
    }

    showToast(`El servicio "${target.name}" fue eliminado del catálogo.`);
  };

  // Duplicate service
  const duplicateService = async (service: ServiceItem) => {
    const duplicated: ServiceItem = {
      ...service,
      id: "srv-dup-" + Date.now(),
      name: `${service.name} (Copia)`,
      is_active: false,
    };
    setServices((prev) => [duplicated, ...prev]);
    setOpenDropdownId(null);
    showToast(`Se duplicó "${service.name}". Ahora puedes editarlo.`);
  };

  // Quick create submit
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    setSavingQuick(true);

    const catName = quickCategory || categories[0]?.name || "Cortes de cabello";
    const foundCat = categories.find((c) => c.name === catName);

    const newSrv: ServiceItem = {
      id: "srv-new-" + Date.now(),
      name: quickName.trim(),
      description: quickDescription.trim() || null,
      duration_minutes: Number(quickDuration) || 30,
      buffer_minutes: Number(quickBuffer) || 0,
      price: Number(quickPrice) || 150,
      currency: "MXN",
      category_id: foundCat?.id,
      category_name: catName,
      is_active: true,
      assigned_staff: ["MR"],
      icon: catName.toLowerCase().includes("barba") ? "brush" : "content_cut",
    };

    setServices((prev) => [newSrv, ...prev]);

    if (currentBusiness?.id) {
      try {
        await supabase.from("services").insert({
          business_id: currentBusiness.id,
          category_id: foundCat?.id || null,
          name: newSrv.name,
          description: newSrv.description,
          duration_minutes: newSrv.duration_minutes,
          buffer_time_after: newSrv.buffer_minutes,
          price_amount: newSrv.price,
          currency: "MXN",
          is_active: true,
          is_published: true,
        });
      } catch (err) {
        console.error("Quick create error:", err);
      }
    }

    setSavingQuick(false);
    setIsQuickCreateOpen(false);
    setQuickName("");
    setQuickDescription("");
    showToast(`¡Servicio "${newSrv.name}" creado con éxito!`);
  };

  // Metrics
  const activeCount = services.filter((s) => s.is_active).length;
  const inactiveCount = services.filter((s) => !s.is_active).length;
  const uniqueCategories = Array.from(new Set(services.map((s) => s.category_name || "General")));

  // Filtered and Sorted Services
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = s.name.toLowerCase().includes(q);
          const matchesDesc = s.description?.toLowerCase().includes(q);
          if (!matchesName && !matchesDesc) return false;
        }

        // Category filter
        if (selectedCategory !== "all" && s.category_name !== selectedCategory) {
          return false;
        }

        // Status filter
        if (statusFilter === "active" && !s.is_active) return false;
        if (statusFilter === "inactive" && s.is_active) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "price-asc") return a.price - b.price;
        if (sortOrder === "price-desc") return b.price - a.price;
        if (sortOrder === "duration") return a.duration_minutes - b.duration_minutes;
        return 0;
      });
  }, [services, searchQuery, selectedCategory, statusFilter, sortOrder]);

  // Group by category
  const groupedCategories: CategoryGroup[] = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();

    filteredServices.forEach((srv) => {
      const cat = srv.category_name || "General";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(srv);
    });

    const result: CategoryGroup[] = [];
    map.forEach((items, catName) => {
      let icon = "content_cut";
      const lower = catName.toLowerCase();
      if (lower.includes("barba") || lower.includes("afeitado")) icon = "face_6";
      else if (lower.includes("tratamiento") || lower.includes("facial") || lower.includes("spa")) icon = "spa";
      else if (lower.includes("color") || lower.includes("tinte")) icon = "palette";

      result.push({
        id: catName,
        name: catName,
        icon,
        services: items,
      });
    });

    return result;
  }, [filteredServices]);

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface-container-lowest px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-surface-container-high">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* 1. ENCABEZADO DE MÓDULO */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-primary uppercase font-bold tracking-wider">
                Catálogo Comercial
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="text-xs text-on-surface-variant font-medium">
                {activeCount} visibles al cliente
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Servicios
            </h1>
            <p className="text-sm text-on-surface-variant max-w-2xl">
              Administra los servicios que ofreces y permite que tus clientes los reserven fácilmente
              desde tu enlace público.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/dashboard/categorias"
              className="inline-flex items-center gap-2 px-3.5 h-10 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container shadow-sm border border-surface-container transition-all text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                category
              </span>
              <span>Gestionar categorías</span>
            </Link>

            <Link
              href="/dashboard/servicios/nuevo"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-on-primary hover:bg-primary-container shadow-sm transition-all text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>+ Nuevo servicio</span>
            </Link>
          </div>
        </section>

        {/* 2. MÉTRICAS COMPACTAS (BENTO ROW) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Servicios activos */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  Servicios activos
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">{activeCount}</span>
                  <span className="text-xs text-secondary">de {services.length} creados</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
              </div>
            </div>
            <div className="mt-4 pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                En catálogo público
              </span>
              <span className="text-xs text-on-surface-variant">Disponibles 24/7</span>
            </div>
          </div>

          {/* Card 2: Categorías */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  Categorías
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">{uniqueCategories.length}</span>
                  <span className="text-xs text-secondary">grupos temáticos</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">segment</span>
              </div>
            </div>
            <div className="mt-4 pt-1 flex items-center gap-1.5 flex-wrap">
              {uniqueCategories.slice(0, 3).map((cat) => {
                const count = services.filter((s) => s.category_name === cat).length;
                return (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-medium"
                  >
                    {cat} ({count})
                  </span>
                );
              })}
            </div>
          </div>

          {/* Card 3: Servicios inactivos */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  Servicios inactivos
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface">{inactiveCount}</span>
                  <span className="text-xs text-secondary">servicios pausados</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">visibility_off</span>
              </div>
            </div>
            <div className="mt-4 pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Oculto a clientes
              </span>
              <span className="text-xs text-secondary truncate">
                {services.find((s) => !s.is_active)?.name || "Ninguno"}
              </span>
            </div>
          </div>
        </section>

        {/* 3. BARRA DE BÚSQUEDA Y FILTRADO INTERACTIVO */}
        <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Input búsqueda y selector de categorías */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar servicio por nombre o detalle..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="relative min-w-[200px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold border border-transparent focus:border-primary appearance-none cursor-pointer outline-none"
                >
                  <option value="all">Todas las categorías ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Chips de Estado y Orden */}
            <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low border border-surface-container">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Todos ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Activos ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === "inactive"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Inactivos ({inactiveCount})
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant hidden sm:inline">
                  sort
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="h-9 px-2.5 rounded-lg bg-transparent text-on-surface-variant text-xs font-medium focus:outline-none cursor-pointer hover:text-on-surface"
                >
                  <option value="custom">Orden recomendado</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="duration">Duración</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TABLA DE SERVICIOS AGRUPADOS POR CATEGORÍA */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-container">
                  <th className="py-3 px-5" scope="col">
                    Servicio
                  </th>
                  <th className="py-3 px-4" scope="col">
                    Duración
                  </th>
                  <th className="py-3 px-4" scope="col">
                    Precio informativo
                  </th>
                  <th className="py-3 px-4" scope="col">
                    Equipo asignado
                  </th>
                  <th className="py-3 px-4" scope="col">
                    Estado
                  </th>
                  <th className="py-3 px-4 text-center" scope="col">
                    Página pública
                  </th>
                  <th className="py-3 px-5 text-right" scope="col">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-secondary">
                      Cargando servicios del catálogo...
                    </td>
                  </tr>
                ) : groupedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                          search_off
                        </span>
                        <span className="text-sm font-bold text-on-surface">
                          No se encontraron servicios
                        </span>
                        <p className="text-xs text-secondary max-w-sm">
                          Prueba con otros términos de búsqueda o cambia la categoría filtrada.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedCategories.map((group) => (
                    <React.Fragment key={group.id}>
                      {/* Cabecera de Categoría */}
                      <tr className="bg-surface-container/50">
                        <td colSpan={7} className="py-2.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">
                              {group.icon}
                            </span>
                            <span className="text-xs font-bold text-on-surface">
                              {group.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                              {group.services.length} servicios
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Filas de Servicios */}
                      {group.services.map((service) => {
                        const isInactive = !service.is_active;

                        return (
                          <tr
                            key={service.id}
                            className={`hover:bg-surface-container-low transition-colors group ${
                              isInactive ? "opacity-75 bg-surface-container-low/40" : ""
                            }`}
                          >
                            {/* Servicio y Descripción */}
                            <td className="py-3.5 px-5">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isInactive
                                      ? "bg-surface-container text-on-surface-variant"
                                      : "bg-primary-fixed text-primary"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    {service.icon || "content_cut"}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-bold block truncate ${
                                        isInactive ? "text-on-surface-variant" : "text-on-surface"
                                      }`}
                                    >
                                      {service.name}
                                    </span>
                                    {isInactive && (
                                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[10px]">
                                        Pausado
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                                    {service.description || "Servicio profesional sin descripción detallada."}
                                  </span>
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-surface-container text-secondary text-[10px]">
                                    {service.category_name}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Duración */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="text-xs font-semibold text-on-surface">
                                {service.duration_minutes} min
                              </div>
                              {service.buffer_minutes && service.buffer_minutes > 0 ? (
                                <div className="text-[10px] text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px]">
                                    more_time
                                  </span>
                                  +{service.buffer_minutes} min buffer
                                </div>
                              ) : (
                                <div className="text-[10px] text-secondary mt-0.5">Sin buffer</div>
                              )}
                            </td>

                            {/* Precio Informativo */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-on-surface">
                                ${service.price} {service.currency || "MXN"}
                              </div>
                              <span className="text-[10px] text-secondary font-medium">
                                En local
                              </span>
                            </td>

                            {/* Equipo Asignado */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center -space-x-1.5">
                                <div
                                  className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold shadow-xs border-2 border-surface-container-lowest"
                                  title="Mateo Ramos"
                                >
                                  MR
                                </div>
                                <div
                                  className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[10px] font-bold shadow-xs border-2 border-surface-container-lowest"
                                  title="Sofía Gómez"
                                >
                                  SG
                                </div>
                                <span className="pl-2 text-[11px] text-on-surface-variant">
                                  2 profs.
                                </span>
                              </div>
                            </td>

                            {/* Switch de Estado */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={service.is_active}
                                  onChange={() => toggleServiceStatus(service)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ml-2 text-xs font-medium text-on-surface">
                                  {service.is_active ? "Activo" : "Inactivo"}
                                </span>
                              </label>
                            </td>

                            {/* Visibilidad Pública */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {service.is_active ? (
                                <span
                                  className="inline-flex items-center gap-1 text-emerald-600"
                                  title="Visible en página de reservas"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    visibility
                                  </span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-on-surface-variant"
                                  title="Oculto en web de reservas"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    visibility_off
                                  </span>
                                </span>
                              )}
                            </td>

                            {/* Dropdown de Acciones */}
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenDropdownId(
                                      openDropdownId === service.id ? null : service.id
                                    )
                                  }
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    more_vert
                                  </span>
                                </button>

                                {openDropdownId === service.id && (
                                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface-container-lowest shadow-lg py-1 z-30 text-xs font-semibold border border-surface-container">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        router.push(`/dashboard/servicios/nuevo?id=${service.id}`);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-surface-container flex items-center gap-2 text-on-surface cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        edit
                                      </span>
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => duplicateService(service)}
                                      className="w-full text-left px-3.5 py-2 hover:bg-surface-container flex items-center gap-2 text-on-surface cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        content_copy
                                      </span>
                                      Duplicar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        toggleServiceStatus(service);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-surface-container flex items-center gap-2 text-secondary cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        {service.is_active ? "pause" : "play_arrow"}
                                      </span>
                                      {service.is_active ? "Desactivar" : "Activar"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setDeleteModalService(service);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-error-container text-error flex items-center gap-2 cursor-pointer border-t border-surface-container mt-1"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        delete
                                      </span>
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. BANNER INFORMATIVO SOBRE PAGOS */}
        <section className="bg-primary/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-on-surface block">
                Precios informativos y cobro en el local
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Los precios son meramente informativos para tus clientes. Skedly no procesa cobros en
                línea de comisiones: el pago de cada servicio se liquida directamente en tu
                establecimiento.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/configuracion"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0 ml-auto"
          >
            <span>Configurar métodos</span>
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </Link>
        </section>
      </div>

      {/* =========================================================================
          MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
      ========================================================================== */}
      {deleteModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-xl space-y-4 border border-surface-container animate-scale-up">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-on-surface">
                  ¿Eliminar servicio &quot;{deleteModalService.name}&quot;?
                </span>
                <span className="text-[11px] text-error font-semibold">
                  Esta acción no se puede deshacer
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs space-y-1.5 border border-surface-container">
              <p>El servicio dejará de estar disponible de inmediato en tu enlace de reservas online.</p>
              <p className="font-semibold text-on-surface">
                Las citas pasadas o agendadas previamente conservarán el registro histórico intacto.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteModalService(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteService}
                className="px-4 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Eliminar servicio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL RÁPIDO "+ NUEVO SERVICIO"
      ========================================================================== */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 shadow-xl space-y-4 border border-surface-container animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </div>
                <span className="text-base font-bold text-on-surface">Crear nuevo servicio</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nombre del servicio <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Ej. Afeitado con Toalla Caliente"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Categoría
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium border border-transparent focus:border-primary outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Precio aproximado (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs border border-transparent focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={quickDuration}
                    onChange={(e) => setQuickDuration(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Buffer de descanso
                  </label>
                  <select
                    value={quickBuffer}
                    onChange={(e) => setQuickBuffer(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs border border-transparent focus:border-primary outline-none"
                  >
                    <option value={0}>0 min</option>
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Descripción corta
                </label>
                <textarea
                  rows={2}
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  placeholder="Detalles visibles para tus clientes al reservar..."
                  className="w-full p-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingQuick}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container disabled:opacity-50 transition-all"
                >
                  {savingQuick ? "Guardando..." : "Guardar servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
