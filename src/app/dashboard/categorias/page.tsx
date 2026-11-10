"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface CategoryWithServices {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  is_active: boolean;
  icon: string;
  services: string[];
}

export default function CategoriasManagementPage() {
  const { currentBusiness } = useAuth();

  const [categories, setCategories] = useState<CategoryWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithServices | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalPriority, setModalPriority] = useState(1);
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalSaving, setModalSaving] = useState(false);

  // Reassignment Alert Banner
  const [blockedAlert, setBlockedAlert] = useState<{
    categoryName: string;
    servicesCount: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Mock initial categories matching Stitch design if DB empty
  const defaultCategories: CategoryWithServices[] = [
    {
      id: "cat-1",
      name: "Cortes de cabello",
      description:
        "Cortes clásicos, degradados modernos y estilos para niños con acabado profesional y peinado incluido.",
      priority: 1,
      is_active: true,
      icon: "content_cut",
      services: ["Corte Clásico", "Corte Premium", "Corte Infantil"],
    },
    {
      id: "cat-2",
      name: "Barba",
      description:
        "Arreglos precisos con navaja y toalla caliente para mantener un aspecto pulcro y definido.",
      priority: 2,
      is_active: true,
      icon: "face",
      services: ["Perfilado de Barba", "Afeitado Clásico"],
    },
    {
      id: "cat-3",
      name: "Tratamientos",
      description:
        "Rituales de cuidado facial y capilar con exfoliantes e hidratación profunda para revitalizar el cuero cabelludo.",
      priority: 3,
      is_active: true,
      icon: "spa",
      services: ["Tratamiento Capilar", "Exfoliación Facial"],
    },
    {
      id: "cat-4",
      name: "Coloración",
      description:
        "Tintes orgánicos, mechas platinadas, cobertura de canas y decoloraciones de precisión técnica.",
      priority: 4,
      is_active: false,
      icon: "palette",
      services: [],
    },
  ];

  const loadCategories = async (businessId: string) => {
    setLoading(true);
    try {
      const { data: catData } = await supabase
        .from("service_categories")
        .select("*")
        .eq("business_id", businessId)
        .order("display_order", { ascending: true });

      const { data: srvData } = await supabase
        .from("services")
        .select("id, name, category_id")
        .eq("business_id", businessId);

      if (catData && catData.length > 0) {
        const mapped: CategoryWithServices[] = catData.map((c: any, index: number) => {
          const linkedServices = (srvData || [])
            .filter((s: any) => s.category_id === c.id)
            .map((s: any) => s.name);

          let icon = "category";
          const lower = (c.name || "").toLowerCase();
          if (lower.includes("corte")) icon = "content_cut";
          else if (lower.includes("barba") || lower.includes("afeit")) icon = "face";
          else if (lower.includes("tratamiento") || lower.includes("spa")) icon = "spa";
          else if (lower.includes("color") || lower.includes("tinte")) icon = "palette";

          return {
            id: c.id,
            name: c.name,
            description: c.description || null,
            priority: c.display_order || index + 1,
            is_active: c.is_active !== false,
            icon,
            services: linkedServices,
          };
        });
        setCategories(mapped);
      } else {
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness?.id) {
      loadCategories(currentBusiness.id);
    } else {
      setCategories(defaultCategories);
      setLoading(false);
    }
  }, [currentBusiness]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalName("");
    setModalDescription("");
    setModalPriority(categories.length + 1);
    setModalIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (cat: CategoryWithServices) => {
    setEditingCategory(cat);
    setModalName(cat.name);
    setModalDescription(cat.description || "");
    setModalPriority(cat.priority);
    setModalIsActive(cat.is_active);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;
    setModalSaving(true);

    const nameTrimmed = modalName.trim();
    let icon = "category";
    const lower = nameTrimmed.toLowerCase();
    if (lower.includes("corte")) icon = "content_cut";
    else if (lower.includes("barba") || lower.includes("afeit")) icon = "face";
    else if (lower.includes("tratamiento") || lower.includes("spa")) icon = "spa";
    else if (lower.includes("color") || lower.includes("tinte")) icon = "palette";

    if (editingCategory) {
      // Update
      const updated: CategoryWithServices = {
        ...editingCategory,
        name: nameTrimmed,
        description: modalDescription.trim() || null,
        priority: modalPriority,
        is_active: modalIsActive,
        icon,
      };

      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? updated : c))
      );

      if (currentBusiness?.id && editingCategory.id.length > 20) {
        try {
          await supabase
            .from("service_categories")
            .update({
              name: updated.name,
              description: updated.description,
              display_order: updated.priority,
              is_active: updated.is_active,
            })
            .eq("id", editingCategory.id)
            .eq("business_id", currentBusiness.id);
        } catch (e) {
          console.error("Update category error:", e);
        }
      }
      showToast(`Categoría "${updated.name}" actualizada con éxito.`);
    } else {
      // Create
      const newCat: CategoryWithServices = {
        id: "cat-new-" + Date.now(),
        name: nameTrimmed,
        description: modalDescription.trim() || null,
        priority: modalPriority,
        is_active: modalIsActive,
        icon,
        services: [],
      };

      setCategories((prev) => [...prev, newCat]);

      if (currentBusiness?.id) {
        try {
          await supabase.from("service_categories").insert({
            business_id: currentBusiness.id,
            name: newCat.name,
            description: newCat.description,
            display_order: newCat.priority,
            is_active: newCat.is_active,
          });
        } catch (e) {
          console.error("Create category error:", e);
        }
      }
      showToast(`Categoría "${newCat.name}" creada con éxito.`);
    }

    setModalSaving(false);
    setIsModalOpen(false);
  };

  // Toggle category active
  const toggleCategoryActive = async (cat: CategoryWithServices) => {
    const nextStatus = !cat.is_active;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextStatus } : c))
    );

    if (currentBusiness?.id && cat.id.length > 20) {
      try {
        await supabase
          .from("service_categories")
          .update({ is_active: nextStatus })
          .eq("id", cat.id)
          .eq("business_id", currentBusiness.id);
      } catch (e) {
        console.error("Toggle category error:", e);
      }
    }

    showToast(
      nextStatus
        ? `"${cat.name}" ahora es visible en tu web de reservas.`
        : `"${cat.name}" se ocultó de tu página de reservas.`
    );
  };

  // Delete category with safety check
  const handleDeleteCategory = async (cat: CategoryWithServices) => {
    if (cat.services && cat.services.length > 0) {
      // Block action and show warning banner
      setBlockedAlert({
        categoryName: cat.name,
        servicesCount: cat.services.length,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Allowed to delete
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));

    if (currentBusiness?.id && cat.id.length > 20) {
      try {
        await supabase
          .from("service_categories")
          .delete()
          .eq("id", cat.id)
          .eq("business_id", currentBusiness.id);
      } catch (e) {
        console.error("Delete category error:", e);
      }
    }

    showToast(`Categoría "${cat.name}" eliminada.`);
  };

  // Metrics
  const totalAssignedServices = useMemo(
    () => categories.reduce((acc, c) => acc + (c.services?.length || 0), 0),
    [categories]
  );
  const activeCount = useMemo(() => categories.filter((c) => c.is_active).length, [categories]);
  const inactiveCount = useMemo(() => categories.filter((c) => !c.is_active).length, [categories]);

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface-container-lowest px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-surface-container-high">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Encabezado con navegación de regreso */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold mb-1">
              <Link
                href="/dashboard/servicios"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Volver a Servicios</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Categorías de servicios
            </h1>
            <p className="text-sm text-on-surface-variant max-w-2xl">
              Organiza tus servicios en grupos claros para que tus clientes encuentren rápidamente lo
              que buscan en tu página pública.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setSimulateEmpty(!simulateEmpty)}
              className="px-3.5 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs border border-surface-container-high/60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>{simulateEmpty ? "Restaurar categorías" : "Simular sin categorías"}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nueva categoría</span>
            </button>
          </div>
        </div>

        {/* 3 Tarjetas de Métricas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">category</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Total categorías
              </span>
              <span className="text-2xl font-bold text-on-surface">{categories.length}</span>
              <span className="text-[11px] text-secondary">Registradas en el negocio</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[24px]">content_cut</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Servicios asignados
              </span>
              <span className="text-2xl font-bold text-on-surface">{totalAssignedServices}</span>
              <span className="text-[11px] text-secondary">Distribuidos en el catálogo</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
              <span className="material-symbols-outlined text-[24px]">public</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Visibles en web
              </span>
              <span className="text-2xl font-bold text-on-surface">{activeCount}</span>
              <span className="text-[11px] text-secondary">{inactiveCount} en preparación</span>
            </div>
          </div>
        </div>

        {/* Banner de Advertencia de Bloqueo por Reasignación */}
        {blockedAlert && (
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-md border-l-4 border-l-error border border-surface-container animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-on-surface">
                    Acción bloqueada: No se puede eliminar la categoría
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    No puedes eliminar{" "}
                    <strong className="text-on-surface">
                      &quot;{blockedAlert.categoryName}&quot;
                    </strong>{" "}
                    porque contiene{" "}
                    <span className="font-semibold text-error">
                      {blockedAlert.servicesCount} servicios activos
                    </span>
                    . Reasigna o elimina los servicios antes de borrar esta categoría.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <Link
                  href="/dashboard/servicios"
                  className="px-3.5 h-9 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Reasignar servicios</span>
                </Link>
                <button
                  type="button"
                  aria-label="Cerrar advertencia"
                  onClick={() => setBlockedAlert(null)}
                  className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejilla de Categorías o Vista Vacía */}
        {simulateEmpty || categories.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-12 shadow-sm border border-surface-container text-center flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[36px]">category</span>
            </div>
            <div className="flex flex-col gap-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-on-surface">
                Todavía no tienes categorías creadas
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Las categorías agrupan tus servicios en secciones como &quot;Cortes&quot;, &quot;Barbería&quot; o
                &quot;Tratamientos&quot; para que tus clientes elijan de manera clara en tu página de reservas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Crear primera categoría</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-3">
                  {/* Top Bar of Category Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-on-surface truncate">{cat.name}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                            Prioridad {cat.priority}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          {cat.services.length} servicios vinculados
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        cat.is_active
                          ? "bg-surface-container text-on-surface"
                          : "bg-surface-container-low text-secondary opacity-75"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cat.is_active ? "bg-primary" : "bg-secondary"
                        }`}
                      ></span>
                      <span>{cat.is_active ? "Activa" : "Inactiva"}</span>
                    </span>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {cat.description || "Sin descripción asignada para esta categoría."}
                  </p>

                  {/* Servicios vinculados Tags */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                      Servicios en esta categoría
                    </span>
                    {cat.services.length === 0 ? (
                      <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs flex items-center gap-2 border border-surface-container">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <span>No hay servicios asignados a esta categoría todavía.</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {cat.services.map((srv, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-medium border border-surface-container-high/60"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-container">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cat.is_active}
                      onChange={() => toggleCategoryActive(cat)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    <span className="text-xs text-on-surface-variant font-medium">Visible en web</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      title="Eliminar categoría"
                      className="p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banner: Orden en tu sitio de reservas */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">drag_indicator</span>
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-on-surface">Orden en tu sitio de reservas</h4>
              <p className="text-xs text-on-surface-variant">
                El orden configurado aquí determina exactamente la disposición de las pestañas que ven
                tus clientes en tu página pública.
              </p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            className="px-4 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Previsualizar reservas</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MODAL: NUEVA CATEGORÍA / EDITAR CATEGORÍA
      ========================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-surface-container animate-scale-up">
            <div className="px-5 py-3.5 flex items-center justify-between bg-surface-container-low border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">category</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">
                  {editingCategory ? "Editar categoría" : "Nueva categoría"}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">
                  Nombre de la categoría <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Ej. Coloración y Tintes"
                  className="h-10 px-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-colors"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Se mostrará como pestaña de sección principal en tu catálogo público.
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">
                  Descripción <span className="text-outline font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Ej. Tintes profesionales, decoloraciones y matices con productos veganos..."
                  className="p-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none transition-colors resize-none"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Breve explicación para orientar al cliente al reservar.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">Prioridad / Orden</label>
                  <input
                    type="number"
                    min="1"
                    value={modalPriority}
                    onChange={(e) => setModalPriority(Number(e.target.value))}
                    className="h-10 px-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest border border-transparent focus:border-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 justify-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalIsActive}
                      onChange={(e) => setModalIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    <span className="text-xs text-on-surface font-semibold">Visible en web</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all"
                >
                  {modalSaving ? "Guardando..." : "Guardar categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
