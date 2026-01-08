import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  TrendingUp,
  ArrowLeft,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { translateErrorMessage } from '../utils/errorMessages'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { register } = useAuth()
  const navigate = useNavigate()

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await register(email, password, firstName, lastName)
      setSuccess('¡Cuenta creada exitosamente!')
      setTimeout(() => navigate('/app/dashboard'), 500)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear la cuenta'
      setError(translateErrorMessage(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    'Gestión completa de gastos e ingresos',
    'Presupuestos semanales personalizados',
    'Reportes y análisis detallados',
    'Recordatorios de pagos automáticos',
    'Simulador financiero avanzado',
    'Soporte 24/7',
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-primary-600 to-primary-800">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative h-full flex flex-col justify-center px-12 xl:px-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Logo */}
            <Link to="/" className="inline-block mb-8">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-10 h-10" />
                <span className="text-3xl font-bold">UniFinanzas</span>
              </div>
            </Link>

            {/* Tagline */}
            <h2 className="text-4xl font-bold mb-4">
              Comienza tu viaje financiero
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Únete a miles de usuarios que ya controlan sus finanzas de manera
              inteligente.
            </p>

            {/* Benefits list */}
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80 mb-4">
                ¿Qué obtienes al registrarte?
              </p>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-white/90">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold">100%</div>
                <div className="text-white/80 text-sm">Gratis</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-white/80 text-sm">Soporte</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100%</div>
                <div className="text-white/80 text-sm">Seguro</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Crea tu cuenta
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Comienza a gestionar tus finanzas de forma inteligente
              </p>
            </div>

            {/* Flash Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 rounded-xl shadow-lg mt-8"
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-700" />
                    </div>
                    <span className="font-medium flex-1">{error}</span>
                  </div>
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-1 bg-red-500"
                  />
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl shadow-lg mt-8"
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    </div>
                    <span className="font-medium flex-1">{success}</span>
                  </div>
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-1 bg-emerald-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input pl-10"
                      placeholder="Juan"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Apellido
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full text-base py-3 mt-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-2" />
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear cuenta gratis'
                )}
              </motion.button>

              {/* Login link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </div>

              {/* Terms */}
              <p className="text-xs text-center text-gray-500 mt-4">
                Al crear una cuenta, aceptas nuestros términos de servicio y
                política de privacidad
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
