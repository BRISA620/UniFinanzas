import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, Shield, ArrowLeft, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { translateErrorMessage } from '../utils/errorMessages'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { login } = useAuth()
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
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await login(email, password)
      setSuccess('¡Bienvenido!')
      setTimeout(() => navigate('/app/dashboard'), 500)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al iniciar sesión'
      setError(translateErrorMessage(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
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
                Bienvenido de nuevo
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Ingresa a tu cuenta para continuar gestionando tus finanzas
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
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
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
                      name="email"
                      type="email"
                      autoComplete="email"
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
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full text-base py-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-2" />
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </motion.button>

              {/* Register link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Regístrate gratis
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-primary-600 to-primary-800">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative h-full flex flex-col justify-center px-12 xl:px-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
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
              Control total de tus finanzas
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Gestiona tus gastos, presupuestos y alcanza tus metas financieras
              con la plataforma más completa.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <p className="font-semibold">Dashboard en tiempo real</p>
                  <p className="text-white/80 text-sm">
                    Visualiza tus finanzas al instante
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <p className="font-semibold">Alertas inteligentes</p>
                  <p className="text-white/80 text-sm">
                    Nunca excedas tu presupuesto
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <p className="font-semibold">100% Seguro</p>
                  <p className="text-white/80 text-sm">
                    Encriptación de nivel bancario
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative card */}
            <motion.div
              className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80 text-sm">Balance actual</span>
                <Shield className="w-5 h-5 text-white/60" />
              </div>
              <div className="text-3xl font-bold mb-2">$12,450.00</div>
              <div className="flex items-center text-sm">
                <span className="text-green-300">+12.5%</span>
                <span className="text-white/60 ml-2">vs mes anterior</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
