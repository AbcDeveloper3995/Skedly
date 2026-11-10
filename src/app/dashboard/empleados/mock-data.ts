export interface EmployeeService {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
}

export interface DaySchedule {
  day: string;
  dayShort: string;
  dayKey: string;
  weekday: number; // 0=Sunday, 1=Monday, etc.
  active: boolean;
  start: string;
  end: string;
  breakTime?: string;
  tag?: string;
}

export interface EmployeeException {
  id: string;
  title: string;
  dateRange: string;
  reason: string;
  blockedHours: string;
  type: "vacaciones" | "medico" | "personal";
  status: "Aprobada" | "Confirmado" | "Pendiente";
  registeredBy: string;
}

export interface RecentAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  time: string;
  seat?: string;
  price: number;
  currency: string;
  status: "En curso" | "Confirmada" | "Completada" | "No asistió";
  note?: string;
}

export interface FullEmployee {
  id: string;
  business_id?: string;
  display_name: string;
  job_title: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  internal_id: string;
  access_status: "activa" | "pendiente" | "sin-acceso";
  invited_at?: string;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  services: EmployeeService[];
  schedule_summary: string;
  break_summary: string;
  today_appointments: number;
  satisfaction: number;
  weekly_hours: number;
  seat: string;
  booking_slug: string;
  google_calendar_synced: boolean;
  last_sync_mins: number;
  weekly_schedule: DaySchedule[];
  exceptions: EmployeeException[];
  recentAppointments: RecentAppointment[];
}

