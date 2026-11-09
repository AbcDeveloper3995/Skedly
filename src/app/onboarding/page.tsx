"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  buffer: number;
}

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "specialist";
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, currentBusiness, loading: authLoading } = useAuth();

  // Current Step (1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState(currentBusiness?.name || "Barbería Élite Central");
  const [businessType, setBusinessType] = useState<string>("Barbería");
  const [phone, setPhone] = useState("600 000 000");
  const [email, setEmail] = useState(user?.email || "contacto@minegocio.com");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 2: Location & Hours
  const [country, setCountry] = useState("ES");
  const [city, setCity] = useState("Madrid");
  const [address, setAddress] = useState("Calle Gran Vía 42, Planta 2, Puerta B");
  const [timezone, setTimezone] = useState("Europe/Madrid");
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: "Lunes", isOpen: true, openTime: "09:00", closeTime: "20:00" },
    { day: "Martes", isOpen: true, openTime: "09:00", closeTime: "20:00" },
    { day: "Miércoles", isOpen: true, openTime: "09:00", closeTime: "20:00" },
    { day: "Jueves", isOpen: true, openTime: "09:00", closeTime: "20:00" },
    { day: "Viernes", isOpen: true, openTime: "09:00", closeTime: "20:30" },
    { day: "Sábado", isOpen: true, openTime: "10:00", closeTime: "18:00" },
    { day: "Domingo", isOpen: false, openTime: "10:00", closeTime: "14:00" },
  ]);

  // Step 3: Services
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", name: "Corte Clásico Degradado", category: "Barbería", duration: 30, price: 18, buffer: 5 },
    { id: "2", name: "Combo Corte & Perfilado Barba", category: "Barbería", duration: 50, price: 28, buffer: 5 },
    { id: "3", name: "Ritual Spa Capilar", category: "Tratamientos", duration: 45, price: 35, buffer: 10 },
  ]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Barbería");
  const [newServiceDuration, setNewServiceDuration] = useState(45);
  const [newServicePrice, setNewServicePrice] = useState(25);
  const [newServiceBuffer, setNewServiceBuffer] = useState(5);

  // Step 4: Team
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([
    { id: "1", name: "Mateo Ramos (Propietario)", email: user?.email || "mateo@skedly.com", role: "admin" },
  ]);
  const [soloPractitioner, setSoloPractitioner] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "specialist">("specialist");

  // State saving
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentBusiness?.name) {
      setBusinessName(currentBusiness.name);
    }
  }, [currentBusiness]);

  // Logo upload preview
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  // Add Service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const newItem: ServiceItem = {
      id: Date.now().toString(),
      name: newServiceName.trim(),
      category: newServiceCategory,
      duration: newServiceDuration,
      price: newServicePrice,
      buffer: newServiceBuffer,
    };
    setServices([...services, newItem]);
    setNewServiceName("");
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const newMember: TeamMemberItem = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
    };
    setTeamMembers([...teamMembers, newMember]);
    setNewMemberName("");
    setNewMemberEmail("");
  };

  const handleRemoveMember = (id: string) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((m) => m.id !== id));
    }
  };

  // Save all onboarding configuration into Supabase and proceed to Dashboard
  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      if (currentBusiness?.id) {
        // 1. Update business details
        await supabase
          .from("businesses")
          .update({
            name: businessName.trim(),
            description: `${businessType} profesional`,
            phone: phone.trim(),
            email: email.trim(),
            timezone,
            is_published: true,
          })
          .eq("id", currentBusiness.id);

        // 2. Update default location
        await supabase
          .from("locations")
          .update({
            address_line: address.trim(),
            city: city.trim(),
            country,
            timezone,
            phone: phone.trim(),
          })
          .eq("business_id", currentBusiness.id)
          .eq("is_default", true);

        // 3. Insert or update services
        for (const s of services) {
          await supabase.from("services").insert({
            business_id: currentBusiness.id,
            name: s.name,
            duration_minutes: s.duration,
            price_amount: s.price,
            currency: "MXN",
            buffer_time_after: s.buffer,
            is_active: true,
          });
        }
      }
    } catch (err) {
      console.warn("Could not sync all onboarding data to Supabase:", err);
    } finally {
      setIsSubmitting(false);
      router.push("/dashboard");
    }
  };

  const categories = [
    { name: "Barbería", desc: "Cortes y afeitado", icon: "content_cut" },
    { name: "Salón de belleza", desc: "Estilismo e imagen", icon: "spa" },
    { name: "Spa & Relajación", desc: "Masajes y faciales", icon: "hot_tub" },
    { name: "Centro bienestar", desc: "Yoga, pilates, fisio", icon: "self_improvement" },
    { name: "Consultorio", desc: "Salud y terapias", icon: "medical_services" },
    { name: "Otro rubro", desc: "Servicios genéricos", icon: "more_horiz" },
  ];

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* HEADER NAVEGACIÓN */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
                SK
              </div>
              <span className="font-bold text-lg text-on-surface tracking-tight">Skedly</span>
            </Link>

            <div className="h-5 w-px bg-surface-container-high hidden sm:block" />

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
              <span
                className={`px-3 py-1 rounded-full transition-colors ${
                  currentStep === 1
                    ? "bg-secondary-container text-on-secondary-fixed-variant"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                1. Negocio
              </span>
              <span
                className={`px-3 py-1 rounded-full transition-colors ${
                  currentStep === 2
                    ? "bg-secondary-container text-on-secondary-fixed-variant"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                2. Horarios
              </span>
              <span
                className={`px-3 py-1 rounded-full transition-colors ${
                  currentStep === 3
                    ? "bg-secondary-container text-on-secondary-fixed-variant"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                3. Servicios
              </span>
              <span
                className={`px-3 py-1 rounded-full transition-colors ${
                  currentStep === 4
                    ? "bg-secondary-container text-on-secondary-fixed-variant"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                4. Equipo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Configuración inicial</span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              <span>Guardar y salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full pt-16 bg-surface flex-1 flex flex-col">
        <div className="relative w-full py-8 px-4 sm:px-6 lg:px-12">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-primary/10 via-secondary-container/20 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            {/* Step Progress Bar & Stepper */}
            <section className="w-full bg-white rounded-2xl shadow-xs border border-surface-container-high p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-bold tracking-wide uppercase">
                    Paso {currentStep} de 4
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {currentStep === 1 && "Configuración inicial del perfil"}
                    {currentStep === 2 && "Ubicación y horarios comerciales"}
                    {currentStep === 3 && "Catálogo de servicios y precios"}
                    {currentStep === 4 && "Equipo de trabajo y profesionales"}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">timelapse</span>
                  Tiempo estimado: 2 minutos
                </span>
              </div>

              {/* Custom Visual Progress Track */}
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(44,77,214,0.4)]"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>

              {/* Step Markers Responsive Grid */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { step: 1, label: "Información" },
                  { step: 2, label: "Horarios" },
                  { step: 3, label: "Servicios" },
                  { step: 4, label: "Equipo" },
                ].map((s) => (
                  <div
                    key={s.step}
                    onClick={() => s.step < currentStep && setCurrentStep(s.step as any)}
                    className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                      currentStep === s.step
                        ? "text-primary"
                        : currentStep > s.step
                        ? "text-emerald-700"
                        : "text-on-surface-variant/60"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] shrink-0 ${
                        currentStep === s.step
                          ? "bg-primary text-white shadow-xs"
                          : currentStep > s.step
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-surface-container text-secondary"
                      }`}
                    >
                      {currentStep > s.step ? "✓" : s.step}
                    </span>
                    <span className="truncate hidden sm:inline">{s.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ============================================================== */}
            {/* PASO 1: INFORMACIÓN DEL NEGOCIO                                */}
            {/* ============================================================== */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Column (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant w-fit text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-primary">store</span>
                      <span>Identidad de marca</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                      Cuéntanos sobre tu negocio
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      Comencemos con la información básica para activar tu central de reservas personalizada.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xs border border-surface-container-high p-6 sm:p-8 flex flex-col gap-6">
                    {/* Logo Dropzone Area */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-semibold text-on-surface flex items-center gap-1.5">
                          Logo comercial
                          <span className="material-symbols-outlined text-outline text-[16px]">info</span>
                        </label>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
                          Opcional
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 group">
                        <div className="w-20 h-20 rounded-xl bg-white border border-surface-container-high shadow-xs flex flex-col items-center justify-center text-primary shrink-0 relative overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[28px] text-primary">add_a_photo</span>
                              <span className="text-[10px] text-secondary mt-0.5">1:1 Ratio</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-center sm:text-left flex-1">
                          <label className="text-xs sm:text-sm font-semibold text-primary cursor-pointer hover:underline flex items-center justify-center sm:justify-start gap-1">
                            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                            <span>Selecciona o arrastra tu logo</span>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                          <p className="text-[11px] text-on-surface-variant">
                            Recomendado archivo cuadrado (PNG, JPG, SVG o WEBP de máx. 5 MB).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Field: Business Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-on-surface flex items-center justify-between" htmlFor="business-name">
                        <span>Nombre del negocio <span className="text-error">*</span></span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                          domain
                        </span>
                        <input
                          className="w-full h-11 pl-11 pr-4 bg-surface-container-low focus:bg-white text-on-surface rounded-lg border border-surface-container-high text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          id="business-name"
                          placeholder="Ej. Barbería Élite Central"
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                        />
                      </div>
                      <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary">visibility</span>
                        Este nombre se mostrará en los recibos y notificaciones de WhatsApp.
                      </p>
                    </div>

                    {/* Field: Business Category Chips */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm font-semibold text-on-surface">
                        Tipo de negocio <span className="text-error">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categories.map((c) => {
                          const isSelected = businessType === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => setBusinessType(c.name)}
                              className={`text-left p-3 rounded-xl flex flex-col justify-between gap-2.5 transition-all cursor-pointer border ${
                                isSelected
                                  ? "bg-primary-fixed/20 border-primary text-primary shadow-xs"
                                  : "bg-surface-container-low border-surface-container-high/60 text-on-surface hover:bg-surface-container"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`material-symbols-outlined text-[22px] ${isSelected ? "text-primary" : "text-secondary"}`}>
                                  {c.icon}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                    isSelected ? "bg-primary text-white" : "border border-surface-container-high"
                                  }`}
                                >
                                  {isSelected && "✓"}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-bold block text-on-surface">{c.name}</span>
                                <span className="text-[10px] text-secondary leading-tight">{c.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dual Grid: Teléfono & Correo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-on-surface" htmlFor="phone-contact">
                          Teléfono comercial <span className="text-error">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                            call
                          </span>
                          <input
                            className="w-full h-11 pl-10 pr-4 bg-surface-container-low focus:bg-white text-on-surface rounded-lg border border-surface-container-high text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            id="phone-contact"
                            placeholder="600 000 000"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-on-surface" htmlFor="email-contact">
                          Correo electrónico <span className="text-error">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                            mail
                          </span>
                          <input
                            className="w-full h-11 pl-10 pr-4 bg-surface-container-low focus:bg-white text-on-surface rounded-lg border border-surface-container-high text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            id="email-contact"
                            placeholder="contacto@minegocio.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Controls Strip */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-surface-container-high/60">
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                      >
                        Guardar y continuar después
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all"
                      >
                        <span>Continuar a horarios</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Helper & Live Preview Sidebar (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                  {/* Trust & Value Helper Card */}
                  <div className="bg-white rounded-2xl shadow-xs border border-surface-container-high p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-on-surface block">¿Por qué es importante?</span>
                        <span className="text-xs text-secondary">Confianza inmediata</span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Configurar tus datos básicos permite que tus clientes te identifiquen de inmediato al reservar. Una marca bien definida reduce en un <strong>38% el abandono de citas</strong> y proyecta seriedad profesional.
                    </p>
                    <div className="flex items-center gap-1.5 text-primary text-xs font-semibold pt-1">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>Cumplimiento con RGPD y privacidad garantizada</span>
                    </div>
                  </div>

                  {/* Public Booking Card Live Preview */}
                  <div className="bg-white rounded-2xl shadow-md border border-surface-container-high p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">
                          Vista previa de tu tarjeta
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold">
                        Pública
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-primary font-bold flex items-center justify-center text-lg shadow-xs shrink-0 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          businessName.slice(0, 2).toUpperCase() || "SK"
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-base text-on-surface truncate">
                          {businessName || "Nombre de tu negocio"}
                        </h4>
                        <span className="text-xs text-secondary block font-medium">
                          {businessType} • Reserva online directa
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Abierto hoy
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-on-surface">Servicios profesionales</p>
                        <p className="text-[11px] text-on-surface-variant">Duración y precios transparentes</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold">
                        Reservar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PASO 2: UBICACIÓN Y HORARIOS                                   */}
            {/* ============================================================== */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant w-fit text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                      <span>Configuración de presencia física y disponibilidad</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                      ¿Dónde y cuándo te encuentran tus clientes?
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      Configura la dirección de tu establecimiento y los días y turnos en los que recibes citas.
                    </p>
                  </div>

                  {/* Sección 1: Ubicación */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-surface-container-high flex flex-col gap-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-surface-container-high">
                      <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-on-surface">1. Ubicación comercial</h3>
                        <p className="text-xs text-on-surface-variant">Dirección pública para que tus clientes lleguen sin dudas.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">País o Región</label>
                        <select
                          className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        >
                          <option value="ES">España (ES)</option>
                          <option value="MX">México (MX)</option>
                          <option value="CO">Colombia (CO)</option>
                          <option value="AR">Argentina (AR)</option>
                          <option value="CL">Chile (CL)</option>
                          <option value="US">Estados Unidos (US)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Ciudad / Localidad</label>
                        <input
                          className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Ej. Madrid, Barcelona..."
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-on-surface mb-1">Dirección física completa</label>
                        <input
                          className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Calle, número, piso o local"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Horarios */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-surface-container-high flex flex-col gap-5">
                    <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">schedule</span>
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-on-surface">2. Horarios comerciales habituales</h3>
                          <p className="text-xs text-on-surface-variant">Los clientes solo podrán reservar en estos turnos.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {schedule.map((item, idx) => (
                        <div
                          key={item.day}
                          className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 gap-3"
                        >
                          <div className="flex items-center gap-3 w-28 sm:w-32">
                            <input
                              type="checkbox"
                              checked={item.isOpen}
                              onChange={(e) => {
                                const newSched = [...schedule];
                                newSched[idx].isOpen = e.target.checked;
                                setSchedule(newSched);
                              }}
                              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                            />
                            <span className={`text-xs sm:text-sm font-semibold ${item.isOpen ? "text-on-surface" : "text-on-surface-variant/50"}`}>
                              {item.day}
                            </span>
                          </div>

                          {item.isOpen ? (
                            <div className="flex items-center gap-2 text-xs">
                              <input
                                type="time"
                                value={item.openTime}
                                onChange={(e) => {
                                  const newSched = [...schedule];
                                  newSched[idx].openTime = e.target.value;
                                  setSchedule(newSched);
                                }}
                                className="px-2 py-1 rounded bg-white border border-surface-container-high font-mono text-xs"
                              />
                              <span>a</span>
                              <input
                                type="time"
                                value={item.closeTime}
                                onChange={(e) => {
                                  const newSched = [...schedule];
                                  newSched[idx].closeTime = e.target.value;
                                  setSchedule(newSched);
                                }}
                                className="px-2 py-1 rounded bg-white border border-surface-container-high font-mono text-xs"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-medium">Cerrado</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Controls Strip */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-surface-container-high/60">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                      >
                        ← Volver a Información
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all"
                      >
                        <span>Continuar a Servicios</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Tips */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                  <div className="bg-white rounded-2xl shadow-xs border border-surface-container-high p-5 flex flex-col gap-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Consejo Pro</span>
                    <h4 className="text-sm font-bold text-on-surface">Flexibilidad en todo momento</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Podrás configurar excepciones de festivos, descansos intermedios (ej. pausa para comida) y turnos particulares por empleado más adelante en la sección de configuración.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PASO 3: CATÁLOGO DE SERVICIOS                                  */}
            {/* ============================================================== */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-surface-container-high flex flex-col gap-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-surface-container-high">
                    <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-on-surface">Agregar Nuevo Servicio</h2>
                      <p className="text-xs text-on-surface-variant">Define el servicio que tus clientes verán online.</p>
                    </div>
                  </div>

                  <form className="flex flex-col gap-4" onSubmit={handleAddService}>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-on-surface">Nombre del servicio *</label>
                      <input
                        className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ej. Corte Degradado Clásico"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-on-surface">Categoría</label>
                        <select
                          className="w-full h-11 px-2.5 bg-surface-container-low rounded-lg text-xs sm:text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                          value={newServiceCategory}
                          onChange={(e) => setNewServiceCategory(e.target.value)}
                        >
                          <option value="Barbería">Barbería</option>
                          <option value="Peluquería">Peluquería</option>
                          <option value="Tratamientos">Tratamientos</option>
                          <option value="Cuidado Facial">Cuidado Facial</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-on-surface">Precio estimado ($)</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-on-surface">Duración en minutos</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[15, 30, 45, 60].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setNewServiceDuration(dur)}
                            className={`h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                              newServiceDuration === dur
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-surface-container-low border-surface-container-high/60 text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            {dur} min
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-on-surface">Tiempo de descanso / buffer post-cita</label>
                      <select
                        className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                        value={newServiceBuffer}
                        onChange={(e) => setNewServiceBuffer(Number(e.target.value))}
                      >
                        <option value={0}>Sin descanso extra</option>
                        <option value={5}>5 minutos (limpieza rápida)</option>
                        <option value={10}>10 minutos (preparación estándar)</option>
                        <option value={15}>15 minutos (desinfección completa)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-colors mt-2 cursor-pointer flex items-center justify-center gap-1.5 border border-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>+ Añadir este servicio</span>
                    </button>
                  </form>
                </div>

                {/* Right: Service list */}
                <div className="lg:col-span-6 flex flex-col gap-5">
                  <div className="bg-white p-6 rounded-2xl shadow-xs border border-surface-container-high flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">Tus Servicios Activos</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-bold">
                          {services.length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {services.map((s) => (
                        <div
                          key={s.id}
                          className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-semibold text-primary block">{s.category}</span>
                            <h4 className="text-sm font-bold text-on-surface">{s.name}</h4>
                            <span className="text-xs text-on-surface-variant">
                              {s.duration} min • ${s.price} • +{s.buffer} min buffer
                            </span>
                          </div>
                          {services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveService(s.id)}
                              className="text-on-surface-variant hover:text-error p-1 rounded transition-colors"
                              title="Eliminar servicio"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-container-high/60">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                      >
                        ← Volver a Horarios
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all"
                      >
                        <span>Continuar a Equipo</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PASO 4: EQUIPO DE TRABAJO                                      */}
            {/* ============================================================== */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant w-fit text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      <span>Gestión de Personal &amp; Roles</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                      Conoce a tu equipo
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                      Agrega a las personas que atenderán citas o continúa solo si trabajas de forma individual.
                    </p>
                  </div>

                  {/* Option: Solo practitioner */}
                  <div
                    onClick={() => setSoloPractitioner(!soloPractitioner)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      soloPractitioner
                        ? "bg-primary-fixed/20 border-primary text-primary"
                        : "bg-surface-container-low border-surface-container-high/60 text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px]">person_check</span>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block">¿Atiendes tú solo?</span>
                        <span className="text-xs text-on-surface-variant">
                          Activa esta opción para operar como profesional individual. Podrás sumar empleados cuando tu negocio crezca.
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={soloPractitioner}
                      onChange={(e) => setSoloPractitioner(e.target.checked)}
                      className="w-5 h-5 rounded text-primary accent-primary"
                    />
                  </div>

                  {!soloPractitioner && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-surface-container-high flex flex-col gap-5">
                      <h3 className="text-sm sm:text-base font-bold text-on-surface">Registrar nuevo colaborador</h3>

                      <form className="flex flex-col gap-4" onSubmit={handleAddMember}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-on-surface">Nombre completo *</label>
                            <input
                              className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Ej. Sofía Gómez"
                              value={newMemberName}
                              onChange={(e) => setNewMemberName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-on-surface">Correo electrónico</label>
                            <input
                              className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="sofia@minegocio.com"
                              type="email"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-on-surface">Rol asignado</label>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name="role"
                                checked={newMemberRole === "specialist"}
                                onChange={() => setNewMemberRole("specialist")}
                                className="accent-primary"
                              />
                              <span>Especialista (atiende citas)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name="role"
                                checked={newMemberRole === "admin"}
                                onChange={() => setNewMemberRole("admin")}
                                className="accent-primary"
                              />
                              <span>Administrador (control total)</span>
                            </label>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full h-10 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-colors cursor-pointer border border-surface-container-high flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                          <span>+ Agregar al equipo</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Final Action Controls Strip */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                    >
                      ← Volver a Servicios
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-lg hover:bg-primary-container transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>{isSubmitting ? "Guardando tu plataforma..." : "¡Completar y entrar al Dashboard!"}</span>
                      <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                    </button>
                  </div>
                </div>

                {/* Right: Team List */}
                <div className="lg:col-span-5 flex flex-col gap-5 sticky top-24">
                  <div className="bg-white p-6 rounded-2xl shadow-xs border border-surface-container-high flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                      <span>Miembros del equipo ({teamMembers.length})</span>
                    </h3>

                    <div className="space-y-3">
                      {teamMembers.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-on-surface block">{m.name}</span>
                              <span className="text-[11px] text-on-surface-variant">
                                {m.role === "admin" ? "Administrador" : "Especialista"} • {m.email || "Sin email"}
                              </span>
                            </div>
                          </div>
                          {teamMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              className="text-on-surface-variant hover:text-error p-1 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-low py-6 border-t border-surface-container-high">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant">
            © 2025 Skedly SaaS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-on-surface-variant">
            <Link className="hover:text-primary transition-colors" href="#">
              Términos del Servicio
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Política de Privacidad
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Centro de Ayuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

