"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

function ConfiguracionContent() {
  const searchParams = useSearchParams();
  const { currentBusiness, refreshUserData } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"general" | "public_booking">("general");

  // SECTION A: General Information
  const [bizName, setBizName] = useState("Urban Cuts Grooming Studio");
  const [bizSlogan, setBizSlogan] = useState("Tu estilo, nuestra especialidad");
  const [bizCat, setBizCat] = useState("barberia");
  const [bizTz, setBizTz] = useState("mexico");
  const [bizDesc, setBizDesc] = useState(
    "Experiencia de barbería artesanal contemporánea en el corazón de la Roma Norte. Cortes de alta precisión, afeitado tradicional y cuidado masculino sin fricción."
  );

  // Contact & Location
  const [bizPhone, setBizPhone] = useState("+52 55 9123 4567");
  const [bizEmail, setBizEmail] = useState("contacto@urbancuts.mx");
  const [bizStreet, setBizStreet] = useState("Colima 152, Interior 3B");
  const [bizCol, setBizCol] = useState("Roma Norte, Cuauhtémoc");
  const [bizCity, setBizCity] = useState("Ciudad de México");
  const [bizState, setBizState] = useState("CDMX");
  const [bizZip, setBizZip] = useState("06700");
  const [bizCountry, setBizCountry] = useState("México");

  // Visual Identity & Branding
  const [logoInitials, setLogoInitials] = useState("UC");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2C4DD6");
  const presetColors = ["#2C4DD6", "#059669", "#EA580C", "#18181B", "#7C3AED"];
  const [coverUrl, setCoverUrl] = useState("https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80");
  const [galleryImages, setGalleryImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
  ]);

  // SECTION B: Public Booking Preferences
  const [slug, setSlug] = useState("urban-cuts");
  const [showHero, setShowHero] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showStaff, setShowStaff] = useState(true);
  const [showGallery, setShowGallery] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [showMap, setShowMap] = useState(true);

  // Booking Rules
  const [confirmationMode, setConfirmationMode] = useState<"auto" | "manual">("auto");
  const [minNotice, setMinNotice] = useState("2");
  const [maxNotice, setMaxNotice] = useState("30");
  const [allowAnyStaff, setAllowAnyStaff] = useState(true);
  const [requireEmail, setRequireEmail] = useState(true);
  const [cancelPolicy, setCancelPolicy] = useState(
    "Cancelación gratuita hasta 2 horas antes de tu turno. Te agradecemos avisar con anticipación para liberar el sillón y reorganizar la agenda del barbero."
  );
  const [pauseBookings, setPauseBookings] = useState(false);

  // Device switcher for preview
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");

  // Actions feedback
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Load from current business if available
  useEffect(() => {
    if (currentBusiness) {
      if (currentBusiness.name) setBizName(currentBusiness.name);
      if (currentBusiness.slug) setSlug(currentBusiness.slug);
      if (currentBusiness.description) setBizDesc(currentBusiness.description);
      if (currentBusiness.phone) setBizPhone(currentBusiness.phone);
      if (currentBusiness.email) setBizEmail(currentBusiness.email);

      const words = (currentBusiness.name || "Urban Cuts").split(" ");
      const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0].slice(0, 2);
      setLogoInitials(initials.toUpperCase());

      // Fetch website settings from Supabase
      supabase
        .from("website_settings")
        .select("*")
        .eq("business_id", currentBusiness.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.primary_color) setPrimaryColor(data.primary_color);
            if (data.headline) setBizSlogan(data.headline);
            if (data.cover_url) setCoverUrl(data.cover_url);
            if (data.logo_url) setLogoUrl(data.logo_url);
            if (data.booking_enabled !== undefined && data.booking_enabled !== null) {
              setPauseBookings(!data.booking_enabled);
            }
            if (data.show_employee_profiles !== undefined && data.show_employee_profiles !== null) {
              setShowStaff(data.show_employee_profiles);
            }
            if (data.show_prices !== undefined && data.show_prices !== null) {
              setShowServices(data.show_prices);
            }
            if (data.about_text) {
              try {
                const parsed = JSON.parse(data.about_text);
                if (parsed.description) setBizDesc(parsed.description);
                if (Array.isArray(parsed.gallery) && parsed.gallery.length > 0) {
                  setGalleryImages(parsed.gallery);
                }
                if (parsed.addressDetails) {
                  if (parsed.addressDetails.street) setBizStreet(parsed.addressDetails.street);
                  if (parsed.addressDetails.col) setBizCol(parsed.addressDetails.col);
                  if (parsed.addressDetails.city) setBizCity(parsed.addressDetails.city);
                  if (parsed.addressDetails.state) setBizState(parsed.addressDetails.state);
                  if (parsed.addressDetails.zip) setBizZip(parsed.addressDetails.zip);
                  if (parsed.addressDetails.country) setBizCountry(parsed.addressDetails.country);
                }
                if (parsed.sections) {
                  if (parsed.sections.showHero !== undefined) setShowHero(parsed.sections.showHero);
                  if (parsed.sections.showServices !== undefined) setShowServices(parsed.sections.showServices);
                  if (parsed.sections.showStaff !== undefined) setShowStaff(parsed.sections.showStaff);
                  if (parsed.sections.showGallery !== undefined) setShowGallery(parsed.sections.showGallery);
                  if (parsed.sections.showReviews !== undefined) setShowReviews(parsed.sections.showReviews);
                  if (parsed.sections.showMap !== undefined) setShowMap(parsed.sections.showMap);
                }
              } catch {
                setBizDesc(data.about_text);
              }
            }
          }
        });
    }
  }, [currentBusiness]);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentBusiness?.id) {
        // 1. Update businesses table
        await supabase
          .from("businesses")
          .update({
            name: bizName.trim(),
            slug: slug.trim(),
            description: bizDesc.trim() || null,
            phone: bizPhone.trim() || null,
            email: bizEmail.trim() || null,
          })
          .eq("id", currentBusiness.id);

        // 2. Encode gallery, description, address, and visible sections for website_settings
        const fullAddress = [bizStreet, bizCol, bizCity, bizState, bizCountry].filter(Boolean).join(", ");
        const aboutPayload = JSON.stringify({
          description: bizDesc.trim(),
          gallery: galleryImages,
          address: fullAddress,
          addressDetails: {
            street: bizStreet,
            col: bizCol,
            city: bizCity,
            state: bizState,
            zip: bizZip,
            country: bizCountry,
          },
          sections: {
            showHero,
            showServices,
            showStaff,
            showGallery,
            showReviews,
            showMap,
          },
        });

        // 3. Upsert website_settings table
        await supabase
          .from("website_settings")
          .upsert({
            business_id: currentBusiness.id,
            headline: bizSlogan.trim(),
            about_text: aboutPayload,
            cover_url: coverUrl.trim() || null,
            logo_url: logoUrl.trim() || null,
            primary_color: primaryColor,
            show_prices: showServices,
            show_employee_profiles: showStaff,
            booking_enabled: !pauseBookings,
            updated_at: new Date().toISOString(),
          });

        if (refreshUserData) {
          await refreshUserData();
        }
      }
      setToastMsg("¡Configuración guardada exitosamente en la base de datos!");
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      console.warn("Error saving settings:", err);
      setToastMsg("Error al guardar la configuración.");
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = () => {
    const fullUrl = `https://skedly.com/${slug}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-16">
      {/* SUCCESS TOAST */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#009842] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
              Configuración del negocio
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Sincronizado
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#575e70] max-w-2xl">
            Personaliza los datos de tu empresa, tu identidad de marca y cómo ven los clientes tu negocio.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/reservas/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0e3e5] shadow-xs hover:bg-[#f2f4f6] text-[#191c1e] text-xs font-semibold transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#2c4dd6]">visibility</span>
            <span>Ver página pública</span>
            <span className="material-symbols-outlined text-[15px] text-[#575e70]">open_in_new</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "hourglass_top" : "check_circle"}
            </span>
            <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL SUB-NAVIGATION TABS */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 p-1.5 bg-[#f2f4f6] rounded-2xl min-w-max border border-[#e0e3e5]/60">
          <button
            onClick={() => setActiveTab("general")}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "general"
                ? "bg-white text-[#2c4dd6] shadow-xs"
                : "text-[#575e70] hover:text-[#191c1e] hover:bg-white/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Información e Identidad visual</span>
          </button>
          <button
            onClick={() => setActiveTab("public_booking")}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "public_booking"
                ? "bg-white text-[#2c4dd6] shadow-xs"
                : "text-[#575e70] hover:text-[#191c1e] hover:bg-white/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">language</span>
            <span>Página pública y reservas</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CONFIGURATION COLUMN (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === "general" ? (
            <>
              {/* SECTION 1: INFORMACIÓN GENERAL */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center justify-between pb-1 border-b border-[#eceef0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
                      <span className="material-symbols-outlined text-[22px]">badge</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#191c1e]">Información general</h2>
                      <p className="text-xs text-[#575e70]">
                        Detalles esenciales visibles en reservas, tickets y comprobantes.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#2c4dd6] bg-[#dee1ff]/60 px-2.5 py-0.5 rounded-full">
                    Obligatorio
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre comercial */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#191c1e] flex items-center gap-1">
                      Nombre comercial del negocio
                      <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-[#747686]">
                        store
                      </span>
                      <input
                        type="text"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Eslogan */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Eslogan / Subtítulo breve
                    </label>
                    <input
                      type="text"
                      value={bizSlogan}
                      onChange={(e) => setBizSlogan(e.target.value)}
                      placeholder="Ej. Tu estilo, nuestra especialidad"
                      className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                    />
                  </div>

                  {/* Industria */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Industria / Categoría principal
                    </label>
                    <div className="relative">
                      <select
                        value={bizCat}
                        onChange={(e) => setBizCat(e.target.value)}
                        className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all cursor-pointer"
                      >
                        <option value="barberia">Barbería y Peluquería Masculina</option>
                        <option value="salon">Salón de Belleza y Peluquería</option>
                        <option value="spa">Spa, Masajes y Relajación</option>
                        <option value="bienestar">Bienestar y Estética Avanzada</option>
                        <option value="consultorio">Consultorio / Terapia Privada</option>
                        <option value="otros">Otros servicios profesionales</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3.5 top-3 text-[20px] text-[#747686] pointer-events-none">
                        unfold_more
                      </span>
                    </div>
                  </div>

                  {/* Zona Horaria */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Zona horaria operativa
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-[#747686]">
                        schedule
                      </span>
                      <select
                        value={bizTz}
                        onChange={(e) => setBizTz(e.target.value)}
                        className="w-full h-11 pl-11 pr-10 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all cursor-pointer"
                      >
                        <option value="mexico">América/Ciudad_de_México (GMT-6)</option>
                        <option value="bogota">América/Bogotá (GMT-5)</option>
                        <option value="madrid">Europa/Madrid (GMT+1)</option>
                        <option value="santiago">América/Santiago (GMT-4)</option>
                        <option value="buenos_aires">América/Argentina/Buenos_Aires (GMT-3)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3.5 top-3 text-[20px] text-[#747686] pointer-events-none">
                        unfold_more
                      </span>
                    </div>
                  </div>

                  {/* Descripción comercial */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#191c1e]">
                        Descripción comercial
                      </label>
                      <span className="text-[11px] text-[#575e70]">
                        {bizDesc.length} / 300
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={bizDesc}
                      onChange={(e) => setBizDesc(e.target.value)}
                      className="w-full p-3.5 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all resize-none"
                    />
                    <span className="text-[11px] text-[#575e70]">
                      Esta descripción aparecerá destacada en el banner principal de tu página de reservas en línea.
                    </span>
                  </div>
                </div>
              </section>

              {/* SECTION 2: UBICACIÓN Y CANALES DE CONTACTO */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-1 border-b border-[#eceef0]">
                  <div className="w-10 h-10 rounded-xl bg-[#dce2f7] flex items-center justify-center text-[#575e70]">
                    <span className="material-symbols-outlined text-[22px]">pin_drop</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#191c1e]">
                      Ubicación y Canales de Contacto
                    </h2>
                    <p className="text-xs text-[#575e70]">
                      Dirección geográfica y datos para llamadas y notificaciones automatizadas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Teléfono oficial */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Teléfono de atención al cliente
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-[#747686]">
                        call
                      </span>
                      <input
                        type="tel"
                        value={bizPhone}
                        onChange={(e) => setBizPhone(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Correo oficial */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Correo electrónico oficial
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-[#747686]">
                        mail
                      </span>
                      <input
                        type="email"
                        value={bizEmail}
                        onChange={(e) => setBizEmail(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Calle y número */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Calle, número exterior e interior
                    </label>
                    <input
                      type="text"
                      value={bizStreet}
                      onChange={(e) => setBizStreet(e.target.value)}
                      className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                    />
                  </div>

                  {/* Colonia */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Colonia / Barrio / Sector
                    </label>
                    <input
                      type="text"
                      value={bizCol}
                      onChange={(e) => setBizCol(e.target.value)}
                      className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                    />
                  </div>

                  {/* Ciudad */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={bizCity}
                      onChange={(e) => setBizCity(e.target.value)}
                      className="w-full h-11 px-4 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                    />
                  </div>

                  {/* Estado / CP / País */}
                  <div className="grid grid-cols-3 gap-3 md:col-span-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#191c1e]">Estado</label>
                      <input
                        type="text"
                        value={bizState}
                        onChange={(e) => setBizState(e.target.value)}
                        className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#191c1e]">C.P.</label>
                      <input
                        type="text"
                        value={bizZip}
                        onChange={(e) => setBizZip(e.target.value)}
                        className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#191c1e]">País</label>
                      <input
                        type="text"
                        value={bizCountry}
                        onChange={(e) => setBizCountry(e.target.value)}
                        className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all"
                      />
                    </div>
                  </div>

                  {/* Vista previa en vivo del mapa de Google Maps */}
                  <div className="md:col-span-2 mt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#191c1e] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#2c4dd6] text-[18px]">map</span>
                        <span>Ubicación en Google Maps en tiempo real</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sincronizado con página pública
                      </span>
                    </div>
                    <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-[#eceef0] border border-[#e0e3e5] shadow-xs">
                      <iframe
                        title="Vista previa de Google Maps"
                        width="100%"
                        height="100%"
                        className="w-full h-full border-0"
                        loading="lazy"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(
                          [bizStreet, bizCol, bizCity, bizState, bizCountry].filter(Boolean).join(", ") || bizName
                        )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      />
                    </div>
                    <p className="text-[11px] text-[#575e70]">
                      El mapa se actualiza automáticamente con la dirección ingresada arriba. Esta misma ubicación exacta y el botón de navegación interactivo se mostrarán a tus clientes en la página pública de reservas.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 3: IDENTIDAD VISUAL & BRANDING */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-1 border-b border-[#eceef0]">
                  <div className="w-10 h-10 rounded-xl bg-[#d8e2ff] flex items-center justify-center text-[#0058be]">
                    <span className="material-symbols-outlined text-[22px]">brush</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#191c1e]">
                      Identidad Visual & Branding
                    </h2>
                    <p className="text-xs text-[#575e70]">
                      Personaliza el logotipo, portadas y la paleta de colores para tu storefront.
                    </p>
                  </div>
                </div>

                {/* Logotipo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f2f4f6] rounded-xl">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {logoInitials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#191c1e]">
                        Logotipo principal
                      </span>
                      <span className="text-[11px] text-[#575e70]">
                        Recomendado: PNG o SVG cuadrado de al menos 400x400px.
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">
                          <span className="material-symbols-outlined text-[12px]">check</span> Activo
                        </span>
                        <span className="text-[10px] text-[#575e70]">logo_{slug}.svg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-white text-[#191c1e] hover:bg-[#eceef0] text-xs font-semibold shadow-xs transition-colors border border-[#e0e3e5]"
                    >
                      Reemplazar
                    </button>
                  </div>
                </div>

                {/* Color principal de acento */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-[#191c1e]">
                        Color principal de acento
                      </label>
                      <p className="text-[11px] text-[#575e70]">
                        Aplica a los botones de reserva, fechas activas y etiquetas principales.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#f2f4f6] px-3 py-1 rounded-lg">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      ></div>
                      <span className="font-mono text-xs text-[#191c1e] font-semibold uppercase">
                        {primaryColor}
                      </span>
                    </div>
                  </div>

                  {/* Preset colors */}
                  <div className="flex items-center gap-3 flex-wrap pt-1">
                    {presetColors.map((color) => {
                      const isSelected = primaryColor.toLowerCase() === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setPrimaryColor(color)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs transition-all transform hover:scale-105 ${
                            isSelected ? "ring-4 ring-[#2c4dd6]/30 scale-105" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          )}
                        </button>
                      );
                    })}

                    {/* Native Picker */}
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                      <div className="h-10 px-3 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] flex items-center gap-1.5 text-xs font-semibold text-[#191c1e] transition-colors cursor-pointer border border-[#e0e3e5]">
                        <span className="material-symbols-outlined text-[18px] text-[#575e70]">
                          colorize
                        </span>
                        <span>Personalizado</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IMAGEN DE PORTADA / HERO BANNER */}
                <div className="flex flex-col gap-3 pt-4 border-t border-[#eceef0]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-[#191c1e] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#2c4dd6] text-[18px]">panorama</span>
                        <span>Imagen de Portada (Sección Hero)</span>
                      </label>
                      <p className="text-[11px] text-[#575e70]">
                        Es la imagen principal de bienvenida que ven tus clientes al entrar a tu página web de reservas.
                      </p>
                    </div>
                    <span className="text-[10px] text-[#2c4dd6] font-semibold bg-[#dee1ff] px-2 py-0.5 rounded-full">
                      Recomendado 1600x900px
                    </span>
                  </div>

                  {/* Visual Preview of Cover */}
                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-[#e0e3e5] shadow-xs group bg-[#191c1e]">
                    <img
                      src={coverUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80"}
                      alt="Portada del negocio"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-xs font-bold leading-tight">{bizName}</p>
                          <p className="text-white/80 text-[11px]">{bizSlogan}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newUrl = prompt("Ingresa la URL de la imagen de portada (Hero):", coverUrl);
                            if (newUrl !== null && newUrl.trim()) setCoverUrl(newUrl.trim());
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#191c1e] text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Cambiar imagen</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Input URL Directo y Presets */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 w-full flex items-center bg-[#f2f4f6] rounded-xl px-3 py-2 border border-[#e0e3e5]">
                      <span className="material-symbols-outlined text-[#575e70] text-[18px] mr-2">link</span>
                      <input
                        type="url"
                        placeholder="Pega la URL de tu foto de portada..."
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#191c1e] outline-none"
                      />
                    </div>
                  </div>

                  {/* Presets Rápidos */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#575e70]">O elige una portada recomendada:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Barbería Clásica", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80" },
                        { label: "Estudio Vintage", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&auto=format&fit=crop&q=80" },
                        { label: "Salón Moderno", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&auto=format&fit=crop&q=80" },
                        { label: "Grooming & Relax", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1600&auto=format&fit=crop&q=80" },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCoverUrl(preset.url)}
                          className={`relative h-16 rounded-xl overflow-hidden border text-left p-2 flex items-end transition-all ${
                            coverUrl === preset.url
                              ? "border-[#2c4dd6] ring-2 ring-[#2c4dd6]/40 shadow-sm"
                              : "border-[#e0e3e5] hover:border-[#2c4dd6]/60 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img src={preset.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50"></div>
                          <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-sm truncate">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: GALERÍA DE FOTOS DEL NEGOCIO */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#eceef0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
                      <span className="material-symbols-outlined text-[24px]">photo_library</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#191c1e]">
                        Galería de fotos del negocio
                      </h2>
                      <p className="text-xs text-[#575e70]">
                        Fotos de tus instalaciones, sillones y trabajos para mostrar en tu página pública.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#575e70] bg-[#f2f4f6] px-2.5 py-1 rounded-lg">
                      {galleryImages.length} fotos activas
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newUrl = prompt("Ingresa la URL de la nueva foto para la galería:");
                        if (newUrl !== null && newUrl.trim()) {
                          setGalleryImages((prev) => [...prev, newUrl.trim()]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#2c4dd6] hover:bg-[#4a68f0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                      <span>Agregar foto</span>
                    </button>
                  </div>
                </div>

                {/* Grid of Current Gallery Photos */}
                {galleryImages.length === 0 ? (
                  <div className="py-12 px-4 rounded-xl bg-[#f2f4f6] border border-dashed border-[#e0e3e5] text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#575e70] shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">no_photography</span>
                    </div>
                    <p className="text-xs font-bold text-[#191c1e]">Aún no tienes fotos en la galería</p>
                    <p className="text-[11px] text-[#575e70] max-w-sm">
                      Agrega fotos de tu local o de tus mejores cortes para inspirar confianza en nuevos clientes.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryImages([
                          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
                          "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80",
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
                          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
                        ])
                      }
                      className="mt-1 px-3 py-1.5 rounded-lg bg-white border border-[#e0e3e5] text-[#2c4dd6] text-xs font-semibold hover:bg-white shadow-xs cursor-pointer"
                    >
                      Cargar 4 fotos de muestra
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {galleryImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="group relative h-36 rounded-xl overflow-hidden border border-[#e0e3e5] shadow-xs bg-[#f2f4f6]"
                      >
                        <img
                          src={imgUrl}
                          alt={`Galería ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newUrl = prompt("Editar URL de esta foto:", imgUrl);
                              if (newUrl !== null && newUrl.trim()) {
                                setGalleryImages((prev) =>
                                  prev.map((item, i) => (i === index ? newUrl.trim() : item))
                                );
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white text-[#191c1e] hover:bg-[#f2f4f6] flex items-center justify-center shadow-md transition-all cursor-pointer"
                            title="Cambiar foto"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setGalleryImages((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="w-8 h-8 rounded-full bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center shadow-md transition-all cursor-pointer"
                            title="Eliminar de galería"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            /* TAB 2: PÁGINA PÚBLICA Y PREFERENCIAS DE RESERVA */
            <>
              {/* SECTION: Configuración de la Página Pública */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center justify-between pb-1 border-b border-[#eceef0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
                      <span className="material-symbols-outlined text-[24px]">public</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#191c1e]">
                        Página pública de reservas
                      </h2>
                      <p className="text-xs text-[#575e70]">
                        Tu vitrina digital personalizada para capturar clientes en piloto automático.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    En vivo
                  </span>
                </div>

                {/* Slug Box */}
                <div className="flex flex-col gap-2 bg-[#f2f4f6] p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#191c1e]">
                      Enlace público personalizado (Slug)
                    </span>
                    <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Enlace activo
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 flex items-center bg-white rounded-xl px-3 py-2 shadow-xs border border-[#e0e3e5]">
                      <span className="text-[#575e70] text-xs select-none">skedly.com/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) =>
                          setSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "")
                          )
                        }
                        className="w-full bg-transparent text-xs font-bold text-[#191c1e] outline-none ml-0.5 tracking-tight"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyPublicLink}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#eceef0] text-[#191c1e] text-xs font-semibold shadow-xs border border-[#e0e3e5] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedSlug ? "check" : "content_copy"}
                        </span>
                        <span>{copiedSlug ? "¡Copiado!" : "Copiar enlace"}</span>
                      </button>
                      <Link
                        href={`/reservas/${slug}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-white hover:bg-[#eceef0] text-[#191c1e] shadow-xs border border-[#e0e3e5] transition-colors flex items-center justify-center"
                        title="Abrir en pestaña nueva"
                      >
                        <span className="material-symbols-outlined text-[18px]">launch</span>
                      </Link>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#575e70]">
                    Comparte este link en tu biografía de Instagram, WhatsApp Business o códigos QR en tu mostrador.
                  </p>
                </div>

                {/* Secciones Visibles Switches */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#191c1e]">
                      Secciones visibles para el cliente
                    </span>
                    <span className="text-[11px] text-[#575e70]">
                      Configura los bloques del flujo web
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Hero */}
                    <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors">
                          Hero y presentación
                        </span>
                        <span className="text-[11px] text-[#575e70]">
                          Cabecera con logo, slogan e imágenes
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showHero}
                        onChange={(e) => setShowHero(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                    </label>

                    {/* Catálogo */}
                    <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors">
                          Catálogo de servicios
                        </span>
                        <span className="text-[11px] text-[#575e70]">
                          Despliegue categorizado con precios y tiempos
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showServices}
                        onChange={(e) => setShowServices(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                    </label>

                    {/* Equipo */}
                    <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors">
                          Equipo de profesionales
                        </span>
                        <span className="text-[11px] text-[#575e70]">
                          Permite elegir barbero específico
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showStaff}
                        onChange={(e) => setShowStaff(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                    </label>

                    {/* Galería */}
                    <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors">
                          Galería de fotos
                        </span>
                        <span className="text-[11px] text-[#575e70]">
                          Imágenes del local y estilo visual
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showGallery}
                        onChange={(e) => setShowGallery(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                    </label>

                    {/* Reseñas */}
                    <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors">
                          Reseñas verificadas
                        </span>
                        <span className="text-[11px] text-[#575e70]">
                          Testimonios auténticos y promedio de estrellas
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showReviews}
                        onChange={(e) => setShowReviews(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                    </label>

                    {/* Ubicación y mapa */}
                    <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#2c4dd6] transition-colors">
                          Ubicación y mapa interactivo
                        </span>
                        <span className="text-[11px] text-[#575e70]">
                          Dirección física con Google Maps
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showMap}
                        onChange={(e) => setShowMap(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* SECTION: Reglas y Preferencias de Reserva */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-1 border-b border-[#eceef0]">
                  <div className="w-10 h-10 rounded-xl bg-[#dee1ff] flex items-center justify-center text-[#2c4dd6]">
                    <span className="material-symbols-outlined text-[24px]">tune</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#191c1e]">
                      Preferencias de reservas
                    </h2>
                    <p className="text-xs text-[#575e70]">
                      Define el comportamiento y las reglas de agendamiento para tus clientes.
                    </p>
                  </div>
                </div>

                {/* Modo de Confirmación */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-semibold text-[#191c1e]">
                    Modo de confirmación de citas
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Auto */}
                    <label
                      onClick={() => setConfirmationMode("auto")}
                      className={`p-3.5 rounded-xl cursor-pointer flex flex-col gap-1 transition-all border ${
                        confirmationMode === "auto"
                          ? "bg-[#dee1ff]/30 border-[#2c4dd6] ring-1 ring-[#2c4dd6]"
                          : "bg-[#f2f4f6] border-transparent hover:bg-[#eceef0]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#2c4dd6] text-[18px]">
                            bolt
                          </span>
                          <span className="text-xs font-bold text-[#2c4dd6]">
                            Confirmación instantánea
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="conf_mode"
                          checked={confirmationMode === "auto"}
                          onChange={() => setConfirmationMode("auto")}
                          className="accent-[#2c4dd6]"
                        />
                      </div>
                      <p className="text-[11px] text-[#191c1e] mt-1 leading-snug">
                        El turno queda agendado de inmediato si hay disponibilidad. Máxima conversión y sin fricción manual.
                      </p>
                      <span className="text-[10px] text-[#2c4dd6] font-semibold mt-1">
                        Recomendado para barberías y salones
                      </span>
                    </label>

                    {/* Manual */}
                    <label
                      onClick={() => setConfirmationMode("manual")}
                      className={`p-3.5 rounded-xl cursor-pointer flex flex-col gap-1 transition-all border ${
                        confirmationMode === "manual"
                          ? "bg-[#dee1ff]/30 border-[#2c4dd6] ring-1 ring-[#2c4dd6]"
                          : "bg-[#f2f4f6] border-transparent hover:bg-[#eceef0]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#575e70] text-[18px]">
                            pending_actions
                          </span>
                          <span className="text-xs font-bold text-[#191c1e]">
                            Aprobación manual
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="conf_mode"
                          checked={confirmationMode === "manual"}
                          onChange={() => setConfirmationMode("manual")}
                          className="accent-[#2c4dd6]"
                        />
                      </div>
                      <p className="text-[11px] text-[#575e70] mt-1 leading-snug">
                        El negocio recibe la solicitud y debe aceptar la cita antes de confirmarla.
                      </p>
                      <span className="text-[10px] text-[#575e70] font-semibold mt-1">
                        Requiere validación constante
                      </span>
                    </label>
                  </div>
                </div>

                {/* Anticipación y Ventanas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Tiempo mínimo de anticipación
                    </label>
                    <select
                      value={minNotice}
                      onChange={(e) => setMinNotice(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] outline-none cursor-pointer"
                    >
                      <option value="1">1 hora antes</option>
                      <option value="2">2 horas antes (Recomendado)</option>
                      <option value="4">4 horas antes</option>
                      <option value="12">12 horas antes</option>
                      <option value="24">24 horas antes</option>
                    </select>
                    <span className="text-[10px] text-[#575e70]">
                      Evita reservas imprevistas de última hora.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Ventana máxima de reserva futura
                    </label>
                    <select
                      value={maxNotice}
                      onChange={(e) => setMaxNotice(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] outline-none cursor-pointer"
                    >
                      <option value="7">7 días de anticipación</option>
                      <option value="15">15 días de anticipación</option>
                      <option value="30">30 días de anticipación</option>
                      <option value="60">60 días de anticipación</option>
                      <option value="90">90 días de anticipación</option>
                    </select>
                    <span className="text-[10px] text-[#575e70]">
                      Límite para evitar cancelaciones lejanas.
                    </span>
                  </div>
                </div>

                {/* "Cualquier profesional" Toggle */}
                <label className="p-3.5 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#dee1ff] text-[#2c4dd6] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">groups</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#191c1e]">
                          Permitir seleccionar &quot;Cualquier profesional disponible&quot;
                        </span>
                        <span className="bg-[#dee1ff] text-[#2c4dd6] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          +24% reservas
                        </span>
                      </div>
                      <span className="text-[11px] text-[#575e70]">
                        Distribuye citas inteligentemente según disponibilidad y reduce vacíos en agenda.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowAnyStaff}
                    onChange={(e) => setAllowAnyStaff(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c4dd6] relative shrink-0"></div>
                </label>

                {/* Campos requeridos */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-xs font-semibold text-[#191c1e]">
                    Datos requeridos al cliente al reservar
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#f2f4f6] flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#191c1e]">Nombre completo</span>
                        <span className="material-symbols-outlined text-[16px] text-[#747686]">lock</span>
                      </div>
                      <span className="text-[10px] text-[#2c4dd6] font-semibold mt-2">
                        Obligatorio por defecto
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f2f4f6] flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#191c1e]">Teléfono / WhatsApp</span>
                        <span className="material-symbols-outlined text-[16px] text-[#747686]">lock</span>
                      </div>
                      <span className="text-[10px] text-[#2c4dd6] font-semibold mt-2">
                        Identificador principal
                      </span>
                    </div>
                    <label className="p-3 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea] transition-colors flex flex-col justify-between cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#191c1e]">Correo electrónico</span>
                        <input
                          type="checkbox"
                          checked={requireEmail}
                          onChange={(e) => setRequireEmail(e.target.checked)}
                          className="w-4 h-4 accent-[#2c4dd6] rounded"
                        />
                      </div>
                      <span className="text-[10px] text-[#575e70] mt-2">
                        {requireEmail ? "Solicitado para confirmación" : "Opcional"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Banner Cero Fricción */}
                <div className="p-4 rounded-xl bg-[#dee1ff]/30 flex items-start gap-3 border border-[#dee1ff]">
                  <span className="material-symbols-outlined text-[#2c4dd6] text-[22px] shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#2c4dd6]">
                      Regla de Oro Skedly: Cero Fricción
                    </span>
                    <p className="text-xs text-[#191c1e] mt-0.5 leading-snug">
                      Los clientes nunca crean cuentas ni recuerdan contraseñas para reservar. Tu proceso es 100% fluido y maximiza la confirmación de turnos.
                    </p>
                  </div>
                </div>

                {/* Política de cancelación */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#191c1e]">
                      Política pública de cancelación y reprogramación
                    </label>
                    <span className="text-[10px] text-[#575e70]">Visible en el comprobante</span>
                  </div>
                  <textarea
                    rows={2}
                    value={cancelPolicy}
                    onChange={(e) => setCancelPolicy(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#f2f4f6] text-xs text-[#191c1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c4dd6] transition-all resize-none"
                  />
                </div>
              </section>

              {/* SECTION: Pausa de Reservas */}
              <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#e0e3e5] flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">pause_circle</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-[#191c1e]">
                        Pausar temporalmente nuevas reservas online
                      </h3>
                      <p className="text-xs text-[#575e70] mt-0.5">
                        Activa este interruptor en caso de vacaciones, reformas o exceso de demanda. Tu página pública permanecerá visible, pero los clientes verán un aviso amigable y no podrán seleccionar horarios.
                      </p>
                    </div>
                  </div>
                  <label className="cursor-pointer relative shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={pauseBookings}
                      onChange={(e) => setPauseBookings(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-[#c4c5d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {pauseBookings && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>
                      ¡Atención! Las reservas públicas están detenidas. Los clientes solo podrán contactar por WhatsApp.
                    </span>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW & STOREFRONT SIMULATOR (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#e0e3e5] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#2c4dd6]">
                  {previewDevice === "mobile" ? "smartphone" : "laptop_mac"}
                </span>
                <span className="text-sm font-bold text-[#191c1e]">Vista en vivo</span>
              </div>
              {/* Device switcher */}
              <div className="flex items-center bg-[#f2f4f6] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1 rounded ${
                    previewDevice === "mobile"
                      ? "bg-white text-[#2c4dd6] shadow-xs"
                      : "text-[#575e70]"
                  }`}
                  title="Vista móvil"
                >
                  <span className="material-symbols-outlined text-[16px]">smartphone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1 rounded ${
                    previewDevice === "desktop"
                      ? "bg-white text-[#2c4dd6] shadow-xs"
                      : "text-[#575e70]"
                  }`}
                  title="Vista escritorio"
                >
                  <span className="material-symbols-outlined text-[16px]">laptop_mac</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-[#575e70]">
              Así es como verán tu estudio tus clientes desde dispositivos en tiempo real.
            </p>

            {/* MINI MOCKUP DE DISPOSITIVO */}
            <div
              className={`w-full bg-[#f2f4f6] rounded-2xl overflow-hidden shadow-inner border border-[#e0e3e5] flex flex-col transition-all duration-300 ${
                previewDevice === "mobile" ? "max-w-[340px] mx-auto" : "w-full"
              }`}
            >
              {/* Simulated Browser Bar */}
              <div className="h-7 bg-[#e0e3e5] px-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <span className="text-[10px] text-[#575e70] font-mono truncate max-w-[170px]">
                  skedly.com/{slug}
                </span>
                <span className="material-symbols-outlined text-[12px] text-[#575e70]">lock</span>
              </div>

              {/* Storefront mini content */}
              <div className="bg-white flex flex-col pb-4">
                {/* Cover Header */}
                <div className="relative h-24 w-full overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${coverUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80"}')`,
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Avatar Logo Overlap */}
                <div className="px-3.5 flex items-end justify-between -mt-5 relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoInitials}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      pauseBookings
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        pauseBookings ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    ></span>
                    {pauseBookings ? "Pausado" : "Abierto"}
                  </span>
                </div>

                {/* Title & Slogan */}
                <div className="px-3.5 pt-2 flex flex-col gap-0.5">
                  <h3 className="text-xs font-bold text-[#191c1e] leading-tight truncate">
                    {bizName}
                  </h3>
                  <p
                    className="text-[10px] font-semibold truncate"
                    style={{ color: primaryColor }}
                  >
                    {bizSlogan}
                  </p>
                  <div className="flex items-center gap-1 text-[#575e70] text-[10px] pt-0.5">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    <span className="truncate">{bizStreet || "Roma Norte, CDMX"}</span>
                  </div>
                </div>

                {/* Simulated service card */}
                <div className="mx-3.5 mt-2.5 p-2 rounded-xl bg-[#f2f4f6] flex flex-col gap-1.5 border border-[#e0e3e5]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#191c1e]">
                      Corte Signature + Barba
                    </span>
                    <span className="text-[11px] font-bold text-[#191c1e]">$450 MXN</span>
                  </div>
                  <div className="flex items-center justify-between text-[#575e70] text-[10px]">
                    <span>45 min • Toalla tibia</span>
                    <button
                      type="button"
                      disabled={pauseBookings}
                      className="px-2.5 py-0.5 rounded text-white font-semibold shadow-xs disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {pauseBookings ? "Cerrado" : "Elegir"}
                    </button>
                  </div>
                </div>

                {/* Rating & Proof */}
                <div className="px-3.5 pt-2.5 flex items-center justify-between text-[10px] text-[#575e70]">
                  <div className="flex items-center gap-1 text-amber-500">
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold text-[#191c1e]">4.9</span>
                    <span>(184 reseñas)</span>
                  </div>
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    Ver servicios (8)
                  </span>
                </div>
              </div>
            </div>

            {/* Tip card */}
            <div className="p-3 bg-[#dee1ff]/30 rounded-xl flex items-start gap-2 border border-[#dee1ff]">
              <span className="material-symbols-outlined text-[#2c4dd6] text-[18px] shrink-0 mt-0.5">
                lightbulb
              </span>
              <div className="flex flex-col text-[11px] text-[#575e70]">
                <span className="font-bold text-[#191c1e]">Tip de conversión</span>
                <span className="mt-0.5 leading-snug">
                  Los estudios que habilitan confirmación instantánea registran un 38% más de citas cerradas.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          Cargando configuración del negocio...
        </div>
      }
    >
      <ConfiguracionContent />
    </Suspense>
  );
}

