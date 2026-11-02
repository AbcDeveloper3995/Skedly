"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

export default function ConfiguracionNegocioPage() {
  const { currentBusiness, refreshUserData } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2C4DD6");
  const [isPublished, setIsPublished] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness) {
      setName(currentBusiness.name || "");
      setSlug(currentBusiness.slug || "");
      setDescription(currentBusiness.description || "");
      setPhone(currentBusiness.phone || "");
      setEmail(currentBusiness.email || "");
      setIsPublished(currentBusiness.is_published || false);

      supabase
        .from("website_settings")
        .select("primary_color")
        .eq("business_id", currentBusiness.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.primary_color) {
            setPrimaryColor(data.primary_color);
          }
        });
    }
  }, [currentBusiness]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      // 1. Update business
      const { error: bError } = await supabase
        .from("businesses")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          is_published: isPublished,
        })
        .eq("id", currentBusiness.id);

      if (bError) throw bError;

      // 2. Update website settings
      await supabase.from("website_settings").upsert(
        {
          business_id: currentBusiness.id,
          primary_color: primaryColor,
          headline: `Bienvenido a ${name.trim()}`,
        },
        { onConflict: "business_id" }
      );

      await refreshUserData();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Error al actualizar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#45464c]">
          <Link href="/dashboard" className="hover:text-[#0b1c30]">
            Inicio
          </Link>
          <span>/</span>
          <span>Configuración</span>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Negocio</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
          Configuración del Negocio
        </h1>
        <p className="text-sm text-[#45464c] mt-0.5">
          Personaliza los datos de tu negocio, tu marca y las preferencias de tu
          página pública.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#dce9ff] p-6 lg:p-8">
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>¡Datos del negocio actualizados con éxito!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre Oficial del Negocio *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Identificador Único (Slug público)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#76777d] font-mono bg-[#eff4ff] px-3 py-2.5 rounded-lg border border-[#dce9ff]">
                skedly.app/
              </span>
              <input
                type="text"
                disabled
                value={slug}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-[#76777d] mt-1">
              El slug se utiliza para tu enlace de reservas online.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descripción del Negocio
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Presenta tu negocio y especialidad a los clientes..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Electrónico Público
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@negocio.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-[#0b1c30] outline-none focus:border-[#2c4dd6]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Color Distintivo de Marca
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
              />
              <span className="text-xs font-mono text-[#0b1c30]">
                {primaryColor}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#eff4ff] rounded-xl border border-[#dce9ff] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#0b1c30]">
                Página de Reservas Pública
              </p>
              <p className="text-[11px] text-[#45464c]">
                Permitir que los clientes accedan y reserven en tu página pública.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c4dd6]"></div>
            </label>
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2c4dd6] text-white text-xs font-semibold rounded-lg hover:bg-[#4a68f0] shadow-sm disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
