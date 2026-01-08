import { motion } from 'framer-motion'
import { LayoutDashboard, Tags, LineChart, Zap } from 'lucide-react'

const features = [
  {
    title: 'Dashboard Intuitivo',
    description:
      'Visualiza tu salud financiera de un vistazo. Indicadores de riesgo, gastos recientes y resúmenes mensuales en una interfaz limpia y profesional que te ayuda a tomar decisiones informadas.',
    icon: LayoutDashboard,
    reversed: false,
    gradient: 'from-blue-600 to-cyan-600',
    stats: [
      { label: 'Actualizaciones', value: 'Tiempo real' },
      { label: 'Métricas', value: '15+' },
      { label: 'Personalización', value: '100%' },
    ],
  },
  {
    title: 'Presupuestos Semanales',
    description:
      'Crea y gestiona presupuestos semanales con asignación personalizada por categoría. El sistema calcula automáticamente tus gastos del período y te muestra el progreso en tiempo real.',
    icon: Tags,
    reversed: true,
    gradient: 'from-purple-600 to-pink-600',
    stats: [
      { label: 'Período', value: 'Semanal' },
      { label: 'Categorías', value: 'Ilimitadas' },
      { label: 'Seguimiento', value: 'Automático' },
    ],
  },
  {
    title: 'Sistema de Alertas Inteligente',
    description:
      'Indicador de riesgo tipo semáforo (verde/amarillo/rojo) que monitorea tu presupuesto constantemente. Recibe notificaciones automáticas cuando te acerques a tus límites establecidos.',
    icon: LineChart,
    reversed: false,
    gradient: 'from-green-600 to-emerald-600',
    stats: [
      { label: 'Monitoreo', value: '24/7' },
      { label: 'Umbrales', value: '3 niveles' },
      { label: 'Notificaciones', value: 'Instantáneas' },
    ],
  },
]

export function Features() {
  return (
    <section className="relative py-20 md:py-32 bg-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-gray-900/[0.02] bg-[size:40px_40px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 rounded-full mb-4">
            <Zap className="w-4 h-4 mr-2 text-primary-600" />
            <span className="text-primary-700 font-semibold text-sm">
              Tecnología de Punta
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Potencia tu{' '}
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Gestión Financiera
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Funcionalidades avanzadas que hacen la diferencia en tu día a día
          </p>
        </motion.div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                feature.reversed ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Text content */}
              <div className={feature.reversed ? 'lg:col-start-2' : ''}>
                <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${feature.gradient} rounded-full mb-6`}>
                  <feature.icon className="w-5 h-5 mr-2 text-white" />
                  <span className="text-white font-medium text-sm">
                    Feature #{index + 1}
                  </span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  {feature.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {feature.stats.map((stat, i) => (
                    <div key={i} className="text-center lg:text-left">
                      <div className={`text-2xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-1`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="/register"
                  className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${feature.gradient} text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300`}
                >
                  Probar Ahora
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>

              {/* Visual mockup */}
              <motion.div
                className={`relative ${feature.reversed ? 'lg:col-start-1' : ''}`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`relative bg-gradient-to-br ${feature.gradient} rounded-3xl p-1 shadow-2xl`}>
                  <div className="bg-white rounded-3xl p-8 md:p-10">
                    {/* Icon representation */}
                    <div className="flex items-center justify-center mb-8">
                      <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center shadow-lg transform rotate-6`}>
                        <feature.icon className="w-12 h-12 text-white transform -rotate-6" />
                      </div>
                    </div>

                    {/* Mockup elements */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 bg-gradient-to-r ${feature.gradient} rounded-full w-3/4`} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 bg-gradient-to-r ${feature.gradient} rounded-full w-full opacity-60`} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 bg-gradient-to-r ${feature.gradient} rounded-full w-5/6 opacity-40`} />
                      </div>
                    </div>

                    {/* Animated chart bars */}
                    <div className="flex items-end justify-between h-32 space-x-3">
                      {[60, 85, 50, 95, 70].map((height, i) => (
                        <motion.div
                          key={i}
                          className={`w-full bg-gradient-to-t ${feature.gradient} rounded-t-lg`}
                          style={{ height: `${height}%` }}
                          animate={{
                            height: [`${height - 10}%`, `${height}%`, `${height - 5}%`, `${height}%`],
                            opacity: [0.7, 1, 0.8, 1]
                          }}
                          transition={{
                            duration: 2 + i * 0.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </div>

                    {/* Floating badge */}
                    <motion.div
                      className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 bg-gradient-to-r ${feature.gradient} rounded-full animate-pulse`} />
                        <span className="text-xs font-semibold text-gray-700">Activo</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className={`absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full opacity-20 blur-2xl`} />
                <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full opacity-20 blur-2xl`} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
