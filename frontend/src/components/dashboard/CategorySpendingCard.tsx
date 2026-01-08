import { motion } from 'framer-motion'
import { PieChart } from 'lucide-react'
import { CategorySpending } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { CategoryIcon } from '../categories/CategoryIcon'

interface CategorySpendingCardProps {
  categories: CategorySpending[]
  currencyCode: string
}

export function CategorySpendingCard({ categories, currencyCode }: CategorySpendingCardProps) {
  const total = categories.reduce((sum, cat) => sum + cat.total, 0)
  const topCategories = categories.slice(0, 5)

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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-5 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Gasto por Categoría</h3>
              <p className="text-xs text-gray-500">
                Total: {formatCurrency(total, currencyCode, { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <PieChart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No hay gastos en este período</p>
            <p className="text-xs text-gray-400 mt-1">Los gastos aparecerán aquí</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-gray-100">
            {topCategories.map((category, index) => {
              const percentage = total > 0 ? (category.total / total) * 100 : 0

              return (
                <motion.div
                  key={category.category_id}
                  variants={item}
                  className="px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4 mb-2.5">
                    {/* Category Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <CategoryIcon icon={category.icon} color={category.color} size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{category.name}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(category.total, currencyCode, { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                </motion.div>
              )
            })}

            {/* Show more indicator */}
            {categories.length > 5 && (
              <div className="px-5 py-3 text-center bg-gray-50">
                <p className="text-xs text-gray-500">
                  +{categories.length - 5} categorías más
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
