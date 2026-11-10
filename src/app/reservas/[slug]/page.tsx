"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Types
interface PublicService {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category: "all" | "cabello" | "barba" | "tratamientos";
  category_label: string;
  description: string;
  is_popular?: boolean;
}

interface PublicProfessional {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews_count: number;
  experience: string;
  specialty: string;
  avatar_url: string;
}

interface ReviewItem {
  id: string;
  client_name: string;
  client_initials: string;
  rating: number;
  time_ago: string;
  comment: string;
  service_used: string;
  staff_used: string;
  avatar_bg: string;
}

// Default Urban Cuts Template Data (from Design Folder)
const DEFAULT_SERVICES: PublicService[] = [
  {
    id: "srv-1",
    name: "Corte Clásico",
    price: 180,
    duration_minutes: 30,
    category: "cabello",
    category_label: "Cabello",
    description: "Lavado de cortesía, corte a tijera y máquina con acabado pulcro y peinado con cera mate de alta fijación.",
  },
  {
    id: "srv-2",
    name: "Corte Premium",
    price: 250,
    duration_minutes: 45,
    category: "cabello",
    category_label: "Firma Urban",
    description: "Diagnóstico de estilo personalizado, degradado con navaja japonesa, lavado relajante con toalla caliente aromatizada y peinado profesional.",
    is_popular: true,
  },
  {
    id: "srv-3",
    name: "Corte Infantil",
    price: 150,
    duration_minutes: 30,
    category: "cabello",
    category_label: "Cabello",
    description: "Especial para niños de hasta 12 años, con trato paciente, amigable y dinámico para que disfruten su visita al máximo.",
  },
  {
    id: "srv-4",
    name: "Perfilado de Barba",
    price: 100,
    duration_minutes: 20,
    category: "barba",
    category_label: "Barbería",
    description: "Delineado nítido con navaja tradicional de un solo uso, toalla tibia y aplicación de bálsamo orgánico hidratante.",
  },
  {
    id: "srv-5",
    name: "Afeitado Clásico",
    price: 140,
    duration_minutes: 30,
    category: "barba",
    category_label: "Ritual",
    description: "Ritual tradicional de doble toalla caliente, espuma caliente al mentol con brocha de cerda natural y masaje facial tonificante.",
  },
  {
    id: "srv-6",
    name: "Tratamiento Capilar",
    price: 300,
    duration_minutes: 45,
    category: "tratamientos",
    category_label: "Spa Capilar",
    description: "Masaje craneal exfoliante desintoxicante, ampolleta de queratina revitalizante y apertura folicular con vapor ozonizado.",
  },
];

const DEFAULT_PROFESSIONALS: PublicProfessional[] = [
  {
    id: "carlos",
    name: "Carlos Ramírez",
    role: "Master Barber",
    rating: 4.9,
    reviews_count: 88,
    experience: "8 años de experiencia",
    specialty: "Especialista en Fades de alta precisión, cortes urbanos contemporáneos y diseño integral de barba.",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "mateo",
    name: "Mateo Ramos",
    role: "Barbero Principal",
    rating: 5.0,
    reviews_count: 54,
    experience: "6 años de experiencia",
    specialty: "Especialista en Estilos Clásicos a Tijera, afeitados con navaja abierta y técnicas de barbería tradicional inglesa.",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sofia",
    name: "Sofía Gómez",
    role: "Estilista & Tratamientos",
    rating: 4.9,
    reviews_count: 32,
    experience: "5 años de experiencia",
    specialty: "Especialista en Cuidado Capilar, terapias de hidratación profunda, peeling craneal y texturizado para cabello largo y rizado.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  },
];

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    client_name: "David Soria",
    client_initials: "DS",
    rating: 5,
    time_ago: "Hace 3 días",
    comment: "La puntualidad es impecable. Agendé desde el celular en 30 segundos, llegué y Carlos ya me tenía el sillón listo. El degradado con navaja quedó exacto a lo que pedí y el café espresso de cortesía es un gran detalle.",
    service_used: "Corte Premium",
    staff_used: "Carlos R.",
    avatar_bg: "bg-primary-fixed text-on-primary-fixed",
  },
  {
    id: "rev-2",
    client_name: "Roberto Méndez",
    client_initials: "RM",
    rating: 5,
    time_ago: "Hace 1 semana",
    comment: "El ritual de toalla caliente y afeitado clásico con Mateo es una experiencia obligada si tienes barba. Sales completamente renovado. Muy buen ambiente musical y la barbería está impecable.",
    service_used: "Afeitado Clásico",
    staff_used: "Mateo R.",
    avatar_bg: "bg-secondary-fixed text-on-secondary-fixed",
  },
  {
    id: "rev-3",
    client_name: "Alejandro Peña",
    client_initials: "AP",
    rating: 5,
    time_ago: "Hace 2 semanas",
    comment: "Probé el tratamiento reconstructivo con Sofía por recomendación y mi cabello recuperó vida desde la primera sesión. Te explica cada producto con mucha claridad sin intentar venderte cosas de más.",
    service_used: "Tratamiento Capilar",
    staff_used: "Sofía G.",
    avatar_bg: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
];

