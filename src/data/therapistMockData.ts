// Mock data para el panel de terapeutas

export interface TherapistSession {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
  videoLink?: string;
  notes: string;
  duration: number; // minutos
}

export interface TherapistPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  lastSession?: string;
  status: 'activo' | 'inactivo';
  tags: string[];
  sessionCount: number;
}

export interface TherapistMessage {
  id: string;
  patientId: string;
  patientName: string;
  text: string;
  timestamp: string;
  read: boolean;
  sender: 'therapist' | 'patient';
  attachment?: {
    name: string;
    url: string;
  };
}

export interface TherapistPayment {
  id: string;
  sessionId: string;
  patientName: string;
  amount: number;
  status: 'pagado' | 'pendiente';
  date: string;
  receiptUrl?: string;
}

export interface TherapistTask {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  viewed: boolean;
}

export interface TherapistDocument {
  id: string;
  type: 'kyc' | 'cedula' | 'titulo' | 'contrato';
  name: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  uploadDate: string;
  url: string;
}

export interface Availability {
  dayOfWeek: number; // 0-6 (domingo-sábado)
  blocks: { start: string; end: string }[];
}

// Mock data
export const mockTherapistData = {
  id: "t1",
  name: "Dra. Ana García López",
  email: "ana.garcia@vittare.com",
  phone: "+52 55 1234 5678",
  cedula: "12345678",
  specialty: "Psicología Clínica",
  approaches: ["TCC", "ACT", "Mindfulness"],
  languages: ["Español", "Inglés"],
  price: 800,
  bio: "Especialista en ansiedad y depresión con más de 12 años de experiencia.",
  photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
  yearsExperience: 12,
  bankAccount: "•••• •••• •••• 4532",
};

export const mockSessions: TherapistSession[] = [
  {
    id: "s1",
    patientId: "p1",
    patientName: "Laura Martínez",
    date: "2024-03-20",
    time: "10:00",
    status: "confirmada",
    videoLink: "https://meet.vittare.com/session-abc123",
    notes: "Revisión de técnicas de respiración para ansiedad.",
    duration: 50,
  },
  {
    id: "s2",
    patientId: "p2",
    patientName: "Roberto Sánchez",
    date: "2024-03-20",
    time: "15:00",
    status: "confirmada",
    videoLink: "https://meet.vittare.com/session-def456",
    notes: "",
    duration: 50,
  },
  {
    id: "s3",
    patientId: "p3",
    patientName: "Carmen Flores",
    date: "2024-03-21",
    time: "11:00",
    status: "pendiente",
    notes: "",
    duration: 50,
  },
  {
    id: "s4",
    patientId: "p1",
    patientName: "Laura Martínez",
    date: "2024-03-18",
    time: "10:00",
    status: "completada",
    notes: "Progreso significativo en manejo de crisis de pánico.",
    duration: 50,
  },
];

export const mockPatients: TherapistPatient[] = [
  {
    id: "p1",
    name: "Laura Martínez",
    email: "laura.m***@gmail.com",
    phone: "+52 55 ••• •••• 01",
    plan: "Paquete 8 sesiones",
    lastSession: "2024-03-18",
    status: "activo",
    tags: ["Ansiedad", "Crisis de pánico"],
    sessionCount: 6,
  },
  {
    id: "p2",
    name: "Roberto Sánchez",
    email: "roberto.s***@hotmail.com",
    phone: "+52 55 ••• •••• 02",
    plan: "Sesión individual",
    lastSession: "2024-03-15",
    status: "activo",
    tags: ["Depresión", "Autoestima"],
    sessionCount: 3,
  },
  {
    id: "p3",
    name: "Carmen Flores",
    email: "carmen.f***@yahoo.com",
    phone: "+52 55 ••• •••• 03",
    plan: "Paquete 4 sesiones",
    lastSession: "2024-03-10",
    status: "activo",
    tags: ["Duelo", "Relaciones"],
    sessionCount: 2,
  },
];

