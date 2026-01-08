import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { expensesApi } from '../../api/expenses'
import { RiskIndicator } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, getCurrencySymbol } from '../../utils/currency'
import { useCategories } from '../../hooks/useCategories'

interface QuickExpenseResult {
  riskIndicator: RiskIndicator
  expense: {
    id: string
    amount: number
    category: string
  }
}

interface QuickExpenseProps {
  onSuccess: (result: QuickExpenseResult) => void
}

export function QuickExpense({ onSuccess }: QuickExpenseProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { categories, loading: categoriesLoading } = useCategories({ type: 'expense' })

  const amountInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    amountInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const lastCategory = localStorage.getItem('last_category_id')
    if (lastCategory && categories.some((c) => c.id === lastCategory)) {
      setCategoryId(lastCategory)
    } else if (categories.length > 0) {
      setCategoryId(categories[0].id)
    }
  }, [categories])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        amountInputRef.current?.focus()
        amountInputRef.current?.select()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!amount || !categoryId) {
        toast.error('Ingresa monto y categoria')
        return
      }

      const amountNum = parseFloat(amount.replace(/,/g, ''))
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Monto invalido')
        return
      }

      setIsSubmitting(true)

      try {
        const result = await expensesApi.quickCreate(amountNum, categoryId, note || undefined)

        localStorage.setItem('last_category_id', categoryId)

        const currencyCode = user?.profile.currency_code || 'USD'
        toast.success(`Gasto de ${formatCurrency(amountNum, currencyCode)} registrado`)

        // Call onSuccess with both expense and risk_indicator
        onSuccess({
          riskIndicator: result.risk_indicator,
          expense: result.expense
        })

        setAmount('')
        setNote('')

        amountInputRef.current?.focus()
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Error al registrar gasto')
      } finally {
        setIsSubmitting(false)
      }
    },
    [amount, categoryId, note, onSuccess]
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(value)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Registro Rapido</h3>
        <span className="text-xs text-gray-500">Ctrl+N para enfocar</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
            {getCurrencySymbol(user?.profile.currency_code || 'USD')}
          </span>
          <input
            ref={amountInputRef}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            onKeyPress={handleKeyPress}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            disabled={isSubmitting}
            autoComplete="off"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isSubmitting || categoriesLoading || categories.length === 0}
          >
            {categoriesLoading ? (
              <option>Cargando...</option>
            ) : categories.length === 0 ? (
              <option>No hay categorias disponibles</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nota (opcional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          disabled={isSubmitting}
          maxLength={100}
        />

        <button
          type="submit"
          disabled={isSubmitting || !amount || !categoryId}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            isSubmitting || !amount || !categoryId
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="spinner" />
              Registrando...
            </>
          ) : (
            <>
              <span>+ Registrar Gasto</span>
              <span className="text-xs opacity-75">(Enter)</span>
            </>
          )}
        </button>
      </form>

      <p className="mt-2 text-xs text-gray-500 text-center">
        Tab para cambiar campos | Enter para guardar | Esc para cancelar
      </p>
    </div>
  )
}