const AVAILABLE_TIMES = ["11:30", "13:00", "15:30", "16:30", "17:15", "18:45"];

function PublicBookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const businessSlug = (params?.slug as string) || "urban-cuts";

  // Business State
  const [businessName, setBusinessName] = useState("Urban Cuts");
  const [businessSubtitle, setBusinessSubtitle] = useState("Barbería Clásica & Moderna");
  const [services, setServices] = useState<PublicService[]>(DEFAULT_SERVICES);
  const [professionals, setProfessionals] = useState<PublicProfessional[]>(DEFAULT_PROFESSIONALS);
  const [reviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Booking Modal State (Intelligent Entry Point)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrigin, setModalOrigin] = useState<"service" | "pro" | "hero">("service");
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Selected Booking Values
  const [selectedService, setSelectedService] = useState<PublicService>(DEFAULT_SERVICES[1]); // Default Corte Premium
  const [selectedProId, setSelectedProId] = useState<string>("carlos");
  const [selectedDate, setSelectedDate] = useState("2025-10-26");
  const [selectedTime, setSelectedTime] = useState("13:00");

  // Customer Contact for Booking
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  // Booking Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Mobile drawer / Simulator tooling view
  const [showSimulatorBar, setShowSimulatorBar] = useState(true);

  // Attempt to load dynamic business data if slug exists in Supabase
  useEffect(() => {
    if (!businessSlug || businessSlug === "urban-cuts") return;

    supabase
      .from("businesses")
      .select("id, name, slug, phone, address")
      .eq("slug", businessSlug)
      .maybeSingle()
      .then(({ data: biz }) => {
        if (biz) {
          setBusinessName(biz.name);
          // Load services
          supabase
            .from("services")
            .select("id, name, price, duration_minutes, description")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .then(({ data: srvs }) => {
              if (srvs && srvs.length > 0) {
                setServices(
                  srvs.map((s, idx) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    duration_minutes: s.duration_minutes,
                    category: "all",
                    category_label: "Servicio",
                    description: s.description || "Atención personalizada de alta calidad.",
                    is_popular: idx === 0,
                  }))
                );
              }
            });
        }
      });
  }, [businessSlug]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return services;
    return services.filter((s) => s.category === activeCategory);
  }, [services, activeCategory]);

  // Selected Pro Object
  const selectedPro = useMemo(() => {
    if (selectedProId === "any") {
      return {
        id: "any",
        name: "Cualquiera disponible",
        role: "Mayor disponibilidad horaria",
        avatar_url: "",
      };
    }
    return professionals.find((p) => p.id === selectedProId) || professionals[0];
  }, [professionals, selectedProId]);

  // Modal Triggers
  const openBookingFromService = (service: PublicService) => {
    setSelectedService(service);
    setModalOrigin("service");
    setBookingStep(1);
    setIsModalOpen(true);
  };

  const openBookingFromPro = (proId: string) => {
    setSelectedProId(proId);
    setModalOrigin("pro");
    setBookingStep(1);
    setIsModalOpen(true);
  };

  const openBookingGeneric = () => {
    setModalOrigin("hero");
    setBookingStep(1);
    setIsModalOpen(true);
  };

  // Submit Final Booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);

    try {
      // Simulate real-time appointment persistence
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService?.duration_minutes || 45) * 60000);

      // In real tenant mode with DB, we insert
      // For public preview, simulate instant confirmation
      setTimeout(() => {
        setIsSubmittingBooking(false);
        setBookingConfirmed(true);
        setToastMessage(`¡Cita confirmada para el ${selectedDate} a las ${selectedTime}! Te enviamos los detalles a WhatsApp.`);
        setTimeout(() => {
          setIsModalOpen(false);
          setBookingConfirmed(false);
          setToastMessage(null);
        }, 3500);
      }, 900);
    } catch (err) {
      console.error("Booking error:", err);
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed flex flex-col">
      {/* ============================================================ */}
      {/* 0. INTERACTIVE SKEDLY SIMULATOR CONTROLLER BAR               */}
      {/* ============================================================ */}
      {showSimulatorBar && (
        <div className="w-full bg-inverse-surface text-inverse-on-surface px-4 sm:px-6 py-2.5 z-50 sticky top-0 shadow-md">
          <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px]">touch_app</span>
              </span>
              <div className="flex flex-col">
                <span className="font-semibold tracking-wide">Puntos de Entrada Inteligentes • {businessName}</span>
                <span className="text-surface-variant text-[10px]">Prueba cómo responde el modal según el elemento clicado en la web</span>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <span className="text-surface-variant text-[11px] mr-1 hidden sm:inline">Simular origen:</span>
              <button
                type="button"
                onClick={() => openBookingFromService(DEFAULT_SERVICES[1])}
                className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-semibold hover:bg-primary-container transition-all flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[14px]">content_cut</span>
                <span>Desde Servicio ("Corte Premium")</span>
              </button>

              <button
                type="button"
                onClick={() => openBookingFromPro("carlos")}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">badge</span>
                <span>Desde Barbero ("Carlos")</span>
              </button>

              <button
                type="button"
                onClick={openBookingGeneric}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span>Genérico (Hero)</span>
              </button>

              <Link
                href="/dashboard"
                className="px-2.5 py-1 rounded-lg bg-surface-container text-primary text-[11px] font-semibold hover:bg-surface-container-high transition-colors ml-1"
              >
                Volver al Panel
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. PUBLIC HEADER NAVIGATION                                  */}
      {/* ============================================================ */}
      <header className="w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)] sticky top-0 sm:static">
        <div className="h-20 max-w-[1280px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[22px]">content_cut</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-on-surface tracking-tight leading-none">{businessName}</span>
              <span className="text-[11px] text-secondary mt-0.5">{businessSubtitle}</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
            <a href="#inicio" className="text-primary font-semibold transition-colors">
              Inicio
            </a>
            <a href="#servicios" className="hover:text-on-surface transition-colors">
              Servicios
            </a>
            <a href="#profesionales" className="hover:text-on-surface transition-colors">
              Profesionales
            </a>
            <a href="#galeria" className="hover:text-on-surface transition-colors">
              Galería
            </a>
            <a href="#reseñas" className="hover:text-on-surface transition-colors">
              Reseñas
            </a>
            <a href="#contacto" className="hover:text-on-surface transition-colors">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={`/reservas/${businessSlug}/agendar`}
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-sm hover:shadow-md"
            >
              Reservar cita
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section id="inicio" className="relative w-full overflow-hidden bg-inverse-surface text-surface">
        {/* Atmospheric Ambient Visual Background */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface via-inverse-surface/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-inverse-surface/60" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-12 pt-20 pb-20 lg:pt-28 lg:pb-28 flex flex-col justify-center">
          {/* Slogan Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary-container/20 text-primary-fixed backdrop-blur-md self-start mb-5 border border-primary-fixed/20">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide">Tu estilo, nuestra especialidad</span>
          </div>

          {/* Title & Description */}
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface tracking-tight">
              {businessName}
            </h1>
            <p className="text-xl sm:text-2xl text-surface-variant font-normal leading-relaxed">
              Experiencia de barbería artesanal contemporánea en el corazón de la Roma Norte.
            </p>
            <p className="text-sm sm:text-base text-surface-variant/80 max-w-2xl leading-relaxed">
              Descubre una experiencia de barbería profesional de primer nivel. Elige tu servicio, selecciona a tu barbero de confianza y agenda en segundos sin necesidad de crear contraseñas ni registrarte.
            </p>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-6 pb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface/10 backdrop-blur-md text-surface text-xs shadow-sm border border-surface/10">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">star</span>
              <span className="font-bold text-sm">4.9</span>
              <span className="text-surface-variant text-[11px]">(142 reseñas verificadas)</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface/10 backdrop-blur-md text-surface text-xs shadow-sm border border-surface/10">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">location_on</span>
              <span>Roma Norte, CDMX</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 backdrop-blur-md text-xs shadow-sm border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Abierto hoy: 10:00 - 20:00</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              type="button"
              onClick={openBookingGeneric}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              <span>Reservar una cita</span>
            </button>
            <a
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface-container-highest/20 text-surface hover:bg-surface-container-highest/30 backdrop-blur-md font-semibold text-xs transition-all border border-surface/10"
            >
              <span>Ver servicios y precios</span>
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. QUICK METRICS OVERLAP BAR                                 */}
      {/* ============================================================ */}
      <div className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-surface-container-lowest shadow-md border border-outline-variant/30">
          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-on-surface">Puntualidad 100%</p>
              <p className="text-[11px] text-secondary">Cero esperas de sillón</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-on-surface">Confirmación al instante</p>
              <p className="text-[11px] text-secondary">Vía WhatsApp y Correo</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
              <span className="material-symbols-outlined text-[22px]">local_cafe</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-on-surface">Bebida de cortesía</p>
              <p className="text-[11px] text-secondary">Espresso o cerveza artesanal</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-on-surface">Pago en el local</p>
              <p className="text-[11px] text-secondary">Efectivo, Tarjeta o SPEI</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. SECTION: NUESTROS SERVICIOS                               */}
      {/* ============================================================ */}
      <section id="servicios" className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Catálogo de Servicios</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Nuestros Servicios</h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Selecciona el tratamiento ideal y asegura tu horario con tu barbero favorito.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-surface-container">
            {[
              { id: "all", label: "Todos" },
              { id: "cabello", label: "Cortes de cabello" },
              { id: "barba", label: "Barba" },
              { id: "tratamientos", label: "Tratamientos" },
            ].map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`relative flex flex-col justify-between p-6 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/30 ${
                service.is_popular ? "ring-2 ring-primary/30" : ""
              }`}
            >
              {service.is_popular && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-bold shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                  <span>Popular</span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-semibold mb-2">
                      {service.category_label}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-on-surface">{service.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">${service.price}</span>
                    <span className="block text-[10px] text-secondary uppercase font-semibold">MXN</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-secondary mb-6 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-surface-container-low">
                <div className="flex items-center gap-1.5 text-secondary text-xs">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span>{service.duration_minutes} min</span>
                </div>

                <button
                  type="button"
                  onClick={() => openBookingFromService(service)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    service.is_popular
                      ? "bg-primary text-on-primary shadow-sm hover:bg-primary-container"
                      : "bg-surface-container-low hover:bg-primary-container text-on-surface hover:text-on-primary-container"
                  }`}
                >
                  <span>Reservar</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Informational Price Footnote Box */}
        <div className="mt-8 p-4 rounded-xl bg-surface-container-low flex items-start sm:items-center gap-3 border border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5 sm:mt-0">info</span>
          <p className="text-xs text-secondary">
            <strong className="font-semibold text-on-surface">Información de pago:</strong> Los precios mostrados son informativos. El pago se realiza directamente en el local en efectivo o tarjeta bancaria al finalizar tu cita.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SECTION: NUESTRO EQUIPO                                   */}
      {/* ============================================================ */}
      <section id="profesionales" className="w-full bg-surface-container-low py-20 border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Especialistas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Conoce a nuestro equipo</h2>
            <p className="text-xs sm:text-sm text-secondary mt-2">
              Profesionales capacitados para ofrecerte el mejor corte, técnica precisa y cuidado personalizado.
            </p>
          </div>

          {/* Professional Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {professionals.map((pro) => (
              <div
                key={pro.id}
                className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-outline-variant/30"
              >
                <div className="relative h-64 w-full overflow-hidden bg-surface-container">
                  <img
                    src={pro.avatar_url}
                    alt={pro.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-amber-500 text-[16px]">star</span>
                    <span className="text-xs font-bold text-on-surface">{pro.rating}</span>
                    <span className="text-[10px] text-secondary">({pro.reviews_count})</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{pro.name}</h3>
                    <p className="text-xs font-semibold text-primary mt-1">{pro.role}</p>
                    <p className="text-xs text-secondary mt-2 leading-relaxed">{pro.specialty}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
                      <span className="material-symbols-outlined text-[16px] text-primary">workspace_premium</span>
                      <span>{pro.experience}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => openBookingFromPro(pro.id)}
                      className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-primary text-on-surface hover:text-on-primary text-xs font-bold transition-all text-center"
                    >
                      Reservar con {pro.name.split(" ")[0]}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Helper Flexible Pill */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-surface-container text-on-surface text-xs border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-[18px]">shuffle</span>
              <span>
                ¿No tienes preferencia? Puedes seleccionar <strong>"Cualquier profesional disponible"</strong> al agendar para mayor flexibilidad de horarios.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION: GALERÍA DE FOTOS (Bento Grid)                     */}
      {/* ============================================================ */}
      <section id="galeria" className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
              <span>Espacio & Ambiente</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Conoce nuestro espacio</h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Diseñado para desconectar, disfrutar de una buena charla y recibir un trato inigualable.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-secondary text-xs">
            <span className="material-symbols-outlined text-[18px] text-primary">touch_app</span>
            <span>Colima 245, Roma Norte</span>
          </div>
        </div>

        {/* 4-Photo Responsive Bento Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-auto md:h-[480px]">
          {/* Photo 1: Big Interior View */}
          <div className="md:col-span-6 h-72 md:h-full relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-outline-variant/20">
            <img
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80"
              alt="Interior Urban Cuts"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <div className="text-surface">
                <p className="text-sm font-bold">Sillones Ergonómicos Vintage</p>
                <p className="text-xs text-surface-variant">Confort máximo para afeitados y cortes largos</p>
              </div>
            </div>
          </div>

          {/* Photo 2: Detail + Bar + Facade */}
          <div className="md:col-span-6 grid grid-rows-2 gap-5 h-auto md:h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-64 md:h-auto">
              <div className="relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container h-full border border-outline-variant/20">
                <img
                  src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80"
                  alt="Precision styling"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-xs font-bold text-surface">Precisión Milimétrica</span>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container h-full border border-outline-variant/20">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"
                  alt="Espresso Bar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-xs font-bold text-surface">Bar & Sala de Espera</span>
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container h-48 md:h-auto border border-outline-variant/20">
              <img
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80"
                alt="Storefront"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="text-surface">
                  <p className="text-sm font-bold">Fachada Colima 245</p>
                  <p className="text-xs text-surface-variant">Ubicación accesible en el corazón de Roma Norte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SECTION: RESEÑAS DE CLIENTES                              */}
      {/* ============================================================ */}
      <section id="reseñas" className="w-full bg-surface-container-low py-20 border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          {/* Reviews Header with Score Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Opiniones Verificadas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Lo que dicen nuestros clientes</h2>
              <p className="text-xs sm:text-sm text-secondary mt-1">Calificaciones de citas reales completadas a través de nuestra plataforma.</p>
            </div>

            {/* Metric Aggregate Card */}
            <div className="flex items-center gap-6 p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 self-start lg:self-auto">
              <div className="flex flex-col items-center justify-center border-r border-surface-container pr-6">
                <span className="text-4xl font-bold text-on-surface leading-none">4.9</span>
                <div className="flex items-center gap-0.5 text-amber-500 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[18px]">star</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Excelente reputación</p>
                <p className="text-xs text-secondary">Basado en 142 reseñas verificadas</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>100% clientes reales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="flex flex-col justify-between p-6 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow border border-outline-variant/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[18px]">star</span>
                      ))}
                    </div>
                    <span className="text-[11px] text-secondary font-medium">{rev.time_ago}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 italic">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="pt-4 border-t border-surface-container flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${rev.avatar_bg}`}>
                    {rev.client_initials}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-on-surface">{rev.client_name}</p>
                    <p className="text-[11px] text-secondary">
                      Servicio: <span className="font-semibold text-on-surface">{rev.service_used}</span> con {rev.staff_used}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. SECTION: INFORMACIÓN DEL NEGOCIO Y CONTACTO                */}
      {/* ============================================================ */}
      <section id="contacto" className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Business Details & Contact Cards */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>Ubicación y Contacto</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Encuéntranos en Roma Norte</h2>
              <p className="text-xs sm:text-sm text-secondary mt-1">
                Fácil acceso peatonal, ciclovía y opciones de estacionamiento cercano sobre calle Colima.
              </p>
            </div>

            {/* Address & WhatsApp Card */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                  <span className="material-symbols-outlined text-[24px]">pin_drop</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Dirección oficial</h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Colima 245, Roma Norte, Cuauhtémoc,<br />
                    06700 Ciudad de México, CDMX
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="https://wa.me/525591234567?text=Hola,%20quisiera%20consultar%20una%20duda%20sobre%20mi%20cita%20en%20Urban%20Cuts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  <span>Mensaje por WhatsApp</span>
                </a>
                <div className="flex items-center gap-2 text-secondary text-xs px-2">
                  <span className="material-symbols-outlined text-[18px]">phone</span>
                  <span className="font-semibold">+52 55 9123 4567</span>
                </div>
              </div>
            </div>

            {/* Business Hours Table */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                <h3 className="text-sm font-bold text-on-surface">Horarios de atención</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-surface-container">
                  <span className="text-secondary">Lunes a Sábado</span>
                  <span className="font-bold text-on-surface">10:00 - 20:00</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-surface-container">
                  <span className="text-secondary">Domingos</span>
                  <span className="font-bold text-on-surface">11:00 - 17:00</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-secondary">Días festivos</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                    Horario especial
                  </span>
                </div>
              </div>
            </div>

            {/* Social link */}
            <div className="flex items-center gap-3 text-secondary text-xs px-1">
              <span className="material-symbols-outlined text-[20px] text-primary">camera_alt</span>
              <span>
                Síguenos en Instagram: <strong className="text-on-surface font-semibold hover:text-primary transition-colors cursor-pointer">@urbancuts.cdmx</strong>
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Map Preview Card */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-md bg-surface-container flex flex-col justify-between border border-outline-variant/30">
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80')`,
                }}
              />
              <div className="relative m-4 self-start px-3.5 py-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                <span className="text-xs font-bold">Urban Cuts Roma Norte</span>
              </div>
              <div className="relative m-4 p-4 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md shadow-md flex items-center justify-between gap-4 border border-outline-variant/20">
                <div>
                  <p className="text-xs font-bold text-on-surface">Colima 245, Roma Nte.</p>
                  <p className="text-[11px] text-secondary">A media cuadra de Plaza Río de Janeiro</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Colima+245+Roma+Norte+CDMX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">directions</span>
                  <span>Cómo llegar</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. FINAL PROMINENT BOOKING CTA BANNER                        */}
      {/* ============================================================ */}
      <section className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 py-12">
        <div className="relative rounded-3xl bg-inverse-surface text-surface overflow-hidden p-8 sm:p-12 lg:p-16 shadow-xl">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-tertiary-container/15 blur-2xl pointer-events-none"></div>
          <div className="relative max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md text-primary-fixed text-xs font-bold border border-primary-fixed/20">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Reserva en menos de 1 minuto</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface tracking-tight">
              Tu próxima cita está a un solo clic.
            </h2>
            <p className="text-sm sm:text-base text-surface-variant max-w-2xl leading-relaxed">
              Elige tu servicio, selecciona tu horario favorito y recibe confirmación inmediata por WhatsApp y correo electrónico sin necesidad de contraseñas ni altas de usuario.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={openBookingGeneric}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-sm font-bold transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                <span>Reservar ahora</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 text-surface-variant text-xs">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified</span>
                <span>Sin pagos por adelantado • Cancela en cualquier momento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. MODAL INTELIGENTE DE RESERVA (MULTI-ORIGIN AGILITY)      */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto border border-outline-variant/30 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 pt-6 pb-4 bg-surface-container-low flex items-start justify-between border-b border-surface-container-high/60">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                      Reservar en {businessName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      En vivo
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    {bookingStep === 1 && "Paso 1 de 2: Confirma tu servicio y especialista"}
                    {bookingStep === 2 && "Paso 2 de 2: Selecciona fecha y datos de contacto"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Progress Indicator */}
            <div className="w-full bg-surface-container h-1.5 relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 bottom-0 bg-primary transition-all duration-300 rounded-full ${
                  bookingStep === 1 ? "w-1/2" : "w-full"
                }`}
              />
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmBooking} className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
              {bookingStep === 1 && (
                <>
                  {/* Selected Service Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">content_cut</span>
                        <span>Servicio seleccionado</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = (services.findIndex((s) => s.id === selectedService.id) + 1) % services.length;
                          setSelectedService(services[nextIdx]);
                        }}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">sync_alt</span>
                        <span>Cambiar servicio</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-fixed shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[20px]">cut</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-on-surface truncate">{selectedService.name}</h3>
                          <p className="text-xs text-secondary mt-0.5 line-clamp-1">{selectedService.description}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                              ${selectedService.price} MXN
                            </span>
                            <span className="flex items-center gap-1 text-secondary text-[11px]">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {selectedService.duration_minutes} minutos
                            </span>
                            <span className="flex items-center gap-1 text-secondary text-[11px]">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Lavado incluido
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </span>
                    </div>
                  </div>

                  {/* Professional Selector */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                          <span>Especialista / Barbero</span>
                        </label>
                        <p className="text-[11px] text-secondary">
                          Elige quién realizará tu servicio o solicita el turno más rápido.
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-secondary">
                        {professionals.length + 1} opciones
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option Any */}
                      <div
                        onClick={() => setSelectedProId("any")}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                          selectedProId === "any"
                            ? "bg-surface-container-lowest border-primary shadow-sm"
                            : "bg-surface-container-low border-transparent hover:bg-surface-container"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                          <span className="material-symbols-outlined text-[20px]">group</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-on-surface block truncate">Cualquiera disponible</span>
                          <p className="text-[10px] text-secondary truncate">Mayor disponibilidad horaria</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] ${
                            selectedProId === "any"
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-high"
                          }`}
                        >
                          {selectedProId === "any" && <span className="material-symbols-outlined text-[14px]">check</span>}
                        </div>
                      </div>

                      {/* Professional Cards */}
                      {professionals.map((pro) => {
                        const isSelected = selectedProId === pro.id;
                        return (
                          <div
                            key={pro.id}
                            onClick={() => setSelectedProId(pro.id)}
                            className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                              isSelected
                                ? "bg-surface-container-lowest border-primary shadow-sm"
                                : "bg-surface-container-low border-transparent hover:bg-surface-container"
                            }`}
                          >
                            <img
                              src={pro.avatar_url}
                              alt={pro.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-on-surface truncate">{pro.name}</span>
                                <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[9px] font-bold">
                                  {pro.role.split(" ")[0]}
                                </span>
                              </div>
                              <p className="text-[10px] text-secondary truncate">{pro.specialty}</p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] ${
                                isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high"
                              }`}
                            >
                              {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slots preview teaser */}
                  <div className="p-4 rounded-xl bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 border border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[22px]">event_available</span>
                      <div>
                        <p className="text-xs font-semibold text-on-surface">
                          Primeros horarios libres hoy con <span className="font-bold text-primary">{selectedPro.name}</span>:
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {AVAILABLE_TIMES.slice(0, 3).map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface text-[11px] font-semibold shadow-sm">
                              {t}
                            </span>
                          ))}
                          <span className="text-secondary text-[11px]">+ 4 más</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {bookingStep === 2 && (
                <>
                  {/* Step 2: Date, Time & Client Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                        <span>Fecha del turno</span>
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl text-xs font-semibold border border-outline-variant/30 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                        <span>Hora preferida</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {AVAILABLE_TIMES.map((time) => {
                          const isSel = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`h-11 rounded-xl text-xs font-bold transition-all ${
                                isSel
                                  ? "bg-primary text-on-primary shadow-sm"
                                  : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                      <span>Tus datos de confirmación</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-secondary">Nombre y apellido *</span>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Ej. Roberto Sánchez"
                          className="h-10 px-3 bg-surface-container-low text-on-surface rounded-xl text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-secondary">WhatsApp / Teléfono *</span>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+52 55 1234 5678"
                          className="h-10 px-3 bg-surface-container-low text-on-surface rounded-xl text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-secondary">Correo electrónico (para recibo)</span>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-xl text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-secondary">Comentarios o notas (opcional)</span>
                      <input
                        type="text"
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder="Ej. Preferencia de degradado alto o toalla tibia adicional"
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-xl text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <div className="flex items-center gap-1.5 text-secondary text-[11px]">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">lock</span>
                    <span>Sin contraseña obligatoria. Pago directo en sucursal.</span>
                  </div>
                  <Link
                    href={`/reservas/${businessSlug}/agendar?step=1`}
                    className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>O abre el asistente completo de 5 pasos</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {bookingStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="px-4 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                    >
                      Atrás
                    </button>
                  )}

                  {bookingStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="w-full sm:w-auto px-6 h-11 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Continuar a Fecha y Hora</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingBooking || bookingConfirmed}
                      className="w-full sm:w-auto px-7 h-11 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          <span>Confirmando tu cita...</span>
                        </>
                      ) : bookingConfirmed ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          <span>¡Cita Reservada con Éxito!</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>Confirmar Reserva</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11. NOTIFICATION TOAST                                        */}
      {/* ============================================================ */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-on-surface text-surface shadow-2xl animate-in slide-in-from-bottom duration-300">
          <span className="material-symbols-outlined text-emerald-400 text-[22px]">mark_email_read</span>
          <div>
            <p className="text-xs font-bold">¡Cita iniciada!</p>
            <p className="text-[11px] text-surface-variant">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 12. PUBLIC FOOTER                                            */}
      {/* ============================================================ */}
      <footer className="w-full bg-surface-container-low shadow-[0_-1px_8px_rgba(0,0,0,0.02)] mt-auto border-t border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
                  <span className="material-symbols-outlined text-[18px]">content_cut</span>
                </div>
                <span className="text-base font-bold text-on-surface tracking-tight">{businessName}</span>
              </div>
              <p className="text-xs text-secondary max-w-xs leading-relaxed">
                Experiencia premium en corte, afeitado y cuidado masculino con reserva ágil en tiempo real.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </a>
                <a
                  href="https://maps.google.com/?q=Colima+245+Roma+Norte+CDMX"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ubicación en mapas"
                  className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">map</span>
                </a>
                <a
                  href="tel:+525591234567"
                  aria-label="Atención telefónica"
                  className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Navegación</h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#inicio" className="text-secondary hover:text-on-surface transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#servicios" className="text-secondary hover:text-on-surface transition-colors">
                    Servicios & Precios
                  </a>
                </li>
                <li>
                  <a href="#profesionales" className="text-secondary hover:text-on-surface transition-colors">
                    Equipo Profesional
                  </a>
                </li>
                <li>
                  <a href="#galeria" className="text-secondary hover:text-on-surface transition-colors">
                    Galería de Cortes
                  </a>
                </li>
                <li>
                  <a href="#reseñas" className="text-secondary hover:text-on-surface transition-colors">
                    Opiniones de Clientes
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Horarios & Citas</h3>
              <ul className="space-y-2 text-xs text-secondary">
                <li className="flex justify-between max-w-[220px]">
                  <span>Lunes a Sábado</span>
                  <span className="font-semibold text-on-surface">10:00 - 20:00</span>
                </li>
                <li className="flex justify-between max-w-[220px]">
                  <span>Domingos</span>
                  <span className="font-semibold text-on-surface">11:00 - 17:00</span>
                </li>
                <li className="flex justify-between max-w-[220px]">
                  <span>Festivos</span>
                  <span className="text-primary font-semibold">Especial</span>
                </li>
              </ul>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={openBookingGeneric}
                  className="text-xs font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
                >
                  <span>Reservar cita ahora</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Ubicación & Contacto</h3>
              <div className="space-y-3 text-xs text-secondary">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">location_on</span>
                  <span>Colima 245, Roma Norte<br />06700 Ciudad de México</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">call</span>
                  <span>+52 55 9123 4567</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">mail</span>
                  <span>citas@urbancuts.mx</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container">
            <p className="text-xs text-secondary text-center sm:text-left">
              © 2025 {businessName}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-secondary text-[11px]">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
              <span>Página creada con <strong className="font-semibold text-on-surface">Skedly</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-surface flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            <span>Cargando página de reservas...</span>
          </div>
        </div>
      }
    >
      <PublicBookingContent />
    </Suspense>
  );
}

