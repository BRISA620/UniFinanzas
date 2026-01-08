import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { RiskIndicator as RiskIndicatorType } from '../../types'
import { formatCurrency } from '../../utils/currency'

interface BudgetOverviewProps {
  data: RiskIndicatorType
  currencyCode: string
  onViewBudget: () => void
}

export function BudgetOverview({ data, currencyCode, onViewBudget }: BudgetOverviewProps) {
  const getStatusConfig = () => {
    switch (data.level) {
      case 'green':
        return {
          icon: CheckCircle,
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          progressColor: 'bg-green-500',
          title: 'Excelente Control',
        }
      case 'yellow':
        return {
          icon: AlertTriangle,
          gradient: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          progressColor: 'bg-yellow-500',
          title: 'Atención Requerida',
        }
      case 'red':
        return {
          icon: AlertCircle,
          gradient: 'from-red-500 to-pink-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          progressColor: 'bg-red-500',
          title: 'Límite Alcanzado',
        }
      default:
        return {
          icon: TrendingUp,
          gradient: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          progressColor: 'bg-gray-500',
          title: 'Estado del Presupuesto',
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow border-l-4 ${
        data.level === 'green'
          ? 'border-emerald-500'
          : data.level === 'yellow'
          ? 'border-yellow-500'
          : 'border-red-500'
      }`}
    >
      {/* Header */}
      <div className={`p-5 border-b border-gray-200 ${config.bgColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center border-2 ${
              data.level === 'green'
                ? 'border-emerald-200'
                : data.level === 'yellow'
                ? 'border-yellow-200'
                : 'border-red-200'
            }`}>
              <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Estado del Presupuesto</h3>
              <p className={`text-xs font-medium ${config.textColor}`}>{config.title}</p>
            </div>
          </div>
        </div>
        <div className={`text-3xl font-bold ${config.textColor}`}>{data.percentage.toFixed(1)}%</div>
        <p className="text-xs text-gray-600 mt-1">{data.message}</p>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Progreso</span>
            <span className="font-semibold">{Math.min(data.percentage, 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(data.percentage, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${config.progressColor}`}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Presupuesto</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(data.budget, currencyCode, { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Gastado</span>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(data.spent, currencyCode, { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Disponible</span>
            <span className="text-sm font-bold text-emerald-600">
              {formatCurrency(data.remaining, currencyCode, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onViewBudget}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Ver Detalles del Presupuesto
        </button>
      </div>
    </motion.div>
  )
}
