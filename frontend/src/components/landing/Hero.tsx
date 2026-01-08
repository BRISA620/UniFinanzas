import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrendingUp, Shield, Zap, DollarSign, PieChart, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

        {/* Geometric patterns */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-white/10 rounded-full" />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 border border-white/10 rounded-lg rotate-45" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
              <span className="text-sm font-medium">Plataforma #1 para estudiantes</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Controla tus{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                  Finanzas
                </span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-400/30 -rotate-1" />
              </span>
              {' '}con Inteligencia
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Gestiona gastos, presupuestos y alcanza tus metas financieras con
              UniFinanzas - La plataforma integral para universitarios y
              profesionales.
            </motion.p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Crear Cuenta Gratis
                  <svg
                    className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center border-2 border-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  Iniciar Sesión
                </Link>
              </motion.div>
            </div>

            {/* Trust Indicators */}
            <motion.div
              className="grid grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                <p className="font-bold text-lg">100%</p>
                <p className="text-white/70 text-sm">Gratis</p>
              </div>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Shield className="w-8 h-8 mx-auto mb-2 text-green-300" />
                <p className="font-bold text-lg">Seguro</p>
                <p className="text-white/70 text-sm">Encriptado</p>
              </div>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <p className="font-bold text-lg">24/7</p>
                <p className="text-white/70 text-sm">Acceso</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Enhanced Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            <div className="relative w-full max-w-xl">
              {/* Main dashboard card */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Balance Total</p>
                        <p className="text-2xl font-bold">$12,450.00</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs">En línea</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="px-3 py-1 bg-green-400/20 rounded-full text-green-100">
                      +12.5% vs mes anterior
                    </span>
                  </div>
                </div>

                {/* Chart area */}
                <div className="p-6 bg-gray-50">
                  <div className="flex items-end justify-between h-40 space-x-2 mb-6">
                    <motion.div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg"
                      style={{ height: '45%' }}
                      animate={{ height: ['35%', '45%', '40%', '45%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-500 rounded-t-lg"
                      style={{ height: '75%' }}
                      animate={{ height: ['65%', '75%', '70%', '75%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    />
                    <motion.div
                      className="w-full bg-gradient-to-t from-primary-700 to-primary-600 rounded-t-lg"
                      style={{ height: '60%' }}
                      animate={{ height: ['50%', '60%', '55%', '60%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    />
                    <motion.div
                      className="w-full bg-gradient-to-t from-primary-800 to-primary-700 rounded-t-lg"
                      style={{ height: '90%' }}
                      animate={{ height: ['80%', '90%', '85%', '90%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                    />
                    <motion.div
                      className="w-full bg-gradient-to-t from-primary-900 to-primary-800 rounded-t-lg"
                      style={{ height: '70%' }}
                      animate={{ height: ['60%', '70%', '65%', '70%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                    />
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Gastos</span>
                        <DollarSign className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">$3,240</p>
                      <p className="text-xs text-red-600">-5.2% este mes</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Ahorros</span>
                        <PieChart className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">$9,210</p>
                      <p className="text-xs text-green-600">+8.1% este mes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Pago exitoso</p>
                    <p className="text-xs text-gray-500">Netflix - $9.99</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -left-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-4 shadow-2xl text-white"
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-10 h-10" />
                  <div>
                    <p className="font-semibold text-sm">100% Seguro</p>
                    <p className="text-xs opacity-90">Protección total</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -left-8 bg-yellow-400 rounded-xl p-3 shadow-xl"
                animate={{ x: [-5, 5, -5], rotate: [-5, 5, -5] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-6 h-6 text-yellow-900" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="rgb(249, 250, 251)"
          />
        </svg>
      </div>
    </section>
  )
}
