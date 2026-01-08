import { Expense } from '../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseDateOnly } from '../../utils/date'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/currency'
import { CategoryIcon } from '../categories/CategoryIcon'

interface RecentExpensesProps {
  expenses: Expense[]
  onViewAll: () => void
}

export function RecentExpenses({ expenses, onViewAll }: RecentExpensesProps) {
  const { user } = useAuth()

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Últimos Gastos</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todos →
        </button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay gastos registrados</p>
      ) : (
        <div className="space-y-3">
          {expenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CategoryIcon
                    icon={expense.category?.icon || 'package'}
                    color={expense.category?.color || '#6B7280'}
                    size={18}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {expense.category?.name || 'Sin categoría'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(parseDateOnly(expense.expense_date), 'dd MMM', { locale: es })}
                    {expense.description && ` • ${expense.description}`}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-gray-900">
                {formatCurrency(expense.amount, user?.profile.currency_code || 'USD')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