export const INITIAL_SERVICES: EmployeeService[] = [
  { id: "srv-1", name: "Corte Clásico", category: "Cortes de cabello", duration: 30, price: 180 },
  { id: "srv-2", name: "Corte Premium", category: "Cortes de cabello", duration: 45, price: 250 },
  { id: "srv-3", name: "Corte Infantil", category: "Cortes de cabello", duration: 30, price: 150 },
  { id: "srv-4", name: "Perfilado de Barba", category: "Barba", duration: 20, price: 100 },
  { id: "srv-5", name: "Afeitado Clásico", category: "Barba", duration: 30, price: 140 },
  { id: "srv-6", name: "Tratamiento Capilar", category: "Tratamientos", duration: 45, price: 300 },
];

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: "Lunes", dayShort: "LUN", dayKey: "lun", weekday: 1, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
  { day: "Martes", dayShort: "MAR", dayKey: "mar", weekday: 2, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
  { day: "Miércoles", dayShort: "MIÉ", dayKey: "mie", weekday: 3, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
  { day: "Jueves", dayShort: "JUE", dayKey: "jue", weekday: 4, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
  { day: "Viernes", dayShort: "VIE", dayKey: "vie", weekday: 5, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Jornada ampliada" },
  { day: "Sábado", dayShort: "SÁB", dayKey: "sab", weekday: 6, active: true, start: "09:00", end: "14:30", tag: "Medio día" },
  { day: "Domingo", dayShort: "DOM", dayKey: "dom", weekday: 0, active: false, start: "09:00", end: "14:00", tag: "Descanso semanal" },
];

export const MOCK_EMPLOYEES: FullEmployee[] = [
  {
    id: "emp-1",
    display_name: "Carlos Ramírez",
    job_title: "Barbero Master • Especialista en fades",
    email: "carlos.ramirez@barberiaelite.com",
    phone: "+34 612 345 678",
    bio: "Más de 8 años de experiencia en barbería tradicional y técnicas de degradado contemporáneas.",
    avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9K1aq2CRrzUepq8h6sV4VHu1mUOK6fTwdegcWm8sgYV3COjX55a4F2ta1_n3PwXxJzhdkT88eDQubfpRRSbsS7Q6QZa76m3Fop_LMSNDMHmTJRPcG4UGq8i8vSFHkINOlvdGNjG-qpnNzSB_QKTYdsTY0TgEY-AeTbUfkNB4Y5gw8c0l8zt8jP9FF96EBQ5ikn7L5IHEj_hr_zL2mv9wZaK3kp0dXHH0BnyTjbBK9",
    internal_id: "EMP-0104",
    access_status: "activa",
    is_active: true,
    rating: 4.9,
    reviews_count: 128,
    services: [
      { id: "srv-1", name: "Corte Clásico", category: "Cortes de cabello", duration: 30, price: 180 },
      { id: "srv-2", name: "Corte Premium", category: "Cortes de cabello", duration: 45, price: 250 },
      { id: "srv-3", name: "Corte Infantil", category: "Cortes de cabello", duration: 30, price: 150 },
      { id: "srv-4", name: "Perfilado de Barba", category: "Barba", duration: 20, price: 100 },
    ],
    schedule_summary: "Lun a Sáb • 09:00 - 18:30",
    break_summary: "Pausa de comida 14:00 - 15:00",
    today_appointments: 6,
    satisfaction: 98,
    weekly_hours: 43.5,
    seat: "Sillón 01 (Principal)",
    booking_slug: "carlos-ramirez",
    google_calendar_synced: true,
    last_sync_mins: 12,
    weekly_schedule: [
      { day: "Lunes", dayShort: "LUN", dayKey: "lun", weekday: 1, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Martes", dayShort: "MAR", dayKey: "mar", weekday: 2, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Miércoles", dayShort: "MIÉ", dayKey: "mie", weekday: 3, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Jueves", dayShort: "JUE", dayKey: "jue", weekday: 4, active: true, start: "09:00", end: "18:30", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Viernes", dayShort: "VIE", dayKey: "vie", weekday: 5, active: true, start: "09:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Jornada ampliada" },
      { day: "Sábado", dayShort: "SÁB", dayKey: "sab", weekday: 6, active: true, start: "09:00", end: "14:30", tag: "Medio día" },
      { day: "Domingo", dayShort: "DOM", dayKey: "dom", weekday: 0, active: false, start: "09:00", end: "14:00", tag: "Descanso semanal" },
    ],
    exceptions: [
      {
        id: "exc-1",
        title: "Vacaciones de Invierno",
        dateRange: "24 Dic 2026 — 28 Dic 2026",
        reason: "Vacaciones anuales reglamentarias",
        blockedHours: "4 días completos (34 hrs)",
        type: "vacaciones",
        status: "Aprobada",
        registeredBy: "María Ramos (Admin)",
      },
      {
        id: "exc-2",
        title: "Permiso personal matutino",
        dateRange: "15 Nov 2026 • 09:00 a 13:00",
        reason: "Cita médica de rutina",
        blockedHours: "4 horas (Disp. desde 14:00)",
        type: "medico",
        status: "Confirmado",
        registeredBy: "Avisado con 12 días de anticipación",
      },
    ],
    recentAppointments: [
      {
        id: "app-1",
        clientName: "Alejandro Peña",
        serviceName: "Corte Premium + Barba",
        time: "Hoy 11:15 • Duración: 45 min • Sillón 01",
        seat: "Sillón 01",
        price: 250,
        currency: "MXN",
        status: "En curso",
      },
      {
        id: "app-2",
        clientName: "David Soria",
        serviceName: "Corte Clásico",
        time: "Hoy 15:30 • Duración: 30 min • Cliente habitual",
        seat: "Sillón 01",
        price: 180,
        currency: "MXN",
        status: "Confirmada",
      },
      {
        id: "app-3",
        clientName: "Iván Valdés",
        serviceName: "Corte Degradado",
        time: "Hoy 16:30 • Duración: 40 min • Pago anticipado",
        seat: "Sillón 01",
        price: 180,
        currency: "MXN",
        status: "Confirmada",
      },
      {
        id: "app-4",
        clientName: "Roberto Méndez",
        serviceName: "Corte Clásico",
        time: "Ayer 18:00 • Propina: $40 MXN • 5 ★ Calificación",
        price: 180,
        currency: "MXN",
        status: "Completada",
      },
      {
        id: "app-5",
        clientName: "Juan Carlos D.",
        serviceName: "Afeitado tradicional",
        time: "Ayer 16:30 • Penalización aplicada por política de no-show",
        price: 120,
        currency: "MXN",
        status: "No asistió",
      },
    ],
  },
  {
    id: "emp-2",
    display_name: "Luis Hernández",
    job_title: "Barbero • Clásico & Afeitados",
    email: "luis.h@barberia.com",
    phone: "+34 622 890 123",
    bio: "Enfocado en perfilados precisos y afeitado tradicional a navaja.",
    avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7v8PoVDe2bqh-OU5vgGOBiTqWx_DBK3awLJrPP981ih9z8ymxJhEVoHNcth4RhYDQ2iYrl1gqfIOynd-hkdFmNAFWNT6kHW711D1ScBbn9aiOYOkTFE_Pa5sSd0Bp_4A4iwxQDLZ8hNrmZaru2CnJVO6joItR5oMxH6_Og2pVMdTht9WUoYDcrwA1DNBTh6XCQSSBZzbFboPKipoWbFjGT5KZ1i5NFQ86o0_DI0vS",
    internal_id: "EMP-0108",
    access_status: "pendiente",
    invited_at: "Hace 2 días",
    is_active: true,
    rating: 4.8,
    reviews_count: 54,
    services: [
      { id: "srv-1", name: "Corte Clásico", category: "Cortes de cabello", duration: 30, price: 180 },
      { id: "srv-5", name: "Afeitado Clásico", category: "Barba", duration: 30, price: 140 },
      { id: "srv-4", name: "Perfilado Barba", category: "Barba", duration: 20, price: 100 },
    ],
    schedule_summary: "Mar a Sáb • 10:00 - 19:00",
    break_summary: "Descanso domingo y lunes",
    today_appointments: 3,
    satisfaction: 96,
    weekly_hours: 40.0,
    seat: "Sillón 02",
    booking_slug: "luis-hernandez",
    google_calendar_synced: false,
    last_sync_mins: 0,
    weekly_schedule: [
      { day: "Lunes", dayShort: "LUN", dayKey: "lun", weekday: 1, active: false, start: "10:00", end: "19:00", tag: "Descanso semanal" },
      { day: "Martes", dayShort: "MAR", dayKey: "mar", weekday: 2, active: true, start: "10:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Miércoles", dayShort: "MIÉ", dayKey: "mie", weekday: 3, active: true, start: "10:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Jueves", dayShort: "JUE", dayKey: "jue", weekday: 4, active: true, start: "10:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Viernes", dayShort: "VIE", dayKey: "vie", weekday: 5, active: true, start: "10:00", end: "19:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Sábado", dayShort: "SÁB", dayKey: "sab", weekday: 6, active: true, start: "09:00", end: "15:00", tag: "Medio día" },
      { day: "Domingo", dayShort: "DOM", dayKey: "dom", weekday: 0, active: false, start: "10:00", end: "15:00", tag: "Descanso semanal" },
    ],
    exceptions: [],
    recentAppointments: [],
  },
  {
    id: "emp-3",
    display_name: "Andrea Torres",
    job_title: "Estilista • Color & Tratamientos",
    email: "andrea.torres@barberia.com",
    phone: "+34 633 456 789",
    bio: "Colorimetría y tratamientos capilares avanzados para todo tipo de cabello.",
    avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRGUEDDbFvNfQT1rW_rSx17oHyuNwmCd29aNNzGa3XvqnZevfePZheqkkRbofqtQ_0I32iG-w30ivdzlKY1n5M-ikCkQf5K6qcWiBDtDNbXJ9EZTRzU_jTWV3V6kQmV4nRcNbRYtCLRwRJMDOaNyVjm2_0KigCp21SJgAjbOyBRgnF9ArhIw1IRuUfO_xpduE8YLjdhIoAQpVBu6eF8-1X78X8psHhokIBVdgz9hPd",
    internal_id: "EMP-0112",
    access_status: "sin-acceso",
    is_active: true,
    rating: 4.95,
    reviews_count: 92,
    services: [
      { id: "srv-6", name: "Tratamiento Capilar", category: "Tratamientos", duration: 45, price: 300 },
      { id: "srv-1", name: "Corte Clásico", category: "Cortes de cabello", duration: 30, price: 180 },
    ],
    schedule_summary: "Lun a Vie • 09:30 - 18:00",
    break_summary: "Sábados bajo solicitud",
    today_appointments: 5,
    satisfaction: 99,
    weekly_hours: 42.5,
    seat: "Cabina Estilismo",
    booking_slug: "andrea-torres",
    google_calendar_synced: false,
    last_sync_mins: 0,
    weekly_schedule: [
      { day: "Lunes", dayShort: "LUN", dayKey: "lun", weekday: 1, active: true, start: "09:30", end: "18:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Martes", dayShort: "MAR", dayKey: "mar", weekday: 2, active: true, start: "09:30", end: "18:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Miércoles", dayShort: "MIÉ", dayKey: "mie", weekday: 3, active: true, start: "09:30", end: "18:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Jueves", dayShort: "JUE", dayKey: "jue", weekday: 4, active: true, start: "09:30", end: "18:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Viernes", dayShort: "VIE", dayKey: "vie", weekday: 5, active: true, start: "09:30", end: "18:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Sábado", dayShort: "SÁB", dayKey: "sab", weekday: 6, active: false, start: "09:00", end: "14:00", tag: "Bajo solicitud" },
      { day: "Domingo", dayShort: "DOM", dayKey: "dom", weekday: 0, active: false, start: "09:00", end: "14:00", tag: "Descanso semanal" },
    ],
    exceptions: [],
    recentAppointments: [],
  },
  {
    id: "emp-4",
    display_name: "Sofía Martínez",
    job_title: "Tratamientos & Cuidado Facial",
    email: "sofia.martinez@barberia.com",
    phone: "+34 644 112 233",
    bio: "Especialista en dermocuidado, exfoliaciones y relajación para clientes exigentes.",
    avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzFWwKJT1Zlj1TlMwlMuJ0E9mRseaBOIf1CgaGOCCfFnLpKCgaRJ5z3qj6OFCTxYhZNe1TTO9J6_yxIUJD7Irl28DlFAR_5pYAy0FMbSj8ojlBA1daTXoHN7VqlxE_fQpNM8lqgXOIgSapJYVDPBmZZ4Dy1WBnjU-fXbD_tpMvOAGhy21ZRUvFgrZfI3RnqehwKzu1jigFIZEGiV5AZhWWcLmOpOpS7NIyvi256_SY",
    internal_id: "EMP-0115",
    access_status: "activa",
    is_active: true,
    rating: 5.0,
    reviews_count: 67,
    services: [
      { id: "srv-6", name: "Tratamiento Capilar", category: "Tratamientos", duration: 45, price: 300 },
    ],
    schedule_summary: "Mié a Dom • 11:00 - 20:00",
    break_summary: "Horario de tarde extendido",
    today_appointments: 4,
    satisfaction: 100,
    weekly_hours: 40.0,
    seat: "Cabina Facial 01",
    booking_slug: "sofia-martinez",
    google_calendar_synced: true,
    last_sync_mins: 45,
    weekly_schedule: [
      { day: "Lunes", dayShort: "LUN", dayKey: "lun", weekday: 1, active: false, start: "11:00", end: "20:00", tag: "Descanso semanal" },
      { day: "Martes", dayShort: "MAR", dayKey: "mar", weekday: 2, active: false, start: "11:00", end: "20:00", tag: "Descanso semanal" },
      { day: "Miércoles", dayShort: "MIÉ", dayKey: "mie", weekday: 3, active: true, start: "11:00", end: "20:00", breakTime: "15:00 - 16:00", tag: "Turno tarde" },
      { day: "Jueves", dayShort: "JUE", dayKey: "jue", weekday: 4, active: true, start: "11:00", end: "20:00", breakTime: "15:00 - 16:00", tag: "Turno tarde" },
      { day: "Viernes", dayShort: "VIE", dayKey: "vie", weekday: 5, active: true, start: "11:00", end: "20:00", breakTime: "15:00 - 16:00", tag: "Turno tarde" },
      { day: "Sábado", dayShort: "SÁB", dayKey: "sab", weekday: 6, active: true, start: "10:00", end: "18:00", breakTime: "14:00 - 15:00", tag: "Turno habitual" },
      { day: "Domingo", dayShort: "DOM", dayKey: "dom", weekday: 0, active: true, start: "10:00", end: "15:00", tag: "Medio día" },
    ],
    exceptions: [],
    recentAppointments: [],
  },
  {
    id: "emp-5",
    display_name: "David León",
    job_title: "Barbero Colaborador",
    email: "david.leon@barberia.com",
    phone: "+34 655 778 899",
    bio: "Especialista en perfilado y ritual clásico de toalla caliente.",
    avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIvLcdVvn_27Ko-1H87HPqmo2wKFOBzW4izose7sPBsiTyjqvwe7tTEgd-iYT_ty8b09W2BMzmEgsi2y_bDchsKQOENABLEK2Xl-6girsa4t7gBHCwAt9puyH1MTWJkjLuHnkdmIwG9RrYZ1xIgwgL5wtDJnaS-doLM7Wx7x-vPm6suUKdOsAWRguKFhtmvIbwCVzSEnUvKwgvYCTmpj2-aHrBim5FRHcL8y62c3EW",
    internal_id: "EMP-0092",
    access_status: "activa",
    is_active: false, // Pausado
    rating: 4.7,
    reviews_count: 41,
    services: [
      { id: "srv-5", name: "Afeitado Clásico", category: "Barba", duration: 30, price: 140 },
      { id: "srv-4", name: "Perfilado", category: "Barba", duration: 20, price: 100 },
    ],
    schedule_summary: "Sin turnos asignados",
    break_summary: "Disponibilidad desactivada",
    today_appointments: 0,
    satisfaction: 92,
    weekly_hours: 0,
    seat: "Sillón 03",
    booking_slug: "david-leon",
    google_calendar_synced: false,
    last_sync_mins: 0,
    weekly_schedule: [
      { day: "Lunes", dayShort: "LUN", dayKey: "lun", weekday: 1, active: false, start: "09:00", end: "18:00", tag: "Inactivo" },
      { day: "Martes", dayShort: "MAR", dayKey: "mar", weekday: 2, active: false, start: "09:00", end: "18:00", tag: "Inactivo" },
      { day: "Miércoles", dayShort: "MIÉ", dayKey: "mie", weekday: 3, active: false, start: "09:00", end: "18:00", tag: "Inactivo" },
      { day: "Jueves", dayShort: "JUE", dayKey: "jue", weekday: 4, active: false, start: "09:00", end: "18:00", tag: "Inactivo" },
      { day: "Viernes", dayShort: "VIE", dayKey: "vie", weekday: 5, active: false, start: "09:00", end: "18:00", tag: "Inactivo" },
      { day: "Sábado", dayShort: "SÁB", dayKey: "sab", weekday: 6, active: false, start: "09:00", end: "14:00", tag: "Inactivo" },
      { day: "Domingo", dayShort: "DOM", dayKey: "dom", weekday: 0, active: false, start: "09:00", end: "14:00", tag: "Inactivo" },
    ],
    exceptions: [],
    recentAppointments: [],
  },
];

