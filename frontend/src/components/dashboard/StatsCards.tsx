import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

interface StatsCardsProps {
  budget: number
  spent: number
  remaining: number
  percentage: number
  currencyCode: string
}

export function StatsCards({ budget, spent, remaining, percentage, currencyCode }: StatsCardsProps) {
  const stats = [
    {
      title: 'Presupuesto Semanal',
      value: budget,
      icon: Wallet,
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600',
      borderColor: 'border-slate-200',
    },
    {
      title: 'Gastado',
      value: spent,
      icon: CreditCard,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      trend: -percentage,
    },
    {
      title: 'Disponible',
      value: remaining,
      icon: TrendingUp,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'Progreso',
      value: percentage,
      icon: percentage > 75 ? TrendingDown : TrendingUp,
      bgColor: percentage > 75 ? 'bg-orange-50' : 'bg-slate-50',
      iconColor: percentage > 75 ? 'text-orange-600' : 'text-slate-600',
      borderColor: percentage > 75 ? 'border-orange-200' : 'border-slate-200',
      isPercentage: true,
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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          variants={item}
          className={`relative bg-white rounded-lg p-5 shadow border-l-4 ${stat.borderColor} hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-start justify-between">
            {/* Icon and Title */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
              </div>

              {/* Value */}
              <p className="text-2xl font-bold text-gray-900">
                {stat.isPercentage
                  ? `${stat.value.toFixed(1)}%`
                  : formatCurrency(stat.value, currencyCode, { minimumFractionDigits: 0 })}
              </p>

              {/* Trend indicator */}
              {stat.trend !== undefined && (
                <div className="flex items-center text-xs mt-2">
                  <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">{Math.abs(stat.trend).toFixed(1)}%</span>
                  <span className="text-gray-500 ml-1">del presupuesto</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
