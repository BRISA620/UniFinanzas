import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Plus, Zap, Check, X } from 'lucide-react'
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

interface QuickExpenseCardProps {
  onSuccess: (result: QuickExpenseResult) => void
}

export function QuickExpenseCard({ onSuccess }: QuickExpenseCardProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { categories, loading: categoriesLoading } = useCategories({ type: 'expense' })

  const amountInputRef = useRef<HTMLInputElement>(null)

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
        setIsExpanded(true)
        setTimeout(() => amountInputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        setAmount('')
        setNote('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!amount || !categoryId) {
        toast.error('Ingresa monto y categoría')
        return
      }

      const amountNum = parseFloat(amount.replace(/,/g, ''))
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Monto inválido')
        return
      }

      setIsSubmitting(true)

      try {
        const result = await expensesApi.quickCreate(amountNum, categoryId, note || undefined)

        localStorage.setItem('last_category_id', categoryId)

        const currencyCode = user?.profile.currency_code || 'USD'
        toast.success(`Gasto de ${formatCurrency(amountNum, currencyCode)} registrado`)

        onSuccess({
          riskIndicator: result.risk_indicator,
          expense: result.expense,
        })

        setAmount('')
        setNote('')
        setIsExpanded(false)
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Error al registrar gasto')
      } finally {
        setIsSubmitting(false)
      }
    },
    [amount, categoryId, note, onSuccess, user]
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(value)
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-5 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Registro Rápido</h3>
              <p className="text-xs text-gray-500">Agrega un gasto</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors text-gray-600"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Compact view */}
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5"
          >
            <button
              onClick={() => {
                setIsExpanded(true)
                setTimeout(() => amountInputRef.current?.focus(), 100)
              }}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Gasto
              <span className="text-xs opacity-75 ml-2">(Ctrl+N)</span>
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="p-5 space-y-3.5"
          >
            {/* Amount input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">
                  {getCurrencySymbol(user?.profile.currency_code || 'USD')}
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Category select */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                disabled={isSubmitting || categoriesLoading || categories.length === 0}
              >
                {categoriesLoading ? (
                  <option>Cargando...</option>
                ) : categories.length === 0 ? (
                  <option>No hay categorías disponibles</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Note input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Nota <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="¿En qué gastaste?"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false)
                  setAmount('')
                  setNote('')
                }}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !amount || !categoryId}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                  isSubmitting || !amount || !categoryId
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Registrar
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
