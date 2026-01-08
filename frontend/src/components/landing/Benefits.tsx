import { motion } from 'framer-motion'
import {
  TrendingUp,
  Wallet,
  Calendar,
  BarChart3,
  Calculator,
  Shield,
} from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Control Total de Gastos',
    description:
      'Registra y categoriza tus gastos automáticamente. Visualiza en tiempo real hacia dónde va tu dinero.',
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Wallet,
    title: 'Presupuestos Inteligentes',
    description:
      'Crea presupuestos personalizados y recibe alertas cuando te acerques a tus límites establecidos.',
    gradient: 'from-purple-500 to-pink-500',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: Calendar,
    title: 'Recordatorios de Pagos',
    description:
      'Nunca olvides un pago importante. Programa recordatorios y mantén tu historial crediticio impecable.',
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Reportes Detallados',
    description:
      'Analiza tus patrones de gasto con gráficos interactivos y reportes mensuales automatizados.',
    gradient: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    icon: Calculator,
    title: 'Simulador Financiero',
    description:
      'Planifica grandes compras, préstamos y metas de ahorro con nuestro simulador avanzado.',
    gradient: 'from-indigo-500 to-blue-500',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    icon: Shield,
    title: 'Seguridad Garantizada',
    description:
      'Tus datos están protegidos con encriptación de nivel bancario y autenticación segura.',
    gradient: 'from-teal-500 to-cyan-500',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function Benefits() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full mb-4">
            <span className="text-primary-700 font-semibold text-sm">
              ✨ Funcionalidades Premium
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Todo lo que Necesitas para{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Tus Finanzas
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Herramientas profesionales diseñadas para la simplicidad
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Icon with animated background */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 ${benefit.iconBg} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  <benefit.icon className={`w-8 h-8 ${benefit.iconColor}`} />
                </div>
                {/* Decorative dot */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br ${benefit.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 group-hover:bg-clip-text transition-all duration-300">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>

              {/* Hover arrow */}
              <div className="mt-4 flex items-center text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>Descubre más</span>
                <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Corner decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <benefit.icon className="w-full h-full transform rotate-12" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-4">
            ¿Listo para transformar tu vida financiera?
          </p>
          <a
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            Empezar Gratis Ahora
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
