import { motion } from 'framer-motion'
import { Clock, ArrowRight, Calendar } from 'lucide-react'
import { Expense } from '../../types'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseDateOnly } from '../../utils/date'
import { formatCurrency } from '../../utils/currency'
import { CategoryIcon } from '../categories/CategoryIcon'

interface ActivityTimelineProps {
  expenses: Expense[]
  currencyCode: string
  onViewAll: () => void
}

export function ActivityTimeline({ expenses, currencyCode, onViewAll }: ActivityTimelineProps) {
  const getDateLabel = (dateStr: string) => {
    const date = parseDateOnly(dateStr)
    if (isToday(date)) return 'Hoy'
    if (isYesterday(date)) return 'Ayer'
    return format(date, 'dd MMM', { locale: es })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-5 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Últimos Gastos</h3>
              <p className="text-xs text-gray-500">Actividad reciente</p>
            </div>
          </div>
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No hay gastos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Empieza a registrar tus gastos</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-gray-100">
            {expenses.slice(0, 6).map((expense) => (
              <motion.div
                key={expense.id}
                variants={item}
                className="px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Category Icon and Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CategoryIcon
                        icon={expense.category?.icon || 'package'}
                        color={expense.category?.color || '#6B7280'}
                        size={20}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {expense.category?.name || 'Sin categoría'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{getDateLabel(expense.expense_date)}</span>
                        {expense.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{expense.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(expense.amount, currencyCode)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
