import { z } from "zod";

// Step 1: Personal Data Validation
export const step1Schema = z.object({
  first_name: z.string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  
  last_name: z.string()
    .trim()
    .min(1, "Los apellidos son obligatorios")
    .max(100, "Los apellidos no pueden exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Los apellidos solo pueden contener letras"),
  
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "El email no puede exceder 255 caracteres")
    .toLowerCase(),
  
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, "Formato de teléfono inválido (ej: +52 555 1234567)")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos"),
  
  city: z.string()
    .trim()
    .min(1, "La ciudad es obligatoria")
    .max(100, "La ciudad no puede exceder 100 caracteres"),
  
  country: z.string()
    .trim()
    .min(1, "El país es obligatorio")
    .max(100, "El país no puede exceder 100 caracteres"),
  
  languages: z.array(z.string())
    .min(1, "Debes seleccionar al menos un idioma")
    .max(10, "No puedes seleccionar más de 10 idiomas"),
  
  modalities: z.array(z.string())
    .min(1, "Debes seleccionar al menos una modalidad")
    .max(5, "No puedes seleccionar más de 5 modalidades"),
  
  profile_photo_url: z.string().url().optional().or(z.literal(""))
});

// Step 2: Experience Validation
export const step2Schema = z.object({
  years_experience: z.number()
    .int("Los años de experiencia deben ser un número entero")
    .min(0, "Los años de experiencia no pueden ser negativos")
    .max(70, "Los años de experiencia no pueden exceder 70"),
  
  therapeutic_approaches: z.array(z.string())
    .min(1, "Debes seleccionar al menos un enfoque terapéutico")
    .max(15, "No puedes seleccionar más de 15 enfoques"),
  
  specialties: z.array(z.string())
    .min(1, "Debes seleccionar al menos una especialidad")
    .max(20, "No puedes seleccionar más de 20 especialidades"),
  
  populations: z.array(z.string())
    .min(1, "Debes seleccionar al menos una población")
    .max(15, "No puedes seleccionar más de 15 poblaciones"),
  
  bio_short: z.string()
    .trim()
    .min(50, "La bio corta debe tener al menos 50 caracteres")
    .max(400, "La bio corta no puede exceder 400 caracteres"),
  
  bio_extended: z.string()
    .trim()
    .min(100, "La bio extendida debe tener al menos 100 caracteres")
    .max(1200, "La bio extendida no puede exceder 1200 caracteres")
});

// Step 3: Documentation Validation
export const step3Schema = z.object({
  terms_accepted: z.boolean()
    .refine((val) => val === true, "Debes aceptar los términos y condiciones"),
  
  emergency_disclaimer_accepted: z.boolean()
    .refine((val) => val === true, "Debes aceptar el aviso sobre emergencias")
});

// Step 4: Availability Validation
export const step4Schema = z.object({
  session_duration_minutes: z.number()
    .int()
    .refine((val) => [45, 50, 60].includes(val), "Duración de sesión inválida"),
  
  minimum_notice_hours: z.number()
    .int()
    .refine((val) => [2, 12, 24].includes(val), "Tiempo de anticipación inválido"),
  
  reschedule_window_hours: z.number()
    .int()
    .refine((val) => [12, 24, 48].includes(val), "Ventana de reprogramación inválida"),
  
  availability: z.array(z.object({
    day_of_week: z.number().int().min(0).max(6).optional(),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
    is_exception: z.boolean().optional(),
    exception_date: z.string().optional()
  }))
  .min(1, "Debes agregar al menos un bloque de disponibilidad")
});

// Step 5: Pricing Validation
export const step5Schema = z.object({
  session_price: z.number()
    .positive("El precio de sesión debe ser mayor a 0")
    .max(99999, "El precio no puede exceder 99,999"),
  
  currency: z.string()
    .min(3, "Moneda inválida")
    .max(3, "Moneda inválida"),
  
  package_4_price: z.number()
    .positive("El precio del paquete debe ser mayor a 0")
    .max(99999, "El precio no puede exceder 99,999")
    .optional(),
  
  package_8_price: z.number()
    .positive("El precio del paquete debe ser mayor a 0")
    .max(99999, "El precio no puede exceder 99,999")
    .optional(),
  
  first_session_price: z.number()
    .positive("El precio debe ser mayor a 0")
    .max(99999, "El precio no puede exceder 99,999")
    .optional(),
  
  cancellation_policy: z.string()
    .trim()
    .max(500, "La política no puede exceder 500 caracteres")
    .optional(),
  
  refund_policy: z.string()
    .trim()
    .max(500, "La política no puede exceder 500 caracteres")
    .optional(),
  
  late_tolerance_minutes: z.number()
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .max(30, "No puede exceder 30 minutos")
});

// File validation helper
export const validateFile = (file: File, maxSizeMB: number = 10): string | null => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (!allowedTypes.includes(file.type)) {
    return "Tipo de archivo no permitido. Solo se aceptan JPG, PNG y PDF.";
  }
  
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return `El archivo no puede exceder ${maxSizeMB}MB.`;
  }
  
  return null;
};

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[@$!%*?&#]/, 'Debe contener al menos un carácter especial (@$!%*?&#)');

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "La contraseña es obligatoria")
});

export const signupSchema = z.object({
  email: z.string().trim().email("Email inválido").toLowerCase(),
  password: passwordSchema,
  name: z.string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras")
});

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "El email no puede exceder 255 caracteres")
    .toLowerCase(),
  
  reason: z.string()
    .min(1, "Debes seleccionar un motivo"),
  
  message: z.string()
    .trim()
    .min(1, "El mensaje es obligatorio")
    .max(2000, "El mensaje no puede exceder 2000 caracteres")
});

// Validate password strength
export const validatePassword = (password: string): string | null => {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return null;
};

// Sanitize text to prevent XSS
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};
