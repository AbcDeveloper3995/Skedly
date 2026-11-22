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
  category: string;
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

const DEFAULT_PROFESSIONALS: PublicProfessional[] = [];

const DEFAULT_REVIEWS: ReviewItem[] = [];

const AVAILABLE_TIMES = ["11:30", "13:00", "15:30", "16:30", "17:15", "18:45"];

function PublicBookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const businessSlug = (params?.slug as string) || "urban-cuts";

  // Business State
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Urban Cuts");
  const [businessSubtitle, setBusinessSubtitle] = useState("Barbería Clásica & Moderna");
  const [businessDescription, setBusinessDescription] = useState(
    "Experiencia de barbería artesanal contemporánea. Cortes de alta precisión, afeitado tradicional y cuidado masculino sin fricción."
  );
  const [businessAddress, setBusinessAddress] = useState("Colima 152, Roma Norte, Ciudad de México");
  const [businessPhone, setBusinessPhone] = useState("+52 55 9123 4567");
  const [businessEmail, setBusinessEmail] = useState("contacto@urbancuts.mx");
  const [heroCoverUrl, setHeroCoverUrl] = useState(
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80"
  );
  const [galleryList, setGalleryList] = useState<string[]>([
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
  ]);
  const [services, setServices] = useState<PublicService[]>(DEFAULT_SERVICES);
  const [professionals, setProfessionals] = useState<PublicProfessional[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Schedules and existing appointments state
  const [workingHours, setWorkingHours] = useState<WorkingHourRecord[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityExceptionRecord[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointmentRecord[]>([]);

  // Filters
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([
    { id: "all", label: "Todos" },
  ]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Booking Modal State (Intelligent Entry Point)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrigin, setModalOrigin] = useState<"service" | "pro" | "hero">("service");
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Selected Booking Values
  const [selectedService, setSelectedService] = useState<PublicService>(DEFAULT_SERVICES[1]); // Default Corte Premium
  const [selectedProId, setSelectedProId] = useState<string>("any");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Customer Contact for Booking
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  // Booking Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Section Visibility Flags (Controlled by Business Owner in Dashboard)
  const [showHero, setShowHero] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showStaff, setShowStaff] = useState(true);
  const [showGallery, setShowGallery] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [showMap, setShowMap] = useState(true);

  // Mobile drawer / Simulator tooling view (disabled for clean production experience)
  const [showSimulatorBar, setShowSimulatorBar] = useState(false);

  // Load dynamic business data from Supabase
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
          if (biz.description) setBusinessDescription(biz.description);

          // 1. Fetch website settings (cover_url, headline, gallery, section visibility)
          const { data: webSettings } = await supabase
            .from("website_settings")
            .select("*")
            .eq("business_id", biz.id)
            .maybeSingle();

          if (webSettings) {
            if (webSettings.headline) setBusinessSubtitle(webSettings.headline);
            if (webSettings.cover_url) setHeroCoverUrl(webSettings.cover_url);
            if (webSettings.show_employee_profiles !== undefined && webSettings.show_employee_profiles !== null) {
              setShowStaff(webSettings.show_employee_profiles);
            }
            if (webSettings.show_prices !== undefined && webSettings.show_prices !== null) {
              setShowServices(webSettings.show_prices);
            }
            if (webSettings.about_text) {
              try {
                const parsed = JSON.parse(webSettings.about_text);
                if (parsed.description) setBusinessDescription(parsed.description);
                if (parsed.address) setBusinessAddress(parsed.address);
                if (Array.isArray(parsed.gallery) && parsed.gallery.length > 0) {
                  setGalleryList(parsed.gallery);
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
                setBusinessDescription(webSettings.about_text);
              }
            }
          }

          // 2. Load service categories & services from Supabase
          const { data: cats } = await supabase
            .from("service_categories")
            .select("id, name, display_order")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (cats && cats.length > 0) {
            setCategories([
              { id: "all", label: "Todos" },
              ...cats.map((c) => ({ id: c.id, label: c.name })),
            ]);
          } else {
            setCategories([{ id: "all", label: "Todos" }]);
          }

          const { data: srvs } = await supabase
            .from("services")
            .select("id, name, price, duration_minutes, description, category_id")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (srvs && srvs.length > 0) {
            const catMap = new Map((cats || []).map((c) => [c.id, c.name]));
            const mappedServices: PublicService[] = srvs.map((s, idx) => ({
              id: s.id,
              name: s.name,
              price: s.price,
              duration_minutes: s.duration_minutes,
              category: s.category_id || "all",
              category_label: (s.category_id && catMap.get(s.category_id)) || "Servicio",
              description: s.description || "Atención personalizada de alta calidad.",
              is_popular: idx === 0,
            }));
            setServices(mappedServices);
            setSelectedService(mappedServices[0]);
          }

          // 3. Load employees from Supabase
          const { data: emps, error: empsError } = await supabase
            .from("employees")
            .select("id, display_name, bio, avatar_url, is_active")
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .order("created_at", { ascending: true });

          if (emps && emps.length > 0) {
            const mappedPros: PublicProfessional[] = emps.map((e) => ({
              id: e.id,
              name: e.display_name,
              role: "Especialista",
              rating: 5.0,
              reviews_count: 0,
              experience: "Especialista verificado",
              specialty: e.bio || "Atención profesional y cuidado personalizado.",
              avatar_url: e.avatar_url || "",
            }));
            setProfessionals(mappedPros);
            setSelectedProId(mappedPros[0].id);
          } else {
            setProfessionals([]);
            setSelectedProId("any");
          }

          // 4. Load working_hours for business and employees
          const { data: whData } = await supabase
            .from("working_hours")
            .select("id, business_id, employee_id, weekday, start_time, end_time, is_available")
            .eq("business_id", biz.id);

          if (whData) {
            setWorkingHours(whData as WorkingHourRecord[]);
          }

          // 5. Load availability_exceptions
          const { data: excData } = await supabase
            .from("availability_exceptions")
            .select("id, business_id, employee_id, exception_date, is_available, start_time, end_time, reason")
            .eq("business_id", biz.id);

          if (excData) {
            setExceptions(excData as AvailabilityExceptionRecord[]);
          }

          // 6. Load existing appointments (status pending or confirmed) to prevent slot collisions
          const { data: apptsData } = await supabase
            .from("appointments")
            .select("id, employee_id, start_at, end_at, status")
            .eq("business_id", biz.id)
            .in("status", ["pending", "confirmed"]);

          if (apptsData) {
            setExistingAppointments(apptsData as ExistingAppointmentRecord[]);
          }
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

  // Available weekdays for the selected professional (or business if 'any')
  // Weekdays: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  const availableWeekdays = useMemo(() => {
    if (selectedProId === "any") {
      // If 'any', check if any employee is available on that day, or business hours
      const activeDays = new Set<number>();
      workingHours.forEach((wh) => {
        if (wh.is_available) {
          activeDays.add(wh.weekday);
        }
      });
      // If no hours defined at all, default Monday to Saturday (1..6)
      if (activeDays.size === 0) return [1, 2, 3, 4, 5, 6];
      return Array.from(activeDays).sort((a, b) => a - b);
    }

    // For a specific employee
    const empHours = workingHours.filter((wh) => wh.employee_id === selectedProId);
    if (empHours.length > 0) {
      return empHours.filter((wh) => wh.is_available).map((wh) => wh.weekday).sort((a, b) => a - b);
    }

    // Fallback to business hours (where employee_id is null)
    const bizHours = workingHours.filter((wh) => wh.employee_id === null && wh.is_available);
    if (bizHours.length > 0) {
      return bizHours.map((wh) => wh.weekday).sort((a, b) => a - b);
    }

    return [1, 2, 3, 4, 5]; // Default Lunes a Viernes
  }, [selectedProId, workingHours]);

  const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const availableDaysLabel = useMemo(() => {
    if (availableWeekdays.length === 0) return "Sin días de atención disponibles";
    if (availableWeekdays.length === 7) return "Lunes a Domingo";
    return availableWeekdays.map((d) => WEEKDAY_NAMES[d]).join(", ");
  }, [availableWeekdays]);

  // Next 14 upcoming days calendar list
  const upcomingDaysList = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      // Local YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const weekday = d.getDay();

      // Check if day is among available weekdays
      const isWorkingDay = availableWeekdays.includes(weekday);

      // Check for specific exception on this date
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
        dayName: WEEKDAY_NAMES[weekday].slice(0, 3), // Lun, Mar, etc.
        monthName: d.toLocaleDateString("es-ES", { month: "short" }),
        isToday: i === 0,
        isSelectable,
      });
    }

    return list;
  }, [availableWeekdays, exceptions, selectedProId]);

  // Keep selectedDate synchronized: if current selectedDate is not selectable, pick the first selectable date
  useEffect(() => {
    if (!upcomingDaysList || upcomingDaysList.length === 0) return;

    const currentIsValid = upcomingDaysList.some(
      (d) => d.dateStr === selectedDate && d.isSelectable
    );

    if (!currentIsValid) {
      const firstAvailable = upcomingDaysList.find((d) => d.isSelectable);
      if (firstAvailable) {
        setSelectedDate(firstAvailable.dateStr);
      } else {
        setSelectedDate("");
      }
    }
  }, [upcomingDaysList, selectedDate]);

  // Compute available dynamic time slots for selectedDate and selectedProId
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dateParts = selectedDate.split("-").map(Number);
    if (dateParts.length !== 3) return [];
    const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const weekday = targetDate.getDay();

    // Check if day is in availableWeekdays
    if (!availableWeekdays.includes(weekday)) return [];

    // Find working hours definition for this weekday
    let schedule = workingHours.find(
      (wh) =>
        (selectedProId !== "any" ? wh.employee_id === selectedProId : true) &&
        wh.weekday === weekday &&
        wh.is_available
    );

    // Fallback to business default if employee didn't have custom hours
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
    // Step interval: 30 minutes minimum or service duration
    const step = 30;

    const slots: string[] = [];
    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes() + 15; // 15 min buffer

    // Existing appointments on this date
    const dayAppointments = existingAppointments.filter((appt) => {
      if (selectedProId !== "any" && appt.employee_id && appt.employee_id !== selectedProId) {
        return false;
      }
      return appt.start_at.startsWith(selectedDate);
    });

    for (let m = startMinutes; m + duration <= endMinutes; m += step) {
      // If today, skip times that have already passed
      if (isToday && m < currentMinutesNow) {
        continue;
      }

      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotTimeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

      // Check collision with existing appointments
      const slotStart = m;
      const slotEnd = m + duration;

      const hasConflict = dayAppointments.some((appt) => {
        try {
          const apptStart = new Date(appt.start_at);
          const apptEnd = new Date(appt.end_at);
          const aStartM = apptStart.getHours() * 60 + apptStart.getMinutes();
          const aEndM = apptEnd.getHours() * 60 + apptEnd.getMinutes();
          // Collision condition: slotStart < aEndM && slotEnd > aStartM
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

  // Keep selectedTime synchronized: if current selectedTime is not among available slots, pick first slot
  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!availableTimeSlots.includes(selectedTime)) {
        setSelectedTime(availableTimeSlots[0]);
      }
    } else {
      setSelectedTime("");
    }
  }, [availableTimeSlots, selectedTime]);

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
    if (!selectedDate || !selectedTime) {
      alert("Por favor selecciona una fecha y hora disponibles.");
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService?.duration_minutes || 30) * 60000);

      const targetEmployeeId =
        selectedProId !== "any"
          ? selectedProId
          : professionals.length > 0
          ? professionals[0].id
          : null;

      if (businessId) {
        // 1. Prepare Customer ID (Client-generated UUID so anon does not need SELECT permissions)
        const newCustomerId = crypto.randomUUID();
        let customerId: string = newCustomerId;

        const { error: custErr } = await supabase
          .from("customers")
          .insert({
            id: newCustomerId,
            business_id: businessId,
            full_name: clientName.trim() || "Cliente Web",
            phone: clientPhone.trim() || null,
            email: clientEmail.trim() || null,
            notes: clientNotes.trim() || null,
          });

        if (custErr) {
          console.error("Error al registrar cliente:", custErr);
          alert(`No se pudo registrar los datos del cliente: ${custErr.message}`);
          setIsSubmittingBooking(false);
          return;
        }

        // 2. Prepare Appointment ID (Client-generated UUID)
        const newApptId = crypto.randomUUID();
        const { error: apptErr } = await supabase
          .from("appointments")
          .insert({
            id: newApptId,
            business_id: businessId,
            customer_id: customerId,
            employee_id: targetEmployeeId,
            start_at: startDateTime.toISOString(),
            end_at: endDateTime.toISOString(),
            status: "confirmed",
            source: "public_page",
            customer_name_snapshot: clientName.trim() || "Cliente Web",
            customer_phone_snapshot: clientPhone.trim() || null,
            customer_email_snapshot: clientEmail.trim() || null,
            internal_notes: clientNotes.trim() ? `Nota cliente: ${clientNotes.trim()}` : null,
          });

        if (apptErr) {
          console.error("Error al crear cita:", apptErr);
          alert(`No se pudo agendar la cita: ${apptErr.message}`);
          setIsSubmittingBooking(false);
          return;
        }

        // 3. Insert into appointment_services
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
          console.warn("Advertencia al vincular servicio:", srvErr);
        }

        // Trigger email notification if email provided
        if (clientEmail && clientEmail.includes("@")) {
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
              scheduledDate: selectedDate,
              scheduledTime,
              reservationCode: `#SK-${newApptId.slice(0, 5).toUpperCase()}`,
            }),
          }).catch((e) => console.warn("Email trigger error:", e));
        }

        // Refresh existing appointments in local state
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

      setIsSubmittingBooking(false);
      setBookingConfirmed(true);
      setToastMessage(
        `¡Cita confirmada para el ${selectedDate} a las ${selectedTime}! Te esperamos en ${businessName}.`
      );

      // Clean inputs
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setClientNotes("");

      setTimeout(() => {
        setIsModalOpen(false);
        setBookingConfirmed(false);
        setToastMessage(null);
        setBookingStep(1);
      }, 3500);
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
            {showServices && (
              <a href="#servicios" className="hover:text-on-surface transition-colors">
                Servicios
              </a>
            )}
            {showStaff && (
              <a href="#profesionales" className="hover:text-on-surface transition-colors">
                Profesionales
              </a>
            )}
            {showGallery && (
              <a href="#galeria" className="hover:text-on-surface transition-colors">
                Galería
              </a>
            )}
            {showReviews && (
              <a href="#reseñas" className="hover:text-on-surface transition-colors">
                Reseñas
              </a>
            )}
            {showMap && (
              <a href="#contacto" className="hover:text-on-surface transition-colors">
                Contacto
              </a>
            )}
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
      {/* 2. HERO SECTION & QUICK METRICS                              */}
      {/* ============================================================ */}
      {showHero && (
        <>
          <section id="inicio" className="relative w-full overflow-hidden bg-inverse-surface text-surface">
            {/* Vivid Natural Cover Background */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center scale-105 transition-transform duration-1000 ease-out"
              style={{
                backgroundImage: `url('${heroCoverUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80"}')`,
              }}
            />
            {/* Natural gradient overlay that preserves vibrant colors while guaranteeing clear text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

            <div className="relative max-w-[1280px] mx-auto px-6 lg:px-12 pt-20 pb-20 lg:pt-28 lg:pb-28 flex flex-col justify-center">
              {/* Slogan Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary-container/20 text-primary-fixed backdrop-blur-md self-start mb-5 border border-primary-fixed/20">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="text-xs font-semibold tracking-wide">{businessSubtitle || "Tu estilo, nuestra especialidad"}</span>
              </div>

              {/* Title & Description */}
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface tracking-tight">
                  {businessName}
                </h1>
                <p className="text-xl sm:text-2xl text-surface-variant font-normal leading-relaxed">
                  {businessDescription || "Experiencia de barbería artesanal contemporánea."}
                </p>
                <p className="text-sm sm:text-base text-surface-variant/80 max-w-2xl leading-relaxed">
                  Descubre una experiencia de calidad superior. Elige tu servicio, selecciona tu horario preferido y agenda en segundos de manera fácil y rápida.
                </p>
              </div>

              {/* Quick Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-6 pb-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface/10 backdrop-blur-md text-surface text-xs shadow-sm border border-surface/10">
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">star</span>
                  <span className="font-bold text-sm">4.9</span>
                  <span className="text-surface-variant text-[11px]">(Reseñas verificadas)</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface/10 backdrop-blur-md text-surface text-xs shadow-sm border border-surface/10">
                  <span className="material-symbols-outlined text-primary-fixed text-[18px]">location_on</span>
                  <span>{businessAddress ? businessAddress.split(",")[0] : "Instalaciones de primer nivel"}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 backdrop-blur-md text-xs shadow-sm border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Atención en local</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={openBookingGeneric}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  <span>Reservar una cita</span>
                </button>
                {showServices && (
                  <a
                    href="#servicios"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface-container-highest/20 text-surface hover:bg-surface-container-highest/30 backdrop-blur-md font-semibold text-xs transition-all border border-surface/10"
                  >
                    <span>Ver servicios y precios</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* QUICK METRICS OVERLAP BAR */}
          <div className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 -mt-8 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-surface-container-lowest shadow-md border border-outline-variant/30">
              <div className="flex items-center gap-3.5 p-2">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                  <span className="material-symbols-outlined text-[22px]">timer</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-on-surface">Puntualidad 100%</p>
                  <p className="text-[11px] text-secondary">Cero esperas innecesarias</p>
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
                  <p className="text-xs sm:text-sm font-bold text-on-surface">Atención de cortesía</p>
                  <p className="text-[11px] text-secondary">Bebida y confort</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-2">
                <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-on-surface">Pago en el local</p>
                  <p className="text-[11px] text-secondary">Efectivo o Tarjeta bancaria</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 4. SECTION: NUESTROS SERVICIOS                               */}
      {/* ============================================================ */}
      {showServices && (
        <section id="servicios" className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 pt-24 pb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Catálogo de Servicios</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Nuestros Servicios</h2>
              <p className="text-xs sm:text-sm text-secondary mt-1">
                Selecciona el tratamiento ideal y asegura tu horario con tu profesional de confianza.
              </p>
            </div>

            {/* Category Filter Pills (Real Business Categories) */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-surface-container">
              {categories.map((cat) => {
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
      )}

      {/* ============================================================ */}
      {/* 5. SECTION: NUESTRO EQUIPO                                   */}
      {/* ============================================================ */}
      {showStaff && (
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
            {professionals.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">diversity_3</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">Atención profesional de nuestro equipo</h3>
                <p className="text-xs sm:text-sm text-secondary mt-2 max-w-md leading-relaxed">
                  Todas las citas en {businessName} son atendidas directamente por especialistas verificados. Al agendar se te asignará el turno disponible más conveniente.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={openBookingGeneric}
                    className="px-6 py-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>Reservar cita con nuestro equipo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {professionals.map((pro) => (
                  <div
                    key={pro.id}
                    className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-outline-variant/30"
                  >
                    <div className="relative h-64 w-full overflow-hidden bg-surface-container">
                      {pro.avatar_url ? (
                        <img
                          src={pro.avatar_url}
                          alt={pro.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-high text-primary">
                          <div className="w-20 h-20 rounded-2xl bg-primary text-on-primary font-bold text-2xl flex items-center justify-center shadow-md">
                            {pro.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-secondary mt-3">Especialista verificado</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-emerald-500 text-[16px]">verified</span>
                        <span className="text-xs font-bold text-on-surface">Verificado</span>
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
                          className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-primary text-on-surface hover:text-on-primary text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          Reservar con {pro.name.split(" ")[0]}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
      )}

      {/* ============================================================ */}
      {/* 6. SECTION: GALERÍA DE FOTOS (Bento Grid)                     */}
      {/* ============================================================ */}
      {showGallery && (
        <section id="galeria" className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 pt-20 pb-28">
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
              <span>{businessAddress ? businessAddress.split(",")[0] : businessName}</span>
            </div>
          </div>

          {/* 4-Photo Responsive Bento Gallery (No Overflow) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-5 auto-rows-[230px]">
            {/* Photo 1: Big Interior View */}
            <div className="sm:col-span-2 md:col-span-6 md:row-span-2 relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-outline-variant/20 min-h-[230px]">
              <img
                src={galleryList[0] || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80"}
                alt="Instalaciones del negocio"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="text-surface">
                  <p className="text-sm font-bold">Instalaciones & Confort</p>
                  <p className="text-xs text-surface-variant">{businessName}</p>
                </div>
              </div>
            </div>

            {/* Photo 2: Detail */}
            <div className="md:col-span-3 md:row-span-1 relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-outline-variant/20 min-h-[200px]">
              <img
                src={galleryList[1] || "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80"}
                alt="Detalles de servicio"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-xs font-bold text-surface">Precisión y Estilo</span>
              </div>
            </div>

            {/* Photo 3: Area */}
            <div className="md:col-span-3 md:row-span-1 relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-outline-variant/20 min-h-[200px]">
              <img
                src={galleryList[2] || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"}
                alt="Área de atención"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-xs font-bold text-surface">Ambiente Exclusivo</span>
              </div>
            </div>

            {/* Photo 4: Visítanos */}
            <div className="sm:col-span-2 md:col-span-6 md:row-span-1 relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-outline-variant/20 min-h-[200px]">
              <img
                src={galleryList[3] || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80"}
                alt="Fachada"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="text-surface">
                  <p className="text-sm font-bold">Visítanos</p>
                  <p className="text-xs text-surface-variant">{businessAddress}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 7. SECTION: RESEÑAS DE CLIENTES                              */}
      {/* ============================================================ */}
      {showReviews && (
        <section id="reseñas" className="w-full bg-surface-container-low/70 pt-24 pb-28 border-y border-outline-variant/30 mt-10">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            {/* Reviews Header with Score Card */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
              <div>
                <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Opiniones Verificadas</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Lo que dicen nuestros clientes</h2>
                <p className="text-xs sm:text-sm text-secondary mt-1">Calificaciones de citas reales completadas en nuestro establecimiento.</p>
              </div>

              {/* Metric Aggregate Card */}
              <div className="flex items-center gap-6 p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 self-start lg:self-auto">
                <div className="flex flex-col items-center justify-center border-r border-surface-container pr-6">
                  <span className="text-4xl font-bold text-on-surface leading-none">5.0</span>
                  <div className="flex items-center gap-0.5 text-amber-500 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]">star</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Compromiso de Calidad</p>
                  <p className="text-xs text-secondary">Opiniones 100% de clientes reales</p>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Citas verificadas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Cards Grid or Authentic Empty State */}
            {reviews.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">rate_review</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">Sé el primero en compartir tu experiencia</h3>
                <p className="text-xs sm:text-sm text-secondary mt-2 max-w-md leading-relaxed">
                  En {businessName} valoramos la autenticidad. Al finalizar tu cita de servicio podrás evaluar nuestra atención y dejar tu testimonio verificado.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openBookingGeneric}
                    className="px-6 py-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>Reservar mi cita ahora</span>
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 8. SECTION: INFORMACIÓN DEL NEGOCIO Y CONTACTO                */}
      {/* ============================================================ */}
      {showMap && (
        <section id="contacto" className="max-w-[1280px] w-full mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Column: Business Details & Contact Cards */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span>Ubicación y Contacto</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                  {businessAddress ? `Encuéntranos en ${businessAddress.split(",")[0]}` : `Visita ${businessName}`}
                </h2>
                <p className="text-xs sm:text-sm text-secondary mt-1">
                  Instalaciones modernas y confortables preparadas para brindarte la mejor experiencia.
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
                      {businessAddress || "Atención presencial en nuestras instalaciones"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href={`https://wa.me/${(businessPhone || "").replace(/[^0-9]/g, "")}?text=Hola,%20quisiera%20consultar%20una%20duda%20sobre%20mi%20cita%20en%20${encodeURIComponent(businessName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>Mensaje por WhatsApp</span>
                  </a>
                  <div className="flex items-center gap-2 text-secondary text-xs px-2">
                    <span className="material-symbols-outlined text-[18px]">phone</span>
                    <span className="font-semibold">{businessPhone || "Contacto directo"}</span>
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
                  Síguenos en redes: <strong className="text-on-surface font-semibold hover:text-primary transition-colors cursor-pointer">@{businessSlug}</strong>
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Map Preview Card */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-md bg-surface-container flex flex-col justify-between border border-outline-variant/30">
                {/* Real Interactive Google Maps Embed */}
                <iframe
                  title={`Ubicación de ${businessName}`}
                  width="100%"
                  height="100%"
                  className="absolute inset-0 w-full h-full min-h-[420px] border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(businessAddress || businessName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
                <div className="relative m-4 self-start px-3.5 py-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center gap-2 text-on-surface border border-outline-variant/20 z-10 pointer-events-none">
                  <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                  <span className="text-xs font-bold">{businessName}</span>
                </div>
                <div className="relative m-4 p-4 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md shadow-md flex items-center justify-between gap-4 border border-outline-variant/20 z-10">
                  <div>
                    <p className="text-xs font-bold text-on-surface">{businessAddress ? businessAddress.split(",")[0] : businessName}</p>
                    <p className="text-[11px] text-secondary">Ubicación y atención profesional</p>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(businessAddress || businessName)}`}
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
      )}

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
                            {pro.avatar_url ? (
                              <img
                                src={pro.avatar_url}
                                alt={pro.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                                {pro.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                            )}
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
                          Días de atención con <span className="font-bold text-primary">{selectedPro.name}</span>:
                        </p>
                        <p className="text-[11px] text-secondary mt-0.5 font-medium">
                          {availableDaysLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {bookingStep === 2 && (
                <>
                  {/* Step 2: Date, Time & Client Info */}
                  {/* Specialist & Available Days summary banner */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">badge</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">
                          Atención con: {selectedPro.name}
                        </p>
                        <p className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                          <span>Días disponibles: <strong className="text-on-surface">{availableDaysLabel}</strong></span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Day Picker Carousel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                        <span>Selecciona un día disponible</span>
                      </span>
                      <span className="text-[10px] font-medium text-secondary">
                        Próximos 14 días
                      </span>
                    </label>

                    <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
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
                            className={`flex flex-col items-center justify-center min-w-[62px] py-2.5 px-1.5 rounded-xl border text-center transition-all shrink-0 ${
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
                            <span className="text-base font-bold my-0.5">
                              {d.dayNumber}
                            </span>
                            <span className="text-[9px] capitalize">
                              {d.monthName}
                            </span>
                            {!isAvailable && (
                              <span className="text-[8px] mt-0.5 font-medium text-red-400">
                                No labora
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Time Slots Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                        <span>Horarios disponibles ({selectedDate || "Selecciona un día"})</span>
                      </label>
                      <span className="text-[10px] font-medium text-secondary">
                        {availableTimeSlots.length} turnos libres
                      </span>
                    </div>

                    {availableTimeSlots.length === 0 ? (
                      <div className="p-4 rounded-xl bg-surface-container-low text-center border border-dashed border-outline-variant/40">
                        <p className="text-xs font-semibold text-secondary">
                          No hay turnos disponibles para esta fecha.
                        </p>
                        <p className="text-[11px] text-secondary/80 mt-1">
                          Prueba seleccionando otro de los días activos del especialista.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {availableTimeSlots.map((time) => {
                          const isSel = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`h-10 rounded-xl text-xs font-bold transition-all ${
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
                  <span>{businessAddress || "Atención presencial"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">call</span>
                  <span>{businessPhone || "Contacto directo"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">mail</span>
                  <span>{businessEmail || `contacto@${businessSlug}.com`}</span>
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

