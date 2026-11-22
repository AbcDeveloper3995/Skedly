"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Types
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category: string;
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

interface WorkingHourRecord {
  id: string;
  business_id: string;
  employee_id: string | null;
  weekday: number; // 0=Dom..6=Sáb
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AvailabilityExceptionRecord {
  id: string;
  business_id: string;
  employee_id: string | null;
  exception_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface ExistingAppointmentRecord {
  id: string;
  employee_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
}

const DEFAULT_SERVICES: ServiceOption[] = [
  {
    id: "srv-1",
    name: "Corte Clásico",
    price: 180,
    duration_minutes: 30,
    category: "all",
    category_label: "Servicio",
    description: "Corte personalizado a tijera o máquina con acabado profesional.",
    is_popular: true,
    includes_text: "Lavado incluido",
  },
];

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function AgendarWizardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const businessSlug = (params?.slug as string) || "barberia-demo-3474";

  // Business State
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Cargando negocio...");
  const [businessSubtitle, setBusinessSubtitle] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [services, setServices] = useState<ServiceOption[]>(DEFAULT_SERVICES);
  const [categories, setCategories] = useState<{ id: string; label: string; count: number }[]>([
    { id: "all", label: "Todos", count: 0 },
  ]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHourRecord[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityExceptionRecord[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointmentRecord[]>([]);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);

  // Stepper State: 1 (Servicio), 2 (Profesional), 3 (Fecha y Hora), 4 (Datos), 5 (Confirmar), 6 (Completada)
  const initialStepParam = Number(searchParams.get("step")) || 1;
  const [currentStep, setCurrentStep] = useState<number>(
    initialStepParam >= 1 && initialStepParam <= 6 ? initialStepParam : 1
  );

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceOption>(DEFAULT_SERVICES[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProId, setSelectedProId] = useState<string>("any");

  // Date & Time (Real YYYY-MM-DD and HH:MM)
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Customer Contact Fields (Clean, no test data)
  const [clientName, setClientName] = useState("");
  const [countryCode, setCountryCode] = useState("+52");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  // Confirmation Code & Status
  const [reservationCode, setReservationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load real business data from Supabase
  useEffect(() => {
    if (!businessSlug) return;

    supabase
      .from("businesses")
      .select("id, name, slug, phone, email, description, timezone")
      .eq("slug", businessSlug)
      .maybeSingle()
      .then(async ({ data: biz }) => {
        if (biz) {
          setBusinessId(biz.id);
          if (biz.name) setBusinessName(biz.name);
          if (biz.phone) setBusinessPhone(biz.phone);
          if (biz.email) setBusinessEmail(biz.email);

          // 1. Fetch website settings
          const { data: webSettings } = await supabase
            .from("website_settings")
            .select("*")
            .eq("business_id", biz.id)
            .maybeSingle();

          if (webSettings) {
            if (webSettings.headline) setBusinessSubtitle(webSettings.headline);
            if (webSettings.about_text) {
              try {
                const parsed = JSON.parse(webSettings.about_text);
                if (parsed.address) setBusinessAddress(parsed.address);
              } catch {
                // Not JSON
              }
            }
          }

          // 2. Fetch Categories
          const { data: cats } = await supabase
            .from("service_categories")
            .select("id, name, display_order")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          // 3. Fetch Services
          const { data: srvs } = await supabase
            .from("services")
            .select("id, name, price, duration_minutes, description, category_id")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (srvs && srvs.length > 0) {
            const catMap = new Map((cats || []).map((c) => [c.id, c.name]));
            const mappedServices: ServiceOption[] = srvs.map((s, idx) => ({
              id: s.id,
              name: s.name,
              price: s.price,
              duration_minutes: s.duration_minutes,
              category: s.category_id || "all",
              category_label: (s.category_id && catMap.get(s.category_id)) || "General",
              description: s.description || "Atención personalizada y profesional.",
              is_popular: idx === 0,
              includes_text: "Servicio garantizado",
            }));

            setServices(mappedServices);
            setSelectedService(mappedServices[0]);

            // Build dynamic category counts
            const counts: Record<string, number> = { all: mappedServices.length };
            mappedServices.forEach((s) => {
              counts[s.category] = (counts[s.category] || 0) + 1;
            });

            const catList = [
              { id: "all", label: "Todos", count: mappedServices.length },
              ...(cats || []).map((c) => ({
                id: c.id,
                label: c.name,
                count: counts[c.id] || 0,
              })),
            ];
            setCategories(catList);
          }

          // 4. Fetch Employees
          const { data: emps } = await supabase
            .from("employees")
            .select("id, display_name, bio, avatar_url, is_active")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .order("created_at", { ascending: true });

          if (emps && emps.length > 0) {
            const mappedPros: ProfessionalOption[] = emps.map((e) => ({
              id: e.id,
              name: e.display_name,
              role: "Especialista verificado",
              rating: 5.0,
              reviews_count: 0,
              next_slot: "Disponible para agendar",
              avatar_url: e.avatar_url || "",
              specialty: e.bio || "Atención profesional y cuidado garantizado.",
            }));
            setProfessionals(mappedPros);
            setSelectedProId(mappedPros[0].id);
          } else {
            setProfessionals([]);
            setSelectedProId("any");
          }

          // 5. Fetch Working Hours
          const { data: whData } = await supabase
            .from("working_hours")
            .select("id, business_id, employee_id, weekday, start_time, end_time, is_available")
            .eq("business_id", biz.id);

          if (whData) setWorkingHours(whData as WorkingHourRecord[]);

          // 6. Fetch Availability Exceptions
          const { data: excData } = await supabase
            .from("availability_exceptions")
            .select("id, business_id, employee_id, exception_date, is_available, start_time, end_time, reason")
            .eq("business_id", biz.id);

          if (excData) setExceptions(excData as AvailabilityExceptionRecord[]);

          // 7. Fetch Existing Appointments (prevent slot collision)
          const { data: apptsData } = await supabase
            .from("appointments")
            .select("id, employee_id, start_at, end_at, status")
            .eq("business_id", biz.id)
            .in("status", ["pending", "confirmed"]);

          if (apptsData) setExistingAppointments(apptsData as ExistingAppointmentRecord[]);

          setIsLoadingBusiness(false);
        }
      });
  }, [businessSlug]);

  // Selected Pro Object
  const selectedPro = useMemo(() => {
    if (selectedProId === "any") {
      return {
        id: "any",
        name: "Cualquier profesional disponible",
        role: "Mayor disponibilidad horaria",
        rating: 5.0,
        reviews_count: 0,
        next_slot: "Turnos rápidos",
        avatar_url: "",
        specialty: "El sistema asignará automáticamente al primer especialista libre en tu fecha y hora elegida.",
      };
    }
    return professionals.find((p) => p.id === selectedProId) || professionals[0] || {
      id: "any",
      name: "Cualquier profesional disponible",
      role: "Mayor disponibilidad",
      rating: 5.0,
      reviews_count: 0,
      next_slot: "Turnos rápidos",
      avatar_url: "",
      specialty: "Atención profesional directa.",
    };
  }, [professionals, selectedProId]);

  // Filtered Services for Step 1
  const filteredServices = useMemo(() => {
    if (categoryFilter === "all") return services;
    return services.filter((s) => s.category === categoryFilter);
  }, [categoryFilter, services]);

  // Available Weekdays for selected pro
  const availableWeekdays = useMemo(() => {
    if (selectedProId === "any") {
      const activeDays = new Set<number>();
      workingHours.forEach((wh) => {
        if (wh.is_available) activeDays.add(wh.weekday);
      });
      if (activeDays.size === 0) return [1, 2, 3, 4, 5, 6];
      return Array.from(activeDays).sort((a, b) => a - b);
    }

    const empHours = workingHours.filter((wh) => wh.employee_id === selectedProId);
    if (empHours.length > 0) {
      return empHours.filter((wh) => wh.is_available).map((wh) => wh.weekday).sort((a, b) => a - b);
    }

    const bizHours = workingHours.filter((wh) => wh.employee_id === null && wh.is_available);
    if (bizHours.length > 0) {
      return bizHours.map((wh) => wh.weekday).sort((a, b) => a - b);
    }

    return [1, 2, 3, 4, 5];
  }, [selectedProId, workingHours]);

  const availableDaysLabel = useMemo(() => {
    if (availableWeekdays.length === 0) return "Sin días de atención disponibles";
    if (availableWeekdays.length === 7) return "Lunes a Domingo";
    return availableWeekdays.map((d) => WEEKDAY_NAMES[d]).join(", ");
  }, [availableWeekdays]);

  // Upcoming Days List (Next 14 days)
  const upcomingDaysList = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const weekday = d.getDay();

      const isWorkingDay = availableWeekdays.includes(weekday);

      const hasFullDayOff = exceptions.some((exc) => {
        const matchesTarget =
          selectedProId === "any"
            ? true
            : exc.employee_id === selectedProId || exc.employee_id === null;
        return matchesTarget && exc.exception_date === dateStr && !exc.is_available;
      });

      const isSelectable = isWorkingDay && !hasFullDayOff;

      list.push({
        dateStr,
        weekday,
        dayNumber: d.getDate(),
        dayName: WEEKDAY_NAMES[weekday].slice(0, 3),
        fullWeekdayName: WEEKDAY_NAMES[weekday],
        monthName: d.toLocaleDateString("es-ES", { month: "short" }),
        fullMonthName: d.toLocaleDateString("es-ES", { month: "long" }),
        year,
        isSelectable,
      });
    }

    return list;
  }, [availableWeekdays, exceptions, selectedProId]);

  // Keep selectedDate synchronized
  useEffect(() => {
    if (!upcomingDaysList || upcomingDaysList.length === 0) return;
    const currentIsValid = upcomingDaysList.some((d) => d.dateStr === selectedDate && d.isSelectable);

    if (!currentIsValid) {
      const firstAvailable = upcomingDaysList.find((d) => d.isSelectable);
      if (firstAvailable) {
        setSelectedDate(firstAvailable.dateStr);
      } else {
        setSelectedDate("");
      }
    }
  }, [upcomingDaysList, selectedDate]);

  // Dynamic Time Slots with collision detection
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dateParts = selectedDate.split("-").map(Number);
    if (dateParts.length !== 3) return [];
    const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const weekday = targetDate.getDay();

    if (!availableWeekdays.includes(weekday)) return [];

    let schedule = workingHours.find(
      (wh) =>
        (selectedProId !== "any" ? wh.employee_id === selectedProId : true) &&
        wh.weekday === weekday &&
        wh.is_available
    );

    if (!schedule) {
      schedule = workingHours.find(
        (wh) => wh.employee_id === null && wh.weekday === weekday && wh.is_available
      );
    }

    const startTimeStr = schedule?.start_time ? schedule.start_time.slice(0, 5) : "09:00";
    const endTimeStr = schedule?.end_time ? schedule.end_time.slice(0, 5) : "18:00";

    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = selectedService?.duration_minutes || 30;
    const step = 30;

    const slots: string[] = [];
    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes() + 15;

    const dayAppointments = existingAppointments.filter((appt) => {
      if (selectedProId !== "any" && appt.employee_id && appt.employee_id !== selectedProId) {
        return false;
      }
      return appt.start_at.startsWith(selectedDate);
    });

    for (let m = startMinutes; m + duration <= endMinutes; m += step) {
      if (isToday && m < currentMinutesNow) {
        continue;
      }

      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotTimeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

      const slotStart = m;
      const slotEnd = m + duration;

      const hasConflict = dayAppointments.some((appt) => {
        try {
          const apptStart = new Date(appt.start_at);
          const apptEnd = new Date(appt.end_at);
          const aStartM = apptStart.getHours() * 60 + apptStart.getMinutes();
          const aEndM = apptEnd.getHours() * 60 + apptEnd.getMinutes();
          return slotStart < aEndM && slotEnd > aStartM;
        } catch {
          return false;
        }
      });

      if (!hasConflict) {
        slots.push(slotTimeStr);
      }
    }

    return slots;
  }, [selectedDate, selectedProId, availableWeekdays, workingHours, selectedService, existingAppointments]);

