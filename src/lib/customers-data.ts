export interface CustomerAppointment {
  id: string;
  month: string;
  day: string;
  title: string;
  status: "upcoming" | "completed" | "cancelled";
  statusLabel: string;
  isUpcoming?: boolean;
  isFirst?: boolean;
  dateText: string;
  duration: string;
  professional: string;
  price: string;
  paymentMethod: string;
}

export interface CustomerInternalNote {
  id: string;
  author: string;
  date: string;
  text: string;
  alert?: boolean;
}

export interface CustomerDetail {
  id: string;
  code: string;
  full_name: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  subtitle: string;
  phone: string;
  email: string | null;
  appointmentsCount: number;
  statusTag: "Recurrente" | "VIP" | "Nuevo";
  isVip?: boolean;
  lastAppointment: {
    date: string;
    service: string;
    professional: string;
  };
  registeredAt: string;
  totalSpent: number;
  avgTicket: number;
  completedAppointments: number;
  totalScheduled: number;
  punctuality: string;
  preferredProfessional: string;
  preferredProfessionalPct: string;
  favoriteService: string;
  favoriteServiceTime: string;
  notes: CustomerInternalNote[];
  appointments: CustomerAppointment[];
}

export const INITIAL_CUSTOMERS: CustomerDetail[] = [
  {
    id: "cli-1",
    code: "CLI-8942",
    full_name: "David Soria Gómez",
    avatar: "DS",
    avatarBg: "bg-[#dee1ff]",
    avatarColor: "text-[#2c4dd6]",
    subtitle: "Cliente habitual",
    phone: "+52 55 4321 8765",
    email: "david.soria@ejemplo.com",
    appointmentsCount: 6,
    statusTag: "Recurrente",
    lastAppointment: {
      date: "Hoy, 11:45 hrs",
      service: "Corte Premium",
      professional: "Carlos Ramírez",
    },
    registeredAt: "12 Jul 2024",
    totalSpent: 1280,
    avgTicket: 256,
    completedAppointments: 5,
    totalScheduled: 6,
    punctuality: "100%",
    preferredProfessional: "Carlos Ramírez",
    preferredProfessionalPct: "80% de sus visitas",
    favoriteService: "Corte Premium",
    favoriteServiceTime: "Tiempo estimado: 60 min",
    notes: [
      {
        id: "note-1",
        author: "Carlos Ramírez",
        date: "28 Sep 2025",
        text: "Prefiere degradado medio afeitado con navaja y toalla tibia aromática. Muy puntual, suele pedir café americano.",
      },
      {
        id: "note-2",
        author: "Recepción",
        date: "15 Ago 2025",
        text: "Alergia leve a lociones con alcohol fuerte, usar bálsamo orgánico de aloe.",
        alert: true,
      },
    ],
    appointments: [
      {
        id: "apt-1",
        month: "OCT",
        day: "25",
        title: "Corte Premium",
        status: "upcoming",
        statusLabel: "Confirmada",
        isUpcoming: true,
        dateText: "Miércoles 25 Oct 2025, 11:45 hrs",
        duration: "60 min",
        professional: "Carlos Ramírez",
        price: "$350 MXN",
        paymentMethod: "Pago en local",
      },
      {
        id: "apt-2",
        month: "SEP",
        day: "28",
        title: "Corte Clásico + Barba",
        status: "completed",
        statusLabel: "Completada",
        dateText: "28 Sep 2025, 16:30 hrs",
        duration: "45 min",
        professional: "Carlos Ramírez",
        price: "$280 MXN",
        paymentMethod: "Pagado en terminal",
      },
      {
        id: "apt-3",
        month: "AGO",
        day: "15",
        title: "Corte Premium",
        status: "completed",
        statusLabel: "Completada",
        dateText: "15 Ago 2025, 12:00 hrs",
        duration: "60 min",
        professional: "Carlos Ramírez",
        price: "$350 MXN",
        paymentMethod: "Efectivo",
      },
      {
        id: "apt-4",
        month: "JUL",
        day: "20",
        title: "Arreglo de Barba",
        status: "completed",
        statusLabel: "Completada",
        dateText: "20 Jul 2025, 10:30 hrs",
        duration: "20 min",
        professional: "Mateo Ramos",
        price: "$120 MXN",
        paymentMethod: "Pago online",
      },
      {
        id: "apt-5",
        month: "JUL",
        day: "12",
        title: "Corte Clásico",
        status: "completed",
        statusLabel: "Completada",
        isFirst: true,
        dateText: "12 Jul 2024, 17:00 hrs",
        duration: "30 min",
        professional: "Carlos Ramírez",
        price: "$180 MXN",
        paymentMethod: "Efectivo",
      },
    ],
  },
  {
    id: "cli-2",
    code: "CLI-5412",
    full_name: "Alejandro Peña",
    avatar: "AP",
    avatarBg: "bg-[#dce2f7]",
    avatarColor: "text-[#575e70]",
    subtitle: "Cliente de barbería",
    phone: "+52 55 6129 8411",
    email: "alejandro.p@email.com",
    appointmentsCount: 4,
    statusTag: "Recurrente",
    lastAppointment: {
      date: "Ayer, 18:00 hrs",
      service: "Pack Corte + Barba",
      professional: "Mateo Ramos",
    },
    registeredAt: "03 Ago 2024",
    totalSpent: 960,
    avgTicket: 240,
    completedAppointments: 4,
    totalScheduled: 4,
    punctuality: "100%",
    preferredProfessional: "Mateo Ramos",
    preferredProfessionalPct: "75% de sus visitas",
    favoriteService: "Pack Corte + Barba",
    favoriteServiceTime: "Tiempo estimado: 50 min",
    notes: [
      {
        id: "note-2-1",
        author: "Mateo Ramos",
        date: "03 Ago 2024",
        text: "Le gusta que la barba quede bien definida con máquina taper en el cuello.",
      },
    ],
    appointments: [
      {
        id: "apt-2-1",
        month: "OCT",
        day: "24",
        title: "Pack Corte + Barba",
        status: "completed",
        statusLabel: "Completada",
        dateText: "Ayer, 18:00 hrs",
        duration: "50 min",
        professional: "Mateo Ramos",
        price: "$290 MXN",
        paymentMethod: "Terminal bancaria",
      },
      {
        id: "apt-2-2",
        month: "SEP",
        day: "10",
        title: "Corte Clásico",
        status: "completed",
        statusLabel: "Completada",
        dateText: "10 Sep 2025, 17:00 hrs",
        duration: "30 min",
        professional: "Mateo Ramos",
        price: "$190 MXN",
        paymentMethod: "Efectivo",
      },
    ],
  },
  {
    id: "cli-3",
    code: "CLI-1029",
    full_name: "Jorge Lozano",
    avatar: "JL",
    avatarBg: "bg-[#d8e2ff]",
    avatarColor: "text-[#0058be]",
    subtitle: "Cliente exclusivo",
    phone: "+52 55 9876 5432",
    email: "jorge.lozano@outlook.com",
    appointmentsCount: 8,
    statusTag: "VIP",
    isVip: true,
    lastAppointment: {
      date: "20 Oct 2025",
      service: "Corte Clásico",
      professional: "Carlos Ramírez",
    },
    registeredAt: "15 Ene 2024",
    totalSpent: 2400,
    avgTicket: 300,
    completedAppointments: 8,
    totalScheduled: 8,
    punctuality: "100%",
    preferredProfessional: "Carlos Ramírez",
    preferredProfessionalPct: "90% de sus visitas",
    favoriteService: "Corte Premium",
    favoriteServiceTime: "Tiempo estimado: 60 min",
    notes: [
      {
        id: "note-3-1",
        author: "María Ramos",
        date: "15 Ene 2024",
        text: "Socio fundador club de ejecutivos. Reservar siempre sillón 1.",
      },
    ],
    appointments: [
      {
        id: "apt-3-1",
        month: "OCT",
        day: "20",
        title: "Corte Clásico",
        status: "completed",
        statusLabel: "Completada",
        dateText: "20 Oct 2025, 19:00 hrs",
        duration: "35 min",
        professional: "Carlos Ramírez",
        price: "$250 MXN",
        paymentMethod: "Tarjeta de crédito",
      },
    ],
  },
  {
    id: "cli-4",
    code: "CLI-4402",
    full_name: "Roberto Méndez",
    avatar: "RM",
    avatarBg: "bg-surface-container-high",
    avatarColor: "text-on-surface-variant",
    subtitle: "Citas quincenales",
    phone: "+52 55 3344 5566",
    email: "roberto.m@gmail.com",
    appointmentsCount: 2,
    statusTag: "Recurrente",
    lastAppointment: {
      date: "18 Oct 2025",
      service: "Afeitado Clásico",
      professional: "Mateo Ramos",
    },
    registeredAt: "28 Sep 2025",
    totalSpent: 420,
    avgTicket: 210,
    completedAppointments: 2,
    totalScheduled: 2,
    punctuality: "100%",
    preferredProfessional: "Mateo Ramos",
    preferredProfessionalPct: "100% de sus visitas",
    favoriteService: "Afeitado Clásico",
    favoriteServiceTime: "Tiempo estimado: 30 min",
    notes: [],
    appointments: [
      {
        id: "apt-4-1",
        month: "OCT",
        day: "18",
        title: "Afeitado Clásico",
        status: "completed",
        statusLabel: "Completada",
        dateText: "18 Oct 2025, 16:00 hrs",
        duration: "30 min",
        professional: "Mateo Ramos",
        price: "$210 MXN",
        paymentMethod: "Efectivo",
      },
    ],
  },
  {
    id: "cli-5",
    code: "CLI-6781",
    full_name: "Gonzalo Rivas",
    avatar: "GR",
    avatarBg: "bg-[#d9dff5]",
    avatarColor: "text-[#5c6274]",
    subtitle: "Reserva online directa",
    phone: "+52 55 7788 9900",
    email: null,
    appointmentsCount: 1,
    statusTag: "Nuevo",
    lastAppointment: {
      date: "14 Oct 2025",
      service: "Arreglo Barba",
      professional: "Mateo Ramos",
    },
    registeredAt: "14 Oct 2025",
    totalSpent: 160,
    avgTicket: 160,
    completedAppointments: 1,
    totalScheduled: 1,
    punctuality: "100%",
    preferredProfessional: "Mateo Ramos",
    preferredProfessionalPct: "100% de sus visitas",
    favoriteService: "Arreglo Barba",
    favoriteServiceTime: "Tiempo estimado: 25 min",
    notes: [],
    appointments: [
      {
        id: "apt-5-1",
        month: "OCT",
        day: "14",
        title: "Arreglo Barba",
        status: "completed",
        statusLabel: "Completada",
        isFirst: true,
        dateText: "14 Oct 2025, 11:00 hrs",
        duration: "25 min",
        professional: "Mateo Ramos",
        price: "$160 MXN",
        paymentMethod: "Pago online",
      },
    ],
  },
  {
    id: "cli-6",
    code: "CLI-7105",
    full_name: "Lucas Valera",
    avatar: "LV",
    avatarBg: "bg-surface-container-high",
    avatarColor: "text-on-surface-variant",
    subtitle: "Primera cita",
    phone: "+52 55 1122 3344",
    email: "lucas.v@empresa.mx",
    appointmentsCount: 1,
    statusTag: "Nuevo",
    lastAppointment: {
      date: "10 Oct 2025",
      service: "Perfilado Barba",
      professional: "Carlos Ramírez",
    },
    registeredAt: "10 Oct 2025",
    totalSpent: 140,
    avgTicket: 140,
    completedAppointments: 1,
    totalScheduled: 1,
    punctuality: "100%",
    preferredProfessional: "Carlos Ramírez",
    preferredProfessionalPct: "100% de sus visitas",
    favoriteService: "Perfilado Barba",
    favoriteServiceTime: "Tiempo estimado: 20 min",
    notes: [],
    appointments: [
      {
        id: "apt-6-1",
        month: "OCT",
        day: "10",
        title: "Perfilado Barba",
        status: "completed",
        statusLabel: "Completada",
        isFirst: true,
        dateText: "10 Oct 2025, 15:30 hrs",
        duration: "20 min",
        professional: "Carlos Ramírez",
        price: "$140 MXN",
        paymentMethod: "Terminal bancaria",
      },
    ],
  },
];

