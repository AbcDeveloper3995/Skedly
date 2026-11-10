"use client";

import React, { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Types
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category: "all" | "hair" | "beard" | "treatments";
  category_label: string;
  description: string;
  is_popular?: boolean;
  includes_text?: string;
}

interface ProfessionalOption {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews_count: number;
  next_slot: string;
  avatar_url: string;
  specialty: string;
}

const SERVICES_DATA: ServiceOption[] = [
  {
    id: "srv-1",
    name: "Corte Premium",
    price: 350,
    duration_minutes: 60,
    category: "hair",
    category_label: "Cortes de cabello",
    description: "Lavado capilar relajante con masaje, corte personalizado a tijera o máquina y peinado con cera mate de alta gama.",
    is_popular: true,
    includes_text: "Lavado premium incluido",
  },
  {
    id: "srv-2",
    name: "Corte Clásico",
    price: 180,
    duration_minutes: 30,
    category: "hair",
    category_label: "Cortes de cabello",
    description: "Degradado limpio o corte tradicional con asesoría de visagismo express.",
    includes_text: "Asesoría de estilo",
  },
  {
    id: "srv-3",
    name: "Corte + Barba",
    price: 280,
    duration_minutes: 45,
    category: "beard",
    category_label: "Barba",
    description: "Combo completo: corte pulido a tijera/máquina y perfilado de barba con toalla caliente y navaja.",
    includes_text: "Toalla caliente incluida",
  },
  {
    id: "srv-4",
    name: "Perfilado de Barba",
    price: 100,
    duration_minutes: 20,
    category: "beard",
    category_label: "Barba",
    description: "Delineado simétrico con navaja de un solo uso, toalla tibia y bálsamo hidratante orgánico.",
    includes_text: "Bálsamo orgánico",
  },
  {
    id: "srv-5",
    name: "Afeitado Tradicional",
    price: 140,
    duration_minutes: 30,
    category: "beard",
    category_label: "Barba",
    description: "Ritual completo de doble toalla caliente, espuma caliente al mentol con brocha de cerda natural y masaje facial.",
    includes_text: "Masaje facial relajante",
  },
  {
    id: "srv-6",
    name: "Tratamiento Capilar",
    price: 300,
    duration_minutes: 45,
    category: "treatments",
    category_label: "Tratamientos",
    description: "Masaje craneal exfoliante desintoxicante, ampolleta de queratina revitalizante y apertura folicular con vapor.",
    includes_text: "Vapor ozonizado",
  },
];

const PROFESSIONALS_DATA: ProfessionalOption[] = [
  {
    id: "any",
    name: "Cualquier profesional disponible",
    role: "Mayor disponibilidad horaria",
    rating: 5.0,
    reviews_count: 142,
    next_slot: "Próximo turno en 15 min",
    avatar_url: "",
    specialty: "El sistema te asignará automáticamente al primer barbero libre para la fecha que elijas.",
  },
  {
    id: "carlos",
    name: "Carlos Ramírez",
    role: "Barbero Master · Degradados y Barba",
    rating: 5.0,
    reviews_count: 86,
    next_slot: "Próximo turno hoy 16:30",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    specialty: "Especialista en Fades de alta precisión y navaja japonesa.",
  },
  {
    id: "mateo",
    name: "Mateo Ramos",
    role: "Barbero Clásico · Tijera Fina",
    rating: 5.0,
    reviews_count: 54,
    next_slot: "Próximo turno hoy 17:15",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    specialty: "Especialista en técnicas clásicas inglesas y afeitado tradicional.",
  },
  {
    id: "sofia",
    name: "Sofía Gómez",
    role: "Estilista Senior · Cuidado Capilar",
    rating: 4.9,
    reviews_count: 32,
    next_slot: "Próximo turno hoy 18:00",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    specialty: "Especialista en tratamientos dérmicos, texturizado y colorimetría.",
  },
];

const TIME_SLOTS_MORNING = ["09:30", "10:15", "11:00", "11:45"];
const TIME_SLOTS_AFTERNOON = ["13:00", "14:15", "15:30", "16:15", "17:00", "17:45"];
const TIME_SLOTS_EVENING = ["18:30", "19:15"];

function AgendarWizardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const businessSlug = (params?.slug as string) || "urban-cuts";

  // Stepper State: 1 (Servicio), 2 (Profesional), 3 (Fecha y Hora), 4 (Datos), 5 (Confirmar), 6 (Completada)
  const initialStepParam = Number(searchParams.get("step")) || 1;
  const [currentStep, setCurrentStep] = useState<number>(initialStepParam >= 1 && initialStepParam <= 6 ? initialStepParam : 1);

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceOption>(SERVICES_DATA[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProId, setSelectedProId] = useState<string>("carlos");

  // Date & Time
  const [selectedDayNum, setSelectedDayNum] = useState<number>(25);
  const [selectedTime, setSelectedTime] = useState<string>("11:45");

  // Customer Contact Fields
  const [clientName, setClientName] = useState("David Soria Gómez");
  const [countryCode, setCountryCode] = useState("+52");
  const [clientPhone, setClientPhone] = useState("55 4321 8765");
  const [clientEmail, setClientEmail] = useState("david.soria@ejemplo.com");
  const [clientNotes, setClientNotes] = useState("");

  // Confirmation Code & Status
  const [reservationCode, setReservationCode] = useState("#UC-84920");
  const [isManualApprovalDemo, setIsManualApprovalDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Selected Professional Object
  const selectedPro = useMemo(() => {
    return PROFESSIONALS_DATA.find((p) => p.id === selectedProId) || PROFESSIONALS_DATA[1];
  }, [selectedProId]);

  // Filtered Services for Step 1
  const filteredServices = useMemo(() => {
    if (categoryFilter === "all") return SERVICES_DATA;
    return SERVICES_DATA.filter((s) => s.category === categoryFilter || s.category === "all");
  }, [categoryFilter]);

  // Copy Code Handler
  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reservationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Submit Final Booking in Step 5 -> Goes to Step 6
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const codeGenerated = `#UC-${Math.floor(10000 + Math.random() * 90000)}`;
      setReservationCode(codeGenerated);

      // Create appointment in Supabase if business exists
      const fullPhone = `${countryCode} ${clientPhone}`;
      const startDateTime = new Date(`2025-10-${String(selectedDayNum).padStart(2, "0")}T${selectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_minutes * 60000);

      // Try finding business by slug
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", businessSlug)
        .maybeSingle();

      if (biz?.id) {
        const { data: newApp } = await supabase
          .from("appointments")
          .insert({
            business_id: biz.id,
            start_at: startDateTime.toISOString(),
            end_at: endDateTime.toISOString(),
            status: isManualApprovalDemo ? "pending" : "confirmed",
            customer_name_snapshot: clientName.trim(),
            customer_phone_snapshot: fullPhone,
            customer_email_snapshot: clientEmail.trim() || null,
            internal_notes: clientNotes.trim() ? `[Reserva Online] ${clientNotes.trim()}` : "[Reserva Online]",
          })
          .select()
          .single();

        if (newApp) {
          await supabase.from("appointment_services").insert({
            appointment_id: newApp.id,
            service_name: selectedService.name,
            unit_price: selectedService.price,
            duration_minutes: selectedService.duration_minutes,
          });
        }
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setCurrentStep(6);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 700);
    } catch (err) {
      console.error("Booking submit error:", err);
      setIsSubmitting(false);
      setCurrentStep(6);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col">
      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/reservas/${businessSlug}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-on-surface flex items-center justify-center text-surface shadow-sm">
                <span className="material-symbols-outlined text-[22px]">content_cut</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface leading-tight tracking-tight uppercase">
                  Urban Cuts
                </span>
                <span className="text-[11px] text-on-surface-variant">Contemporary Barber Studio</span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
              <span className="text-xs font-medium">Reserva directa y segura</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={`/reservas/${businessSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Volver a Urban Cuts</span>
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER                                               */}
      {/* ============================================================ */}
      <main className="w-full flex-1 pt-24 pb-16 bg-surface">
        {/* If Step 6: Confirmation Screen */}
        {currentStep === 6 ? (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full relative overflow-hidden bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-10 flex flex-col items-center border border-outline-variant/30">
              {/* Subtle ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>

              {/* Header Status */}
              <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-secondary-fixed/50 mb-4 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[36px]">check_circle</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                  </span>
                </div>

                <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  {isManualApprovalDemo ? "Solicitud Recibida" : "Paso 6 completado"}
                </span>

                <h1 className="text-2xl font-bold text-on-surface mb-2">
                  {isManualApprovalDemo ? "¡Solicitud de cita enviada!" : "¡Tu cita está confirmada!"}
                </h1>

                <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm">
                  {isManualApprovalDemo
                    ? "Hemos enviado tu turno al barbero para su aprobación inmediata. Recibirás confirmación por WhatsApp."
                    : "Hemos reservado tu turno con éxito. Te enviamos los detalles a tu WhatsApp y correo electrónico."}
                </p>
              </div>

              {/* Digital Ticket Card */}
              <div className="relative z-10 w-full mt-6 bg-surface-container-low rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-surface-container-high/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-secondary uppercase tracking-wider font-semibold">
                        Identificador único
                      </span>
                      <span className="text-sm sm:text-base font-bold text-on-surface tracking-wide">
                        {reservationCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-container transition-colors text-on-surface text-xs font-medium shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedCode ? "check" : "content_copy"}
                      </span>
                      <span>{copiedCode ? "¡Copiado!" : "Copiar código"}</span>
                    </button>
                  </div>
                </div>

                {/* Branding Strip */}
                <div className="bg-surface-container-lowest rounded-xl p-3.5 my-3 flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-on-surface flex items-center justify-center text-surface text-sm font-bold">
                      UC
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface">Urban Cuts Grooming Studio</h4>
                      <p className="text-[11px] text-secondary">Colima 152, Roma Norte, Cuauhtémoc, CDMX</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Verificado
                  </span>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-xs">
                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">content_cut</span>
                      <span className="text-[10px] uppercase font-semibold">Servicio agendado</span>
                    </div>
                    <p className="font-bold text-on-surface">{selectedService.name} ({selectedService.duration_minutes} min)</p>
                    <span className="text-[10px] text-secondary">Incluye lavado, perfilado y peinado</span>
                  </div>

                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                      <span className="text-[10px] uppercase font-semibold">Especialista asignado</span>
                    </div>
                    <p className="font-bold text-on-surface">{selectedPro.name}</p>
                    <span className="text-[10px] text-secondary">Estación activa: Sillón #01</span>
                  </div>

                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      <span className="text-[10px] uppercase font-semibold">Fecha programada</span>
                    </div>
                    <p className="font-bold text-on-surface">Miércoles, {selectedDayNum} de Octubre de 2025</p>
                    <span className="text-[10px] text-primary font-semibold">{selectedTime} hrs (Puntual)</span>
                  </div>

                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      <span className="text-[10px] uppercase font-semibold">Monto a liquidar</span>
                    </div>
                    <p className="font-bold text-primary text-sm">${selectedService.price} MXN</p>
                    <span className="text-[10px] text-secondary">Pago directo en recepción física</span>
                  </div>
                </div>

                {/* Customer Snapshot */}
                <div className="mt-3 p-3 rounded-xl bg-surface-container flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
                    <span className="font-bold text-on-surface">{clientName}</span>
                    <span className="text-secondary text-[11px]">{countryCode} {clientPhone}</span>
                  </div>
                  <span className="text-[10px] text-secondary bg-surface-container-lowest px-2 py-0.5 rounded font-medium">
                    Notificaciones activas
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => alert("Evento añadido a tu calendario digital.")}
                  className="w-full h-11 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-on-surface text-xs font-bold shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                  <span>Añadir a Google Calendar</span>
                </button>
                <a
                  href="https://maps.google.com/?q=Colima+152+Roma+Norte+CDMX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-on-surface text-xs font-bold shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">navigation</span>
                  <span>¿Cómo llegar en Maps?</span>
                </a>
              </div>

              {/* Interactive Demo Variant Switcher */}
              <div className="w-full mt-6 bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-outline-variant/20 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                    <span>Demostración: Lógica de aprobación manual</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualApprovalDemo(!isManualApprovalDemo)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Alternar estado
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Variación para negocios con aprobación manual: Si el comercio requiere verificación previa, este paso sustituye la confirmación automática por solicitud pendiente.
                </p>
              </div>

              {/* Back to public home */}
              <div className="w-full text-center mt-6">
                <Link
                  href={`/reservas/${businessSlug}`}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  ← Volver a la página de Urban Cuts
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* STEPPER WIZARD (STEPS 1 - 5)                                 */
          /* ============================================================ */
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stepper Progress Bar */}
            <div className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm mb-6 border border-outline-variant/30">
              <div className="flex items-center justify-between relative max-w-3xl mx-auto">
                {/* Background progress bar line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-surface-container -z-0">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                  />
                </div>

                {[
                  { num: 1, label: "1. Servicio" },
                  { num: 2, label: "2. Profesional" },
                  { num: 3, label: "3. Fecha y hora" },
                  { num: 4, label: "4. Tus datos" },
                  { num: 5, label: "5. Confirmar" },
                ].map((s) => {
                  const isDone = currentStep > s.num;
                  const isActive = currentStep === s.num;
                  return (
                    <div
                      key={s.num}
                      onClick={() => {
                        if (isDone) setCurrentStep(s.num);
                      }}
                      className={`flex flex-col items-center relative z-10 ${isDone ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                          isDone
                            ? "bg-primary text-on-primary shadow-sm"
                            : isActive
                            ? "bg-primary text-on-primary ring-4 ring-primary-fixed shadow-md scale-105"
                            : "bg-surface-container-high text-on-surface-variant opacity-70"
                        }`}
                      >
                        {isDone ? (
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        ) : (
                          s.num
                        )}
                      </div>
                      <span
                        className={`mt-2 text-xs font-semibold hidden sm:inline-block ${
                          isActive ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Context Summary Banner (Steps 2 to 5) */}
            {currentStep >= 2 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low mb-6 border border-outline-variant/20 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">content_cut</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      Selección actual
                    </span>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-on-surface">{selectedService.name}</span>
                      <span>•</span>
                      <span className="text-secondary">{selectedService.duration_minutes} min</span>
                      <span>•</span>
                      <span className="font-bold text-primary">${selectedService.price} MXN</span>
                      {currentStep >= 3 && (
                        <>
                          <span>•</span>
                          <span className="text-on-surface font-semibold">{selectedPro.name}</span>
                        </>
                      )}
                      {currentStep >= 4 && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-semibold">{selectedDayNum} Oct · {selectedTime} hrs</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-container self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Cambiar</span>
                </button>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 1: SELECCIÓN DE SERVICIO                                */}
            {/* ============================================================ */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/40 text-on-secondary-container text-xs font-semibold mb-2">
                    <span className="material-symbols-outlined text-[15px] text-primary">storefront</span>
                    <span>Estudio Roma Norte · Ciudad de México</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                    ¿Qué servicio necesitas?
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Selecciona el servicio que deseas agendar. Precios informativos, pago en el local al finalizar.
                  </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: "Todos", count: 6 },
                    { id: "hair", label: "Cortes de cabello", count: 3 },
                    { id: "beard", label: "Barba", count: 2 },
                    { id: "treatments", label: "Tratamientos", count: 1 },
                  ].map((cat) => {
                    const isSel = categoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                          isSel
                            ? "bg-on-surface text-surface shadow-sm"
                            : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            isSel ? "bg-surface/20" : "bg-surface-container"
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Services Cards List */}
                <div className="flex flex-col gap-3">
                  {filteredServices.map((srv) => {
                    const isSelected = selectedService.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => setSelectedService(srv)}
                        className={`p-5 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]"
                            : "border-outline-variant/30 hover:border-outline-variant/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="mt-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high"
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-surface"></div>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 pr-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-on-surface">{srv.name}</h3>
                                {srv.is_popular && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[12px]">star</span>
                                    Más popular
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant leading-relaxed">{srv.description}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                                <span className="flex items-center gap-1 font-semibold text-on-surface">
                                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                                  {srv.duration_minutes} min
                                </span>
                                {srv.includes_text && (
                                  <>
                                    <span>•</span>
                                    <span>{srv.includes_text}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className="text-lg font-bold text-primary">${srv.price} MXN</span>
                            <span className="text-[10px] text-on-surface-variant">pago en local</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-8 h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Continuar a Profesional</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: SELECCIÓN DE PROFESIONAL                             */}
            {/* ============================================================ */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold mb-2">
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    <span>Paso 2 de 5</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Elige a tu profesional</h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Selecciona quién realizará tu servicio o solicita el turno más pronto con cualquiera disponible.
                  </p>
                </div>

                {/* Option 1: Any available */}
                <div
                  onClick={() => setSelectedProId("any")}
                  className={`p-5 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                    selectedProId === "any"
                      ? "border-primary ring-2 ring-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent"
                      : "border-outline-variant/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-[26px]">groups_3</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-on-surface">Cualquier profesional disponible</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                            Mayor disponibilidad
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          El sistema te asignará automáticamente al primer barbero libre para la fecha que elijas.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        selectedProId === "any" ? "bg-primary text-on-primary" : "bg-surface-container-high"
                      }`}
                    >
                      {selectedProId === "any" && <span className="material-symbols-outlined text-[16px]">check</span>}
                    </div>
                  </div>
                </div>

                {/* Professional Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PROFESSIONALS_DATA.slice(1).map((pro) => {
                    const isSelected = selectedProId === pro.id;
                    return (
                      <div
                        key={pro.id}
                        onClick={() => setSelectedProId(pro.id)}
                        className={`p-5 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between border ${
                          isSelected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <img
                              src={pro.avatar_url}
                              alt={pro.name}
                              className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-surface-container"
                            />
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high"
                              }`}
                            >
                              {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                            </div>
                          </div>

                          <h3 className="text-sm font-bold text-on-surface">{pro.name}</h3>
                          <p className="text-[11px] text-primary font-semibold mt-0.5">{pro.role}</p>

                          <div className="flex items-center gap-1 text-xs text-on-surface font-semibold mt-2">
                            <span className="material-symbols-outlined text-amber-500 text-[16px]">star</span>
                            <span>{pro.rating}</span>
                            <span className="text-[10px] text-secondary">({pro.reviews_count} reseñas)</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl text-on-surface-variant text-[11px]">
                          <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                          <span className="truncate">{pro.next_slot}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-8 h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Continuar a Fecha y Hora</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: SELECCIÓN DE FECHA Y HORA                            */}
            {/* ============================================================ */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold mb-2">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span>Paso 3 de 5</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Selecciona fecha y hora</h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Horarios en tiempo real con sistema anticolisión. Los horarios ocupados no se muestran para garantizar la asignación exclusiva de tu sillón.
                  </p>
                </div>

                {/* 2-Column Calendar & Slots Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Calendar Widget (5 cols) */}
                  <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-on-surface">Octubre 2025</span>
                      <span className="text-[11px] text-secondary">Zona: CDMX (GMT-6)</span>
                    </div>

                    <div className="grid grid-cols-7 text-center text-xs font-bold text-secondary pb-1">
                      <span>Lu</span>
                      <span>Ma</span>
                      <span>Mi</span>
                      <span>Ju</span>
                      <span>Vi</span>
                      <span>Sá</span>
                      <span className="text-error">Do</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {/* Empty pad */}
                      <span className="p-2 opacity-30">29</span>
                      <span className="p-2 opacity-30">30</span>
                      {/* Active days */}
                      {[...Array(31)].map((_, i) => {
                        const day = i + 1;
                        const isSunday = day % 7 === 5; // Simulating Sundays
                        const isPast = day < 24;
                        const isSelected = selectedDayNum === day;

                        if (isPast) {
                          return (
                            <span key={day} className="p-2 text-outline-variant opacity-40 line-through select-none">
                              {day}
                            </span>
                          );
                        }

                        if (isSunday) {
                          return (
                            <span key={day} className="p-2 text-error/60 bg-surface-container-low rounded-lg text-[10px] select-none">
                              Cerr
                            </span>
                          );
                        }

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedDayNum(day)}
                            className={`p-2 rounded-xl font-bold transition-all ${
                              isSelected
                                ? "bg-primary text-on-primary shadow-md scale-105"
                                : "hover:bg-surface-container text-on-surface"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots (7 cols) */}
                  <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface">
                        Horarios para el {selectedDayNum} de Octubre
                      </span>
                      <span className="text-xs text-primary font-semibold">Con {selectedPro.name}</span>
                    </div>

                    {/* Morning */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-secondary tracking-wider block mb-2">
                        Turno Matutino
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS_MORNING.map((time) => {
                          const isSel = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
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

                    {/* Afternoon */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-secondary tracking-wider block mb-2">
                        Turno Vespertino
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {TIME_SLOTS_AFTERNOON.map((time) => {
                          const isSel = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
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

                    {/* Evening */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-secondary tracking-wider block mb-2">
                        Noche
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS_EVENING.map((time) => {
                          const isSel = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
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
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-8 h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Continuar a Tus Datos</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: TUS DATOS DE CONTACTO                                */}
            {/* ============================================================ */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold mb-2">
                    <span className="material-symbols-outlined text-[14px]">format_image_left</span>
                    <span>Reserva rápida sin registro</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Tus datos de contacto</h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Solo necesitamos la información indispensable para asignarte el sillón y enviarte el recordatorio oportuno de tu cita.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-outline-variant/30 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                      <span>Nombre y apellidos *</span>
                      <span className="text-[10px] text-on-surface-variant">Requerido</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-[18px]">person</span>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ingresa tu nombre completo"
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                      <span>Teléfono móvil / WhatsApp *</span>
                      <span className="text-[10px] text-on-surface-variant">Requerido</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold border border-outline-variant/30 focus:outline-none cursor-pointer"
                      >
                        <option value="+52">🇲🇽 +52 (MX)</option>
                        <option value="+34">🇪🇸 +34 (ES)</option>
                        <option value="+1">🇺🇸 +1 (US)</option>
                        <option value="+57">🇨🇴 +57 (CO)</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-[18px]">smartphone</span>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Número celular"
                          className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">chat</span>
                      <span>Recibirás la confirmación y recordatorio directo en tu WhatsApp.</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                      <span>Correo electrónico</span>
                      <span className="text-[10px] text-outline">Opcional</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-[18px]">alternate_email</span>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <span className="text-[11px] text-secondary">
                      Te enviaremos el comprobante digital y la invitación directa a tu calendario.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface">Notas adicionales (opcional)</label>
                    <textarea
                      rows={2}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Ej. Tengo el cabello rizado o prefiero degradado medio."
                      className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-8 h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Revisar y Confirmar</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 5: REVISAR Y CONFIRMAR CITA                             */}
            {/* ============================================================ */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold mb-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule_send</span>
                    <span>Paso 5 de 5 · Revisión Final</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Revisa y confirma tu cita</h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Verifica que todos los datos sean correctos antes de asegurar tu turno en Urban Cuts. Tu barbero preparará la estación para ti.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (7 cols): Booking Ticket Card */}
                  <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <div className="p-5 bg-surface-container-low border-b border-surface-container-high/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-on-surface flex items-center justify-center text-surface shadow-sm">
                          <span className="material-symbols-outlined text-[22px]">storefront</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Sede seleccionada</span>
                          <h3 className="text-sm font-bold text-on-surface">Urban Cuts — Roma Norte, CDMX</h3>
                          <p className="text-[11px] text-secondary">Colima 152, Roma Norte</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Modificar
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Date & Time */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-secondary uppercase font-semibold">Fecha y hora</span>
                            <p className="text-xs sm:text-sm font-bold text-on-surface">
                              Miércoles, {selectedDayNum} de Octubre de 2025
                            </p>
                            <span className="text-xs font-semibold text-primary">{selectedTime} hrs · Puntualidad requerida</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Modificar
                        </button>
                      </div>

                      {/* Specialist */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">badge</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-secondary uppercase font-semibold">Profesional a cargo</span>
                            <p className="text-xs sm:text-sm font-bold text-on-surface">{selectedPro.name}</p>
                            <span className="text-xs text-secondary">{selectedPro.role}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Modificar
                        </button>
                      </div>

                      {/* Customer Snapshot */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-secondary uppercase font-semibold">Datos de contacto</span>
                            <p className="text-xs sm:text-sm font-bold text-on-surface">{clientName}</p>
                            <span className="text-xs text-secondary">{countryCode} {clientPhone} • {clientEmail}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Modificar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (5 cols): Payment & Policy breakdown */}
                  <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <span className="text-sm font-bold text-on-surface">Resumen de Importe</span>

                    <div className="space-y-2.5 text-xs text-secondary pb-3 border-b border-surface-container">
                      <div className="flex justify-between">
                        <span>{selectedService.name} ({selectedService.duration_minutes} min)</span>
                        <span className="font-semibold text-on-surface">${selectedService.price} MXN</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bebida de cortesía (Espresso / Cerveza)</span>
                        <span className="font-semibold text-emerald-600">Gratis</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lavado y toalla caliente</span>
                        <span className="font-semibold text-emerald-600">Incluido</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="text-xs font-bold text-on-surface block">Total a liquidar</span>
                        <span className="text-[10px] text-secondary">Pago presencial al finalizar</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">${selectedService.price} MXN</span>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl text-[11px] text-secondary space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                        <span>Cancelación flexible</span>
                      </div>
                      <p>Puedes reprogramar o cancelar sin cargo hasta 2 horas antes de tu turno.</p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSubmit}
                      className="w-full h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          <span>Confirmando tu turno...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>Confirmar y asegurar mi turno</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Back */}
                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgendarWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-surface flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            <span>Cargando asistente de reserva...</span>
          </div>
        </div>
      }
    >
      <AgendarWizardContent />
    </Suspense>
  );
}

