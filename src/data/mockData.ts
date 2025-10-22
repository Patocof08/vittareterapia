// Mock data para desarrollo - Reemplazar con datos reales

export const mockTherapists = [
  {
    id: "1",
    name: "Dra. Ana García López",
    specialty: "Psicología Clínica",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 127,
    price: 800,
    approaches: ["TCC", "ACT", "Mindfulness"],
    languages: ["Español", "Inglés"],
    availability: "Disponible hoy",
    cedula: "12345678",
    yearsExperience: 12,
    bio: "Especialista en ansiedad y depresión con más de 12 años de experiencia. Me enfoco en brindar un espacio seguro donde puedas explorar tus emociones y desarrollar herramientas para enfrentar los desafíos de la vida.",
    education: [
      "Doctorado en Psicología Clínica - UNAM",
      "Maestría en Terapia Cognitivo Conductual - UAM",
    ],
  },
  {
    id: "2",
    name: "Mtro. Carlos Hernández",
    specialty: "Terapia de Pareja",
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 98,
    price: 900,
    approaches: ["Sistémica", "Gottman", "EFT"],
    languages: ["Español"],
    availability: "Próxima semana",
    cedula: "87654321",
    yearsExperience: 10,
    bio: "Terapeuta especializado en relaciones de pareja y conflictos familiares. Mi enfoque se centra en mejorar la comunicación y fortalecer los vínculos emocionales.",
    education: [
      "Maestría en Terapia Familiar - ITESO",
      "Certificación Gottman Method Couples Therapy",
    ],
  },
  {
    id: "3",
    name: "Lic. María Rodríguez",
    specialty: "Psicología Infantil",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    rating: 5.0,
    reviews: 156,
    price: 750,
    approaches: ["Juego terapéutico", "TCC", "Narrativa"],
    languages: ["Español", "Catalán"],
    availability: "Disponible mañana",
    cedula: "11223344",
    yearsExperience: 8,
    bio: "Especialista en desarrollo infantil y adolescente. Trabajo con niños y familias para superar dificultades emocionales, conductuales y de aprendizaje.",
    education: [
      "Licenciatura en Psicología - UNAM",
      "Especialidad en Psicología Infantil - Hospital Infantil de México",
    ],
  },
];

export const mockReviews = [
  {
    name: "Laura Martínez",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    rating: 5,
    text: "Excelente profesional. Me ha ayudado enormemente a manejar mi ansiedad. Su enfoque es muy práctico y siempre me siento escuchada.",
    date: "Hace 2 semanas",
  },
  {
    name: "Roberto Sánchez",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    rating: 5,
    text: "La terapia en línea con Vittare ha sido transformadora. Es cómodo, privado y los terapeutas son muy profesionales.",
    date: "Hace 1 mes",
  },
  {
    name: "Carmen Flores",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    rating: 4,
    text: "Muy buena experiencia. El proceso de agenda es simple y las sesiones son de calidad. Recomendado 100%.",
    date: "Hace 3 semanas",
  },
];

export const mockBlogPosts = [
  {
    id: "1",
    title: "5 técnicas de mindfulness para reducir el estrés diario",
    excerpt: "Descubre cómo la atención plena puede transformar tu día a día y reducir significativamente tus niveles de estrés.",
    date: "15 de marzo, 2024",
    author: "Dra. Ana García",
    tags: ["Mindfulness", "Estrés", "Bienestar"],
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Cómo identificar y manejar la ansiedad",
    excerpt: "Aprende a reconocer los síntomas de la ansiedad y descubre estrategias efectivas para manejarla en tu vida cotidiana.",
    date: "10 de marzo, 2024",
    author: "Mtro. Carlos Hernández",
    tags: ["Ansiedad", "Salud Mental", "Autoayuda"],
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=400&fit=crop",
  },
  {
    id: "3",
    title: "La importancia de la comunicación en las relaciones",
    excerpt: "Explora cómo mejorar la comunicación con tu pareja puede fortalecer tu relación y prevenir conflictos.",
    date: "5 de marzo, 2024",
    author: "Lic. María Rodríguez",
    tags: ["Relaciones", "Comunicación", "Pareja"],
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop",
  },
];

export const mockFAQs = [
  {
    question: "¿Cómo funciona la terapia en línea?",
    answer: "La terapia en línea funciona igual que la terapia presencial, pero a través de videollamada. Agendas tu sesión, te conectas desde la comodidad de tu hogar y hablas con tu terapeuta en tiempo real. Es seguro, privado y efectivo.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias bancarias y pagos a través de PayPal. Todos los pagos son procesados de forma segura.",
  },
  {
    question: "¿Puedo cambiar de terapeuta?",
    answer: "Sí, puedes cambiar de terapeuta en cualquier momento sin costo adicional. Sabemos que encontrar la conexión adecuada es importante para el éxito de la terapia.",
  },
  {
    question: "¿Qué pasa si necesito cancelar una sesión?",
    answer: "Puedes cancelar o reprogramar tu sesión con al menos 24 horas de anticipación sin cargo. Cancelaciones con menos de 24 horas se cobrarán el 50% del valor de la sesión.",
  },
  {
    question: "¿Es confidencial la terapia en línea?",
    answer: "Absolutamente. Todas las sesiones están protegidas por el secreto profesional y utilizamos plataformas seguras con cifrado de extremo a extremo. Tu privacidad es nuestra prioridad.",
  },
  {
    question: "¿Emiten facturas?",
    answer: "Sí, emitimos facturas fiscales (CFDI) para todos los servicios. Puedes solicitarla al momento del pago o después a través de tu cuenta.",
  },
  {
    question: "¿Qué hago en caso de emergencia?",
    answer: "Si estás experimentando una emergencia de salud mental, por favor contacta a los servicios de emergencia locales o llama a la Línea de la Vida: 800 911 2000. La terapia en línea no está diseñada para situaciones de crisis inmediatas.",
  },
];

// Mock data para tareas de clientes
export const mockClientTasks = [
  {
    id: "1",
    title: "Registro de emociones diario",
    description: "Llenar el diario de emociones cada noche antes de dormir durante 7 días",
    therapistName: "Dra. Ana García López",
    therapistId: "1",
    dueDate: "2024-03-25",
    status: "pendiente" as const,
    completed: false,
    completedDate: null,
  },
  {
    id: "2",
    title: "Ejercicio de respiración consciente",
    description: "Practicar 10 minutos de respiración consciente por la mañana",
    therapistName: "Dra. Ana García López",
    therapistId: "1",
    dueDate: "2024-03-22",
    status: "completada" as const,
    completed: true,
    completedDate: "2024-03-21",
  },
  {
    id: "3",
    title: "Actividad física",
    description: "Realizar 30 minutos de caminata al aire libre 3 veces por semana",
    therapistName: "Dra. Ana García López",
    therapistId: "1",
    dueDate: "2024-03-28",
    status: "pendiente" as const,
    completed: false,
    completedDate: null,
  },
];

// Mock data para terapeutas del cliente (con quienes ya tiene sesiones)
export const mockClientTherapists = [
  {
    id: "1",
    name: "Dra. Ana García López",
    specialty: "Psicología Clínica",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    nextSession: "2024-03-22 15:00",
    totalSessions: 8,
  },
];
