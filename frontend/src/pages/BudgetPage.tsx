import { useState, useEffect } from 'react'
import { useBudget } from '../hooks/useBudget'
import { useCategories } from '../hooks/useCategories'
import { Modal } from '../components/common/Modal'
import { Loading } from '../components/common/Loading'
import { EmptyState } from '../components/common/EmptyState'
import { format, addDays, startOfWeek, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseDateOnly } from '../utils/date'
import { PiggyBank, Plus, Edit2, AlertTriangle, Wallet, Calendar, TrendingDown, PieChart as PieChartIcon, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getCurrencySymbol } from '../utils/currency'
import { CategoryIcon } from '../components/categories/CategoryIcon'
import { motion, AnimatePresence } from 'framer-motion'
import { DonutChart } from '../components/budget/DonutChart'
import { TrendLineChart } from '../components/budget/TrendLineChart'

export function BudgetPage() {
  const { currentBudget, loading, error, dailySpending, fetchCurrentBudget, fetchDailySpending, createBudget, setAllocations } = useBudget()
  const { categories } = useCategories()
  const { user } = useAuth()
  const currencyCode = user?.profile.currency_code || 'USD'
  const currencySymbol = getCurrencySymbol(currencyCode)
  const formatAmount = (amount: number) => formatCurrency(amount, currencyCode)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAllocationsModal, setShowAllocationsModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => fetchCurrentBudget(), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [actionError])

  const rawPeriodDays = currentBudget
    ? differenceInCalendarDays(
        parseDateOnly(currentBudget.budget.period_end),
        parseDateOnly(currentBudget.budget.period_start)
      )
    : 0
  const periodDays = currentBudget ? Math.max(rawPeriodDays, 1) : 0
  const normalizedPeriodDays = rawPeriodDays === 6 ? 7 : periodDays
  const periodDailyAmount =
    currentBudget && normalizedPeriodDays > 0
      ? currentBudget.budget.total_amount / normalizedPeriodDays
      : 0
  const periodWeeklyEstimate = periodDailyAmount * 7
  const periodMonthlyEstimate = periodDailyAmount * normalizedPeriodDays

  // Form states
  const [totalAmount, setTotalAmount] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [allocations, setAllocationsState] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchCurrentBudget()
  }, [fetchCurrentBudget])

  // Fetch daily spending when budget is loaded
  useEffect(() => {
    if (currentBudget) {
      fetchDailySpending()
    }
  }, [currentBudget, fetchDailySpending])

  useEffect(() => {
    // Initialize form with current budget data
    if (currentBudget) {
      setTotalAmount(currentBudget.budget.total_amount.toString())
      setNotes(currentBudget.budget.notes || '')

      // Initialize allocations
      const allocs: { [key: string]: string } = {}
      currentBudget.budget.allocations.forEach((a) => {
        allocs[a.category_id] = a.allocated_amount.toString()
      })
      setAllocationsState(allocs)
    } else {
      // Set default dates (current week)
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 1 })
      const weekEnd = addDays(weekStart, 6)
      setPeriodStart(format(weekStart, 'yyyy-MM-dd'))
      setPeriodEnd(format(weekEnd, 'yyyy-MM-dd'))
    }
  }, [currentBudget])

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      setActionError(null)

      const allocationsArray = Object.entries(allocations)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([category_id, amount]) => ({
          category_id,
          amount: parseFloat(amount),
        }))

      await createBudget({
        total_amount: parseFloat(totalAmount),
        period_start: periodStart,
        period_end: periodEnd,
        notes: notes || undefined,
        allocations: allocationsArray.length > 0 ? allocationsArray : undefined,
      })
      setShowCreateModal(false)
    } catch (err) {
      setActionError('Error al crear presupuesto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAllocations = async () => {
    if (!currentBudget) return
    try {
      setIsSubmitting(true)
      setActionError(null)

      const allocationsArray = Object.entries(allocations)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([category_id, amount]) => ({
          category_id,
          amount: parseFloat(amount),
        }))

      await setAllocations(currentBudget.budget.id, allocationsArray)
      setShowAllocationsModal(false)
    } catch (err) {
      setActionError('Error al actualizar asignaciones')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const totalAllocated = Object.values(allocations).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading message="Cargando presupuesto..." />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Presupuesto</h1>
          <p className="text-sm text-gray-500 mt-1">Planifica y controla tus gastos semanales</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {currentBudget ? 'Nuevo Presupuesto' : 'Crear Presupuesto'}
        </button>
      </div>

      {/* Error Messages */}
      <AnimatePresence mode="wait">
        {(error || actionError) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 rounded-xl shadow-lg"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <span className="font-medium flex-1">{error || actionError}</span>
            </div>
            {/* Progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-red-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!currentBudget ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow border border-gray-200 p-8"
        >
          <EmptyState
            icon={PiggyBank}
            title="Sin presupuesto activo"
            description="Crea un presupuesto semanal para comenzar a controlar tus gastos."
            action={{
              label: 'Crear presupuesto',
              onClick: () => setShowCreateModal(true),
            }}
          />
        </motion.div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow border-l-4 border-blue-500"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatAmount(currentBudget.budget.total_amount)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">
                    {format(parseDateOnly(currentBudget.budget.period_start), 'dd MMM', { locale: es })} - {format(parseDateOnly(currentBudget.budget.period_end), 'dd MMM', { locale: es })}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`bg-white rounded-lg shadow border-l-4 ${
                currentBudget.percentage_used >= 90 ? 'border-red-500' :
                currentBudget.percentage_used >= 70 ? 'border-yellow-500' :
                'border-emerald-500'
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gastado</p>
                    <p className={`text-2xl font-bold mt-1 ${getStatusColor(currentBudget.percentage_used)}`}>
                      {formatAmount(currentBudget.spent)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    currentBudget.percentage_used >= 90 ? 'bg-red-50' :
                    currentBudget.percentage_used >= 70 ? 'bg-yellow-50' :
                    'bg-emerald-50'
                  }`}>
                    <TrendingDown className={`h-6 w-6 ${
                      currentBudget.percentage_used >= 90 ? 'text-red-600' :
                      currentBudget.percentage_used >= 70 ? 'text-yellow-600' :
                      'text-emerald-600'
                    }`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs">
                  <span className={`font-medium ${getStatusColor(currentBudget.percentage_used)}`}>
                    {currentBudget.percentage_used.toFixed(1)}% utilizado
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow border-l-4 border-slate-500"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disponible</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatAmount(currentBudget.remaining)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center">
                    <PiggyBank className="h-6 w-6 text-slate-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <span>
                    {currentBudget.remaining > 0 ? 'Por gastar' : 'Presupuesto excedido'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow border border-gray-200"
          >
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Progreso del Presupuesto</h2>
                <p className="text-xs text-gray-500 mt-0.5">{normalizedPeriodDays} días de periodo</p>
              </div>
              <button
                onClick={() => setShowAllocationsModal(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar Asignaciones
              </button>
            </div>

            <div className="p-5">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Uso del presupuesto</span>
                  <span className={`font-semibold ${getStatusColor(currentBudget.percentage_used)}`}>
                    {formatAmount(currentBudget.spent)} / {formatAmount(currentBudget.budget.total_amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(currentBudget.percentage_used, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-2.5 rounded-full ${getProgressColor(currentBudget.percentage_used)}`}
                  />
                </div>
                {currentBudget.percentage_used >= 90 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">
                      ¡Atención! Has utilizado más del 90% de tu presupuesto.
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Estimates */}
              {normalizedPeriodDays > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Promedio por día</p>
                    <p className="text-lg font-bold text-gray-900">{formatAmount(periodDailyAmount)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Equivalente semanal</p>
                    <p className="text-lg font-bold text-gray-900">{formatAmount(periodWeeklyEstimate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Total del periodo</p>
                    <p className="text-lg font-bold text-gray-900">{formatAmount(periodMonthlyEstimate)}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {currentBudget.budget.notes && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-700">{currentBudget.budget.notes}</p>
                </div>
              )}

              {/* Trend Line Chart */}
              {dailySpending && dailySpending.daily_spending.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Tendencia de Gasto Diario
                    </h3>
                  </div>
                  <TrendLineChart
                    dailyData={dailySpending.daily_spending}
                    budgetTotal={dailySpending.budget_total}
                    periodStart={dailySpending.period_start}
                    periodEnd={dailySpending.period_end}
                    currencyCode={currencyCode}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Donut Chart - Distribution */}
          {currentBudget.by_category.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-lg shadow border border-gray-200"
            >
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Distribución de Gastos
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visualización por categorías
                </p>
              </div>
              <div className="p-5">
                <DonutChart
                  data={currentBudget.by_category}
                  totalSpent={currentBudget.spent}
                  currencyCode={currencyCode}
                />
              </div>
            </motion.div>
          )}

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow border border-gray-200"
          >
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Gasto por Categoría</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentBudget.by_category.length} categoría{currentBudget.by_category.length !== 1 ? 's' : ''} con actividad
              </p>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {currentBudget.by_category.length === 0 ? (
                <div className="p-5">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <PiggyBank className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No hay gastos registrados aún</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentBudget.by_category.map((cat, index) => {
                    const allocation = currentBudget.budget.allocations.find(
                      (a) => a.category_id === cat.category_id
                    )
                    const allocatedAmount = allocation?.allocated_amount || 0
                    const percentage = allocatedAmount > 0 ? (cat.total / allocatedAmount) * 100 : 0

                    return (
                      <motion.div
                        key={cat.category_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CategoryIcon icon={cat.icon} color={cat.color} size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                              {allocatedAmount > 0 ? (
                                <p className="text-xs text-gray-500">
                                  Asignado: {formatAmount(allocatedAmount)}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">Sin asignación</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatAmount(cat.total)}
                            </p>
                            {allocatedAmount > 0 && (
                              <p className={`text-xs font-medium ${getStatusColor(percentage)}`}>
                                {Math.min(percentage, 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                        {allocatedAmount > 0 && (
                          <div className="h-1.5 w-full rounded-full bg-gray-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(percentage, 100)}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className={`h-1.5 rounded-full ${getProgressColor(percentage)}`}
                            />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Presupuesto"
        size="lg"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto Total *
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currencySymbol}
                </span>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="input pl-8"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder="Notas opcionales sobre este presupuesto..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Asignación por Categoría (Opcional)
              </label>
              <span className="text-sm text-gray-500">
                Total: {formatAmount(totalAllocated)}
                {totalAmount && totalAllocated > parseFloat(totalAmount) && (
                  <span className="text-red-500 ml-2">
                    (Excede el presupuesto)
                  </span>
                )}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <CategoryIcon icon={cat.icon} color={cat.color} size={18} className="w-8" />
                  <span className="flex-1 text-sm">{cat.name}</span>
                  <div className="relative w-32">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={allocations[cat.id] || ''}
                      onChange={(e) =>
                        setAllocationsState((prev) => ({
                          ...prev,
                          [cat.id]: e.target.value,
                        }))
                      }
                      className="input pl-6 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Presupuesto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Allocations Modal */}
      <Modal
        isOpen={showAllocationsModal}
        onClose={() => setShowAllocationsModal(false)}
        title="Editar Asignaciones"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Presupuesto Total: {currentBudget && formatAmount(currentBudget.budget.total_amount)}
            </span>
            <span className="text-sm font-medium">
              Asignado: {formatAmount(totalAllocated)}
              {currentBudget && totalAllocated > currentBudget.budget.total_amount && (
                <span className="text-red-500 ml-2">(Excede)</span>
              )}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((cat) => {
              const spent = currentBudget?.by_category.find(
                (c) => c.category_id === cat.id
              )?.total || 0

              return (
                <div key={cat.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <CategoryIcon icon={cat.icon} color={cat.color} size={18} className="w-8" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <p className="text-xs text-gray-500">
                      Gastado: {formatAmount(spent)}
                    </p>
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={allocations[cat.id] || ''}
                      onChange={(e) =>
                        setAllocationsState((prev) => ({
                          ...prev,
                          [cat.id]: e.target.value,
                        }))
                      }
                      className="input pl-6 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAllocationsModal(false)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateAllocations}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}


