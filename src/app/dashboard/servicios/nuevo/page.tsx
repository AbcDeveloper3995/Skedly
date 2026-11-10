"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  selected: boolean;
}

function ServiceEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { currentBusiness } = useAuth();

  // Form Fields
  const [serviceName, setServiceName] = useState("Corte Premium");
  const [categoryName, setCategoryName] = useState("Cortes de cabello");
  const [description, setDescription] = useState(
    "Degradado de alta precisión, lavado relajante con toalla caliente y peinado con cera mate."
  );
  const [duration, setDuration] = useState(45);
  const [bufferTime, setBufferTime] = useState(10);
  const [price, setPrice] = useState(250);
  const [isVisiblePublic, setIsVisiblePublic] = useState(true);
  const [isOnlineBookingEnabled, setIsOnlineBookingEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "collab-1",
      name: "Mateo Ramos",
      role: "Barbero Principal • Especialista en fades",
      avatar: "MR",
      selected: true,
    },
    {
      id: "collab-2",
      name: "Sofía Gómez",
      role: "Estilista / Barbera • Técnica unisex",
      avatar: "SG",
      selected: true,
    },
    {
      id: "collab-3",
      name: "David León",
      role: "Especialista en Afeitado • Toalla caliente",
      avatar: "DL",
      selected: false,
    },
  ]);

  // Categories list
  const [categories, setCategories] = useState<string[]>([
    "Cortes de cabello",
    "Afeitado clásico & Barba",
    "Tratamientos capilares",
    "Coloración y Matiz",
  ]);

  // Modals & State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duration options
  const durationOptions = [15, 20, 30, 45, 60, 90, 120];

  // If in edit mode, load service from Supabase or mock
  useEffect(() => {
    if (isEditMode && editId) {
      if (currentBusiness?.id && editId.length > 20) {
        supabase
          .from("services")
          .select("*, category:service_categories(name)")
          .eq("id", editId)
          .single()
          .then(({ data }) => {
            if (data) {
              setServiceName(data.name || "");
              setDescription(data.description || "");
              setDuration(data.duration_minutes || 30);
              setBufferTime(data.buffer_time_after || data.buffer_minutes || 0);
              setPrice(data.price_amount || data.price || 150);
              setIsActive(data.is_active !== false);
              if (data.category?.name) setCategoryName(data.category.name);
            }
          });
      } else {
        // Fallback demo values if editing a mock id
        setServiceName("Corte Premium");
        setCategoryName("Cortes de cabello");
        setPrice(250);
        setDuration(45);
        setBufferTime(10);
      }
    } else {
      // Default creation values
      setServiceName("");
      setDescription("");
      setPrice(180);
      setDuration(30);
      setBufferTime(5);
    }

    // Load available categories
    if (currentBusiness?.id) {
      supabase
        .from("service_categories")
        .select("name")
        .eq("business_id", currentBusiness.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCategories(data.map((c) => c.name));
          }
        });
    }
  }, [isEditMode, editId, currentBusiness]);

  const toggleCollaborator = (id: string) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const trimmed = newCatName.trim();
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      setCategoryName(trimmed);

      if (currentBusiness?.id) {
        try {
          await supabase.from("service_categories").insert({
            business_id: currentBusiness.id,
            name: trimmed,
            display_order: categories.length + 1,
            is_active: true,
          });
        } catch (err) {
          console.error("Error creating category:", err);
        }
      }
    }

    setNewCatName("");
    setIsCategoryModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (currentBusiness?.id) {
        // Get category id if exists
        let categoryId: string | null = null;
        const { data: catData } = await supabase
          .from("service_categories")
          .select("id")
          .eq("business_id", currentBusiness.id)
          .eq("name", categoryName)
          .maybeSingle();

        if (catData?.id) {
          categoryId = catData.id;
        }

        const payload = {
          business_id: currentBusiness.id,
          name: serviceName.trim(),
          description: description.trim() || null,
          category_id: categoryId,
          duration_minutes: duration,
          buffer_time_after: bufferTime,
          price_amount: price,
          currency: "MXN",
          is_active: isActive,
          is_published: isVisiblePublic,
        };

        if (isEditMode && editId && editId.length > 20) {
          const { error } = await supabase
            .from("services")
            .update(payload)
            .eq("id", editId)
            .eq("business_id", currentBusiness.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("services").insert(payload);
          if (error) throw error;
        }
      }

      router.push("/dashboard/servicios");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al guardar el servicio");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCollabs = collaborators.filter((c) => c.selected);
  const businessDisplayName = currentBusiness?.name || "Barbería Élite Central";
  const businessSlug = currentBusiness?.slug || "barberia-elite";

  return (
    <div className="w-full">
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Encabezado con navegación de regreso */}
        <div className="flex flex-col gap-1 pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/servicios"
              className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-semibold group"
            >
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">
                arrow_back
              </span>
              <span>Volver a Servicios</span>
            </Link>
            <span className="text-outline-variant text-xs">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
              {isEditMode ? "Modo Edición" : "Modo Creación"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {isEditMode ? `Editar: ${serviceName || "Servicio"}` : "Nuevo Servicio"}
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Completa la información para que tus clientes puedan reservar este servicio en tu
                página pública.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold shadow-xs border border-surface-container-high/60">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Sincronización en vivo
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Contenedor Principal: 2 Columnas (7/12 Formulario & 5/12 Sticky Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ==================== COLUMNA IZQUIERDA: Formulario ==================== */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-6">
            {/* SECCIÓN A: Información básica */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Información básica</h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Detalles esenciales visibles en el catálogo público
                  </p>
                </div>
              </div>

              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>
                    Nombre del servicio <span className="text-error">*</span>
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-normal">Requerido</span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej. Corte Clásico con Acabado a Navaja"
                  className="h-10 px-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-outline focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Categoría */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface">
                    Categoría <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="inline-flex items-center gap-1 text-primary hover:text-on-primary-fixed-variant transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>
                    <span>Crear nueva categoría</span>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium appearance-none focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-on-surface-variant text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface">Descripción</label>
                  <span className="text-[10px] text-on-surface-variant">
                    Opcional • {description.length}/240
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={240}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe lo que incluye el procedimiento, productos utilizados y técnicas especiales..."
                  className="p-3 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-outline focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* SECCIÓN B: Duración y precio informativo */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Duración y precio informativo</h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Define el tiempo de atención y el importe de referencia
                  </p>
                </div>
              </div>

              {/* Duración Pills */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Duración del servicio <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDuration(opt)}
                      className={`py-2 px-1 rounded-lg text-center text-xs font-semibold transition-all cursor-pointer ${
                        duration === opt
                          ? "bg-primary text-on-primary shadow-xs"
                          : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {opt} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Buffer */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">
                    Tiempo adicional o buffer
                  </label>
                  <div className="relative">
                    <select
                      value={bufferTime}
                      onChange={(e) => setBufferTime(Number(e.target.value))}
                      className="w-full h-10 px-3.5 pr-10 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium appearance-none focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none cursor-pointer"
                    >
                      <option value={0}>Sin tiempo adicional</option>
                      <option value={5}>5 min</option>
                      <option value={10}>10 min (limpieza / turno)</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-on-surface-variant text-[18px]">
                      unfold_more
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    Protege el intervalo entre clientes consecutivos.
                  </span>
                </div>

                {/* Precio */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">
                    Precio informativo (MXN) <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-on-surface-variant text-xs font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full h-10 pl-7 pr-14 rounded-lg bg-surface-container-low text-on-surface text-xs font-bold focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-all"
                    />
                    <span className="absolute right-3 text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">
                      MXN
                    </span>
                  </div>
                  <span className="text-[10px] text-secondary">
                    Informativo para el cliente. El pago se realiza en el local.
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN C: Asignación de colaboradores */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    ¿Quién puede realizar este servicio?
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Selecciona los profesionales de tu equipo capacitados para atender este servicio.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {collaborators.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all border border-surface-container/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shadow-xs">
                        {c.avatar}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface">{c.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{c.role}</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={c.selected}
                      onChange={() => toggleCollaborator(c.id)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary-container/40 text-on-secondary-container">
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                <span className="text-[11px]">
                  Si no seleccionas colaboradores, el servicio no podrá recibir reservas online
                  autónomas.
                </span>
              </div>
            </div>

            {/* SECCIÓN D: Visibilidad y reservas online */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    Visibilidad y reservas online
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Controla la exposición en el catálogo digital y el canal de reservas
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Toggle 1: Mostrar en mi página pública */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-on-surface">
                      Mostrar en mi página pública
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      El servicio aparece en el catálogo de{" "}
                      <span className="font-semibold text-primary">skedly.com/{businessSlug}</span>
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isVisiblePublic}
                      onChange={() => setIsVisiblePublic(!isVisiblePublic)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Toggle 2: Permitir reservas online */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-on-surface">
                      Permitir reservas online
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Los clientes pueden agendar turnos de forma autónoma según disponibilidad
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isOnlineBookingEnabled}
                      onChange={() => setIsOnlineBookingEnabled(!isOnlineBookingEnabled)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* SECCIÓN E: Botones de acción del formulario */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-12">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`order-3 sm:order-1 inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "text-error hover:bg-error-container"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isActive ? "block" : "check_circle"}
                </span>
                <span>{isActive ? "Desactivar temporalmente" : "Activar servicio"}</span>
              </button>

              <div className="order-1 sm:order-2 flex items-center justify-end gap-2.5">
                <Link
                  href="/dashboard/servicios"
                  className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all flex items-center justify-center"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 rounded-lg bg-primary text-on-primary hover:bg-primary-container shadow-xs text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{submitting ? "Guardando..." : "Guardar cambios"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* ==================== COLUMNA DERECHA: Sticky Live Card Preview ==================== */}
          <aside className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-20">
            {/* Header de Previsualización */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  phone_iphone
                </span>
                <span className="text-xs font-bold text-on-surface">Así lo verá tu cliente</span>
              </div>
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                Vista en vivo
              </span>
            </div>

            {/* Mockup Tarjeta de Reserva Pública */}
            <div className="rounded-2xl bg-surface-container-lowest shadow-md border border-surface-container overflow-hidden flex flex-col">
              {/* Context Bar */}
              <div className="p-3 bg-surface-container flex items-center justify-between border-b border-surface-container-high/60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold">
                    {businessDisplayName.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-on-surface truncate">
                    {businessDisplayName}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface text-[10px] font-semibold">
                  <span className="material-symbols-outlined text-[12px] text-primary">verified</span>
                  Oficial
                </span>
              </div>

              {/* Hero Image / Banner */}
              <div className="relative h-40 w-full bg-gradient-to-tr from-[#141b2b] via-[#2c4dd6]/40 to-[#dee1ff] overflow-hidden flex items-end p-4">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                <div className="relative z-10 w-full flex items-end justify-between text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold">
                    {categoryName}
                  </span>
                  <div className="flex items-center gap-1 text-white">
                    <span className="material-symbols-outlined text-[15px] text-amber-300">
                      star
                    </span>
                    <span className="text-xs font-bold">4.9</span>
                    <span className="text-[10px] opacity-80">(128)</span>
                  </div>
                </div>
              </div>

              {/* Contenido Central del Servicio */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-on-surface tracking-tight truncate">
                      {serviceName || "Nombre del Servicio"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-on-surface-variant text-xs font-medium">
                        <span className="material-symbols-outlined text-[15px] text-primary">
                          timer
                        </span>
                        <span>{duration} min</span>
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="text-on-surface-variant text-[11px]">Atención presencial</span>
                    </div>
                  </div>

                  {/* Precio Prominente */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xl font-bold text-primary">
                      ${price} MXN
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Pago en el local</span>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {description || "Los detalles de este servicio aparecerán aquí para tus clientes."}
                </p>

                {/* Lista de Colaboradores Asignados */}
                <div className="pt-1 flex flex-col gap-1.5 border-t border-surface-container">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface">Atendido por:</span>
                    <span className="text-[11px] text-primary font-semibold">
                      {selectedCollabs.length} profesionales disponibles
                    </span>
                  </div>
                  <div className="flex items-center -space-x-1.5 pt-0.5">
                    {selectedCollabs.map((c) => (
                      <div
                        key={c.id}
                        className="w-7 h-7 rounded-full ring-2 ring-surface-container-lowest bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[10px] shadow-xs"
                        title={c.name}
                      >
                        {c.avatar}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón Demo de Reserva */}
                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full h-11 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container transition-all group cursor-pointer"
                  >
                    <span>Reservar este servicio</span>
                    <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                      calendar_today
                    </span>
                  </button>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-on-surface-variant text-[11px]">
                    <span className="material-symbols-outlined text-[13px] text-emerald-600">
                      check_circle
                    </span>
                    <span>Confirmación inmediata por WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal Rápido: Crear Nueva Categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl p-6 shadow-xl space-y-4 border border-surface-container animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <span className="text-sm font-bold text-on-surface">Nueva Categoría</span>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej. Coloración y Matiz"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs border border-transparent focus:border-primary outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NuevoServicioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-secondary">
          Cargando editor de servicio...
        </div>
      }
    >
      <ServiceEditorContent />
    </Suspense>
  );
}
