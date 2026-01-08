// Traducción de mensajes de error del backend al español
export const translateErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    // Auth errors
    'Invalid email or password': 'Correo electrónico o contraseña incorrectos',
    'Invalid credentials': 'Credenciales incorrectas',
    'User not found': 'Usuario no encontrado',
    'User already exists': 'El usuario ya existe',
    'Email already registered': 'El correo electrónico ya está registrado',
    'Email already exists': 'El correo electrónico ya está registrado',
    'Invalid email': 'Correo electrónico inválido',
    'Invalid password': 'Contraseña inválida',
    'Password too short': 'La contraseña es demasiado corta',
    'Password must be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres',
    'Unauthorized': 'No autorizado',
    'Token expired': 'La sesión ha expirado',
    'Invalid token': 'Token inválido',

    // Network errors
    'Network Error': 'Error de conexión. Verifica tu conexión a internet',
    'Request failed': 'La solicitud falló. Intenta nuevamente',
    'timeout': 'Tiempo de espera agotado. Intenta nuevamente',

    // Server errors
    'Internal server error': 'Error interno del servidor',
    'Server error': 'Error del servidor',
    'Service unavailable': 'Servicio no disponible',
    'Bad request': 'Solicitud inválida',
  }

  // Buscar coincidencia exacta
  if (errorMap[error]) {
    return errorMap[error]
  }

  // Buscar coincidencia parcial (case-insensitive)
  const lowerError = error.toLowerCase()
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerError.includes(key.toLowerCase())) {
      return value
    }
  }

  // Si no hay traducción, devolver el error original
  return error
}
