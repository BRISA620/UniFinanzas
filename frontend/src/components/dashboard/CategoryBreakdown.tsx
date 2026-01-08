import { CategorySpending } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { CategoryIcon } from '../categories/CategoryIcon'

interface CategoryBreakdownProps {
  categories: CategorySpending[]
  currencyCode?: string
}

export function CategoryBreakdown({ categories, currencyCode = 'USD' }: CategoryBreakdownProps) {
  const formatAmount = (value: number) =>
    formatCurrency(value, currencyCode, { minimumFractionDigits: 0 })

  const total = categories.reduce((sum, cat) => sum + cat.total, 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Gasto por Categoria</h3>

      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay gastos en este periodo</p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const percentage = total > 0 ? (category.total / total) * 100 : 0
            return (
              <div key={category.category_id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CategoryIcon icon={category.icon} color={category.color} size={18} />
                    <span className="font-medium text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatAmount(category.total)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
              </div>
            )
          })}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatAmount(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
