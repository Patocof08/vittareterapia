const isDevelopment = import.meta.env.DEV;

export const logger = {
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(message, error);
    }
    // In production, errors are silently logged to prevent information disclosure
    // Consider integrating a monitoring service like Sentry for production error tracking
  },
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(message, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(message, data);
    }
  }
};

// Map database errors to user-friendly messages
export const handleDatabaseError = (error: any, operation: string): string => {
  logger.error(`Database error during ${operation}:`, error);

  // PostgreSQL error codes
  if (error.code === '23505') {
    return "Este registro ya existe.";
  } else if (error.code === '23503') {
    return "No se puede completar la operación debido a una referencia inválida.";
  } else if (error.code === '23514') {
    return "Los datos ingresados no cumplen con los requisitos de validación.";
  } else if (error.code === 'PGRST116') {
    return "No tienes permisos para realizar esta acción.";
  }

  // Supabase auth errors
  if (error.message?.includes('refresh_token_not_found')) {
    return "Tu sesión ha expirado. Por favor inicia sesión nuevamente.";
  }

  // Default generic message
  return "Ocurrió un error. Por favor intenta de nuevo o contacta soporte si el problema persiste.";
};