export function getCustomerById(id: string): CustomerDetail {
  const cleanId = id.toLowerCase().trim();
  const found = INITIAL_CUSTOMERS.find(
    (c) => c.id.toLowerCase() === cleanId || c.code.toLowerCase() === cleanId
  );

  if (found) return found;

  // Synthesize realistic details for newly created or unknown customer ID
  return {
    id,
    code: `CLI-${id.slice(0, 4).toUpperCase()}`,
    full_name: "Cliente Registrado",
    avatar: "CR",
    avatarBg: "bg-[#dee1ff]",
    avatarColor: "text-[#2c4dd6]",
    subtitle: "Cliente del negocio",
    phone: "+52 55 0000 0000",
    email: "cliente@skedly.app",
    appointmentsCount: 1,
    statusTag: "Nuevo",
    lastAppointment: {
      date: "Reciente",
      service: "Corte General",
      professional: "Carlos Ramírez",
    },
    registeredAt: "Reciente",
    totalSpent: 250,
    avgTicket: 250,
    completedAppointments: 1,
    totalScheduled: 1,
    punctuality: "100%",
    preferredProfessional: "Carlos Ramírez",
    preferredProfessionalPct: "100%",
    favoriteService: "Servicio estándar",
    favoriteServiceTime: "Tiempo estimado: 45 min",
    notes: [],
    appointments: [
      {
        id: `apt-${id}`,
        month: "NOV",
        day: "01",
        title: "Cita inicial",
        status: "completed",
        statusLabel: "Completada",
        isFirst: true,
        dateText: "Reciente",
        duration: "45 min",
        professional: "Carlos Ramírez",
        price: "$250 MXN",
        paymentMethod: "Pago en local",
      },
    ],
  };
}