export const mockMessages: TherapistMessage[] = [
  {
    id: "m1",
    patientId: "p1",
    patientName: "Laura Martínez",
    text: "Buenos días doctora, ¿podríamos reprogramar la sesión del viernes?",
    timestamp: "2024-03-19T09:30:00",
    read: false,
    sender: "patient",
  },
  {
    id: "m2",
    patientId: "p2",
    patientName: "Roberto Sánchez",
    text: "Muchas gracias por la sesión de hoy, me ayudó mucho.",
    timestamp: "2024-03-15T16:20:00",
    read: true,
    sender: "patient",
  },
  {
    id: "m3",
    patientId: "p2",
    patientName: "Roberto Sánchez",
    text: "Me alegra mucho escucharlo Roberto. Sigue practicando los ejercicios que vimos.",
    timestamp: "2024-03-15T17:00:00",
    read: true,
    sender: "therapist",
  },
];

export const mockPayments: TherapistPayment[] = [
  {
    id: "pay1",
    sessionId: "s4",
    patientName: "Laura Martínez",
    amount: 800,
    status: "pagado",
    date: "2024-03-18",
    receiptUrl: "/receipts/pay1.pdf",
  },
  {
    id: "pay2",
    sessionId: "s1",
    patientName: "Laura Martínez",
    amount: 800,
    status: "pendiente",
    date: "2024-03-20",
  },
  {
    id: "pay3",
    sessionId: "s2",
    patientName: "Roberto Sánchez",
    amount: 800,
    status: "pagado",
    date: "2024-03-15",
    receiptUrl: "/receipts/pay3.pdf",
  },
];

export const mockTasks: TherapistTask[] = [
  {
    id: "t1",
    patientId: "p1",
    patientName: "Laura Martínez",
    title: "Ejercicio de respiración diafragmática",
    description: "Practicar 5 minutos al día, registrar en diario de ansiedad.",
    dueDate: "2024-03-25",
    completed: false,
    viewed: true,
  },
  {
    id: "t2",
    patientId: "p2",
    patientName: "Roberto Sánchez",
    title: "Registro de pensamientos automáticos",
    description: "Identificar y anotar 3 pensamientos negativos al día usando el formato ABC.",
    dueDate: "2024-03-22",
    completed: true,
    viewed: true,
  },
];

export const mockDocuments: TherapistDocument[] = [
  {
    id: "d1",
    type: "cedula",
    name: "Cédula Profesional",
    status: "aprobado",
    uploadDate: "2024-01-15",
    url: "/documents/cedula.pdf",
  },
  {
    id: "d2",
    type: "titulo",
    name: "Título Universitario",
    status: "aprobado",
    uploadDate: "2024-01-15",
    url: "/documents/titulo.pdf",
  },
  {
    id: "d3",
    type: "kyc",
    name: "Identificación Oficial",
    status: "pendiente",
    uploadDate: "2024-03-10",
    url: "/documents/kyc.pdf",
  },
];

export const mockAvailability: Availability[] = [
  {
    dayOfWeek: 1, // Lunes
    blocks: [
      { start: "09:00", end: "13:00" },
      { start: "15:00", end: "19:00" },
    ],
  },
  {
    dayOfWeek: 2, // Martes
    blocks: [
      { start: "09:00", end: "13:00" },
      { start: "15:00", end: "19:00" },
    ],
  },
  {
    dayOfWeek: 3, // Miércoles
    blocks: [{ start: "10:00", end: "14:00" }],
  },
  {
    dayOfWeek: 4, // Jueves
    blocks: [
      { start: "09:00", end: "13:00" },
      { start: "15:00", end: "19:00" },
    ],
  },
  {
    dayOfWeek: 5, // Viernes
    blocks: [{ start: "09:00", end: "13:00" }],
  },
];

export const mockLibraryMaterials = [
  {
    id: "lib1",
    title: "Guía de Técnicas de Respiración",
    type: "pdf",
    sharedWith: ["p1", "p2"],
    uploadDate: "2024-02-15",
    url: "/library/respiracion.pdf",
  },
  {
    id: "lib2",
    title: "Plantilla Diario de Emociones",
    type: "pdf",
    sharedWith: ["p1"],
    uploadDate: "2024-02-20",
    url: "/library/diario-emociones.pdf",
  },
  {
    id: "lib3",
    title: "Ejercicios de Mindfulness",
    type: "pdf",
    sharedWith: [],
    uploadDate: "2024-03-01",
    url: "/library/mindfulness.pdf",
  },
];

// Estadísticas del dashboard
export const mockDashboardStats = {
  sessionsThisWeek: 12,
  attendanceRate: 94,
  estimatedMonthlyIncome: 9600,
  unreadMessages: 2,
  pendingTasks: 3,
};