  // Keep selectedTime synchronized
  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!availableTimeSlots.includes(selectedTime)) {
        setSelectedTime(availableTimeSlots[0]);
      }
    } else {
      setSelectedTime("");
    }
  }, [availableTimeSlots, selectedTime]);

  // Selected Date Display Helpers
  const selectedDayObject = useMemo(() => {
    return upcomingDaysList.find((d) => d.dateStr === selectedDate) || upcomingDaysList[0];
  }, [upcomingDaysList, selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDayObject) return selectedDate;
    return `${selectedDayObject.fullWeekdayName}, ${selectedDayObject.dayNumber} de ${selectedDayObject.fullMonthName} de ${selectedDayObject.year}`;
  }, [selectedDayObject, selectedDate]);

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
    if (!selectedDate || !selectedTime) {
      alert("Por favor selecciona una fecha y hora disponibles.");
      return;
    }

    if (!clientName.trim() || !clientPhone.trim()) {
      alert("Por favor completa tu nombre y número de teléfono.");
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generate Appointment UUID first to derive exact deterministic reservation code
      const newApptId = crypto.randomUUID();
      const codeGenerated = `#SK-${newApptId.slice(0, 5).toUpperCase()}`;
      setReservationCode(codeGenerated);

      const fullPhone = `${countryCode} ${clientPhone.trim()}`;
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService?.duration_minutes || 30) * 60000);

      const targetEmployeeId =
        selectedProId !== "any"
          ? selectedProId
          : professionals.length > 0
          ? professionals[0].id
          : null;

      if (businessId) {
        // 2. Client-generated UUID for customer
        const newCustomerId = crypto.randomUUID();
        const { error: custErr } = await supabase.from("customers").insert({
          id: newCustomerId,
          business_id: businessId,
          full_name: clientName.trim(),
          phone: fullPhone,
          email: clientEmail.trim() || null,
          notes: clientNotes.trim() || null,
        });

        if (custErr) {
          console.error("Error creating customer:", custErr);
          alert(`No se pudo registrar tus datos de contacto: ${custErr.message}`);
          setIsSubmitting(false);
          return;
        }

        // 3. Insert appointment with matching ID
        const { error: apptErr } = await supabase.from("appointments").insert({
          id: newApptId,
          business_id: businessId,
          customer_id: newCustomerId,
          employee_id: targetEmployeeId,
          start_at: startDateTime.toISOString(),
          end_at: endDateTime.toISOString(),
          status: "confirmed",
          source: "public_page",
          customer_name_snapshot: clientName.trim(),
          customer_phone_snapshot: fullPhone,
          customer_email_snapshot: clientEmail.trim() || null,
          internal_notes: clientNotes.trim() ? `[Reserva Online] ${clientNotes.trim()}` : "[Reserva Online]",
        });

        if (apptErr) {
          console.error("Error creating appointment:", apptErr);
          alert(`No se pudo agendar la cita: ${apptErr.message}`);
          setIsSubmitting(false);
          return;
        }

        // 3. Insert appointment services
        const { error: srvErr } = await supabase.from("appointment_services").insert({
          business_id: businessId,
          appointment_id: newApptId,
          service_id: selectedService.id.startsWith("srv-") ? null : selectedService.id,
          service_name: selectedService.name,
          unit_price: selectedService.price,
          duration_minutes: selectedService.duration_minutes,
          quantity: 1,
        });

        if (srvErr) {
          console.warn("Advertencia al guardar servicio:", srvErr);
        }

        // Send confirmation email asynchronously if clientEmail is present
        if (clientEmail && clientEmail.includes("@")) {
          try {
            fetch("/api/send-booking-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientEmail: clientEmail.trim(),
                clientName: clientName.trim(),
                businessName,
                businessAddress,
                businessPhone,
                serviceName: selectedService.name,
                servicePrice: selectedService.price,
                serviceDuration: selectedService.duration_minutes,
                proName: selectedPro.name,
                scheduledDate: selectedDateFormatted,
                scheduledTime,
                reservationCode: codeGenerated,
              }),
            }).catch((e) => console.warn("Email trigger error:", e));
          } catch (e) {
            console.warn("Could not send email:", e);
          }
        }

        // Refresh local state to prevent collisions in current session
        setExistingAppointments((prev) => [
          ...prev,
          {
            id: newApptId,
            employee_id: targetEmployeeId,
            start_at: startDateTime.toISOString(),
            end_at: endDateTime.toISOString(),
            status: "confirmed",
          },
        ]);
      }

      setIsSubmitting(false);
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Booking submit error:", err);
      setIsSubmitting(false);
      alert("Ocurrió un error inesperado al procesar tu reserva. Intenta de nuevo.");
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
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">content_cut</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface leading-tight tracking-tight uppercase">
                  {businessName}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {businessSubtitle || "Agendamiento en línea"}
                </span>
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
              <span>Volver a {businessName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER                                               */}
      {/* ============================================================ */}
      <main className="w-full flex-1 pt-24 pb-16 bg-surface">
        {/* If Step 6: Confirmation Ticket Screen */}
        {currentStep === 6 ? (
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full relative overflow-hidden bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-10 flex flex-col items-center border border-outline-variant/30">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>

              {/* Header Status */}
              <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-emerald-600 text-[36px]">check_circle</span>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-emerald-200">
                  Cita Confirmada
                </span>

                <h1 className="text-2xl font-bold text-on-surface mb-2">
                  ¡Tu cita ha sido confirmada con éxito!
                </h1>

                <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm">
                  Hemos registrado tu reserva en el sistema de {businessName}. Te esperamos puntualmente.
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
                        Código de Reserva
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
                    <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center text-sm font-bold shadow-sm">
                      {businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface">{businessName}</h4>
                      <p className="text-[11px] text-secondary">{businessAddress || "Atención presencial en sucursal"}</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verificado
                  </span>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-xs">
                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">content_cut</span>
                      <span className="text-[10px] uppercase font-semibold">Servicio agendado</span>
                    </div>
                    <p className="font-bold text-on-surface">
                      {selectedService.name} ({selectedService.duration_minutes} min)
                    </p>
                    <span className="text-[10px] text-secondary">Atención completa garantizada</span>
                  </div>

                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                      <span className="text-[10px] uppercase font-semibold">Especialista asignado</span>
                    </div>
                    <p className="font-bold text-on-surface">{selectedPro.name}</p>
                    <span className="text-[10px] text-secondary">{selectedPro.role}</span>
                  </div>

                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-secondary mb-1">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      <span className="text-[10px] uppercase font-semibold">Fecha programada</span>
                    </div>
                    <p className="font-bold text-on-surface">{selectedDateFormatted}</p>
                    <span className="text-[10px] text-primary font-semibold">{selectedTime} hrs</span>
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
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    Registrado
                  </span>
                </div>
              </div>

              {/* Back to public home */}
              <div className="w-full text-center mt-6">
                <Link
                  href={`/reservas/${businessSlug}`}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  ← Volver a la página principal de {businessName}
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
                      className={`flex flex-col items-center relative z-10 ${
                        isDone ? "cursor-pointer" : "cursor-default"
                      }`}
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
                          <span className="text-primary font-semibold">
                            {selectedDateFormatted} · {selectedTime} hrs
                          </span>
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
                    <span>{businessAddress || businessName}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                    ¿Qué servicio necesitas?
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Selecciona el servicio que deseas agendar en {businessName}. Precios informativos, pago en el local al finalizar.
                  </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((cat) => {
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
                                    Destacado
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
                    Selecciona quién realizará tu servicio o solicita el turno más pronto con cualquiera disponible en {businessName}.
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
                          El sistema te asignará automáticamente al primer especialista libre para la fecha que elijas.
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {professionals.map((pro) => {
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
                            {pro.avatar_url ? (
                              <img
                                src={pro.avatar_url}
                                alt={pro.name}
                                className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-surface-container"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                                {pro.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                            )}
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

                          <p className="text-xs text-secondary mt-2 line-clamp-2 leading-relaxed">
                            {pro.specialty}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl text-on-surface-variant text-[11px]">
                          <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                          <span className="truncate">Turnos disponibles</span>
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
                    Horarios en tiempo real sincronizados con la agenda de <strong className="text-on-surface">{selectedPro.name}</strong>. Días de atención: <strong className="text-primary">{availableDaysLabel}</strong>.
                  </p>
                </div>

                {/* 2-Column Calendar & Slots Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Calendar Widget (5 cols) */}
                  <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">date_range</span>
                        <span>Días disponibles (Próximos 14 días)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {upcomingDaysList.map((d) => {
                        const isSelected = selectedDate === d.dateStr;
                        const isAvailable = d.isSelectable;

                        return (
                          <button
                            key={d.dateStr}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) setSelectedDate(d.dateStr);
                            }}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                              isSelected
                                ? "bg-primary text-on-primary border-primary shadow-sm"
                                : isAvailable
                                ? "bg-surface-container-low hover:bg-surface-container border-outline-variant/30 text-on-surface cursor-pointer"
                                : "bg-surface-container-lowest/50 border-outline-variant/15 text-outline opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              {d.dayName}
                            </span>
                            <span className="text-lg font-bold my-0.5">
                              {d.dayNumber}
                            </span>
                            <span className="text-[10px] capitalize">
                              {d.monthName}
                            </span>
                            {!isAvailable && (
                              <span className="text-[9px] mt-1 font-semibold text-red-400">
                                No labora
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots (7 cols) */}
                  <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface">
                        Turnos libres para el {selectedDateFormatted}
                      </span>
                      <span className="text-xs text-primary font-semibold">
                        {availableTimeSlots.length} horarios disponibles
                      </span>
                    </div>

                    {availableTimeSlots.length === 0 ? (
                      <div className="p-8 rounded-xl bg-surface-container-low text-center border border-dashed border-outline-variant/40">
                        <span className="material-symbols-outlined text-secondary text-3xl mb-2">event_busy</span>
                        <p className="text-xs font-semibold text-secondary">
                          No hay turnos disponibles para esta fecha.
                        </p>
                        <p className="text-[11px] text-secondary/80 mt-1">
                          Prueba seleccionando otro de los días de atención activos del especialista.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {availableTimeSlots.map((time) => {
                          const isSel = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`py-3 rounded-xl text-xs font-bold transition-all ${
                                isSel
                                  ? "bg-primary text-on-primary shadow-sm ring-2 ring-primary ring-offset-1"
                                  : "bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/20"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    )}
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
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setCurrentStep(4)}
                    className="px-8 h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
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
                    <span>Reserva directa en {businessName}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Tus datos de contacto</h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Solo necesitamos la información indispensable para reservar tu turno y enviarte la confirmación.
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
                        placeholder="Ej. Roberto Sánchez"
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
                        <option value="+54">🇦🇷 +54 (AR)</option>
                        <option value="+56">🇨🇱 +56 (CL)</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-[18px]">smartphone</span>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Número de celular (ej. 55 1234 5678)"
                          className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
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
                        placeholder="tu@correo.com"
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface">Notas adicionales (opcional)</label>
                    <textarea
                      rows={2}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Ej. Preferencia específica para el servicio"
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
                    disabled={!clientName.trim() || !clientPhone.trim()}
                    onClick={() => setCurrentStep(5)}
                    className="px-8 h-12 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
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
                    Verifica que todos los datos sean correctos antes de confirmar tu reserva en {businessName}.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (7 cols): Booking Ticket Card */}
                  <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <div className="p-5 bg-surface-container-low border-b border-surface-container-high/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                          <span className="material-symbols-outlined text-[22px]">storefront</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Negocio</span>
                          <h3 className="text-sm font-bold text-on-surface">{businessName}</h3>
                          <p className="text-[11px] text-secondary">{businessAddress || "Atención en local"}</p>
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
                      {/* Service */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">content_cut</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-secondary uppercase font-semibold">Servicio</span>
                            <p className="text-xs sm:text-sm font-bold text-on-surface">
                              {selectedService.name} ({selectedService.duration_minutes} min)
                            </p>
                            <span className="text-xs font-semibold text-primary">${selectedService.price} MXN</span>
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

                      {/* Date & Time */}
                      <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-secondary uppercase font-semibold">Fecha y hora</span>
                            <p className="text-xs sm:text-sm font-bold text-on-surface">
                              {selectedDateFormatted}
                            </p>
                            <span className="text-xs font-semibold text-primary">{selectedTime} hrs</span>
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
                            <span className="text-xs text-secondary">{countryCode} {clientPhone} {clientEmail ? `• ${clientEmail}` : ""}</span>
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

                  {/* Right Column (5 cols): Payment summary */}
                  <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                    <span className="text-sm font-bold text-on-surface">Resumen de Importe</span>

                    <div className="space-y-2.5 text-xs text-secondary pb-3 border-b border-surface-container">
                      <div className="flex justify-between">
                        <span>{selectedService.name} ({selectedService.duration_minutes} min)</span>
                        <span className="font-semibold text-on-surface">${selectedService.price} MXN</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="text-xs font-bold text-on-surface block">Total a liquidar</span>
                        <span className="text-[10px] text-secondary">Pago presencial al finalizar en recepción</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">${selectedService.price} MXN</span>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl text-[11px] text-secondary space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                        <span>Cancelación flexible</span>
                      </div>
                      <p>Puedes reprogramar o cancelar directamente comunicándote con el negocio.</p>
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
