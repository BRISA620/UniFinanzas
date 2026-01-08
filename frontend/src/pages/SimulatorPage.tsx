import { useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'
import { Calculator, PiggyBank, TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getCurrencySymbol } from '../utils/currency'
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseDateOnly } from '../utils/date'
import { motion, AnimatePresence } from 'framer-motion'

interface PlanScenario {
  label: string
  savings_monthly: number
  available_monthly: number
  essential_monthly: number
  discretionary_monthly: number
  weekly: {
    total: number
    essential: number
    discretionary: number
  }
  tracking: {
    spent_week_to_date: number
    remaining_week: number
    week_exceeded: boolean
    spent_month_to_date: number
    expected_month_to_date: number
    adherence_ratio: number
    adherence_status: 'on_track' | 'over' | 'under'
  }
  feasible: boolean
  shortfall: number
  risk_level: 'green' | 'yellow' | 'red'
  recommendation: string
}

interface PlanResponse {
  inputs: {
    monthly_income: number
    savings_goal: number
    fixed_expenses: number
    essential_expenses: number
    use_calendar_payments: boolean
  }
  fixed_expenses_used: number
  fixed_expenses_source: 'manual' | 'calendar'
  calendar_payments: {
    month_start: string
    month_end: string
    total: number
    included_total: number
    included_ids: string[]
    payments: CalendarPayment[]
  }
  weeks_in_month: number
  days_in_month: number
  scenarios: {
    spend_all: PlanScenario
    normal: PlanScenario
    severe: PlanScenario
  }
}

interface CalendarPayment {
  id: string
  name: string
  amount: number
  due_date: string
}

export function SimulatorPage() {
  const { user } = useAuth()
  const currencyCode = user?.profile.currency_code || 'USD'
  const currencySymbol = getCurrencySymbol(currencyCode)
  const formatAmount = (amount: number) => formatCurrency(amount, currencyCode)

  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [savingsGoal, setSavingsGoal] = useState('')
  const [fixedExpenses, setFixedExpenses] = useState('')
  const [essentialExpenses, setEssentialExpenses] = useState('')
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [useCalendarPayments, setUseCalendarPayments] = useState(true)
  const [calendarPayments, setCalendarPayments] = useState<CalendarPayment[]>([])
  const [excludedPaymentIds, setExcludedPaymentIds] = useState<string[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-hide messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [actionMessage])

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setPaymentsLoading(true)
        const today = new Date()
        const start = format(startOfMonth(today), 'yyyy-MM-dd')
        const end = format(endOfMonth(today), 'yyyy-MM-dd')
        const response = await apiClient.get(`/payments?start=${start}&end=${end}&include_paid=false`)
        setCalendarPayments(response.data.payments || [])
      } catch (err) {
        setCalendarPayments([])
      } finally {
        setPaymentsLoading(false)
      }
    }

    loadPayments()
  }, [])

  const includedPayments = useMemo(() => {
    if (!useCalendarPayments) {
      return []
    }
    return calendarPayments.filter((payment) => !excludedPaymentIds.includes(payment.id))
  }, [calendarPayments, excludedPaymentIds, useCalendarPayments])

  const calendarTotal = useMemo(() => {
    return includedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }, [includedPayments])

  const fixedExpensesValue = useCalendarPayments
    ? calendarTotal.toFixed(2)
    : fixedExpenses

  const togglePayment = (paymentId: string) => {
    setExcludedPaymentIds((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId]
    )
  }

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setActionMessage(null)

      const response = await apiClient.post('/simulator/plan', {
        monthly_income: parseFloat(monthlyIncome),
        savings_goal: parseFloat(savingsGoal || '0'),
        fixed_expenses: parseFloat(fixedExpenses || '0'),
        essential_expenses: parseFloat(essentialExpenses || '0'),
        use_calendar_payments: useCalendarPayments,
        exclude_payment_ids: useCalendarPayments ? excludedPaymentIds : [],
      })

      setPlan(response.data)
    } catch (err) {
      setError('Error al generar el plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyScenario = async (scenario: PlanScenario) => {
    try {
      setIsApplying(true)
      setError(null)
      setActionMessage(null)

      const current = await apiClient.get('/budgets/current')
      if (!current.data?.budget) {
        setError('No hay un presupuesto activo para aplicar este escenario')
        return
      }

      const budgetId = current.data.budget.id
      const periodStart = parseDateOnly(current.data.budget.period_start)
      const periodEnd = parseDateOnly(current.data.budget.period_end)
      const rawPeriodDays = differenceInCalendarDays(periodEnd, periodStart)
      const periodDays = Math.max(rawPeriodDays, 1)
      const normalizedPeriodDays = rawPeriodDays === 6 ? 7 : periodDays
      const weeksInPeriod = Math.max(normalizedPeriodDays / 7, 1)
      const totalForPeriod = Number((scenario.weekly.total * weeksInPeriod).toFixed(2))
      await apiClient.put(`/budgets/${budgetId}`, {
        total_amount: totalForPeriod,
        notes: `Actualizado desde simulador: ${scenario.label}`,
      })

      setActionMessage(
        `Presupuesto actualizado a ${formatAmount(totalForPeriod)} para ${normalizedPeriodDays} días.`
      )
      setTimeout(() => setActionMessage(null), 4000)
    } catch (err) {
      setError('Error al aplicar el escenario al presupuesto')
    } finally {
      setIsApplying(false)
    }
  }

  const scenarios = plan ? Object.values(plan.scenarios) : []

  const getRiskColor = (level: 'green' | 'yellow' | 'red') => {
    if (level === 'red') return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', icon: 'text-red-600' }
    if (level === 'yellow') return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', icon: 'text-yellow-600' }
    return { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', icon: 'text-emerald-600' }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-left">
        <div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Simulador Financiero</h1>
        <p className="text-gray-500 mt-2">Planifica tu mes y descubre cuánto puedes ahorrar</p>
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 rounded-xl shadow-lg"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
              <span className="font-medium flex-1">{error}</span>
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

        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl shadow-lg"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <span className="font-medium flex-1">{actionMessage}</span>
            </div>
            {/* Progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configuración del Plan</h2>
              <p className="text-sm text-gray-600">Completa tus datos para simular escenarios</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ingresos */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Ingresos mensuales
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Ahorro */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                Ahorro objetivo mensual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Gastos importantes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                Gastos importantes mensuales
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={essentialExpenses}
                  onChange={(e) => setEssentialExpenses(e.target.value)}
                  className="input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Gastos fijos */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Gastos fijos mensuales
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={fixedExpensesValue}
                  onChange={(e) => setFixedExpenses(e.target.value)}
                  className="input pl-8"
                  placeholder="0.00"
                  disabled={useCalendarPayments}
                />
              </div>
            </div>
          </div>

          {/* Calendar Payments Toggle */}
          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Usar pagos del calendario</span>
                  <p className="text-xs text-gray-500">Importar pagos programados automáticamente</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCalendarPayments}
                  onChange={(e) => setUseCalendarPayments(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Calendar Payments List */}
            {useCalendarPayments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 rounded-lg border border-gray-200 bg-white overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700">Pagos del mes</p>
                  <p className="text-xs text-gray-500 mt-0.5">Selecciona los pagos a incluir</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {paymentsLoading ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">Cargando pagos...</p>
                    </div>
                  ) : calendarPayments.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">No hay pagos registrados este mes</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {calendarPayments.map((payment) => {
                        const isExcluded = excludedPaymentIds.includes(payment.id)
                        return (
                          <label
                            key={payment.id}
                            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={() => togglePayment(payment.id)}
                                disabled={!useCalendarPayments}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900 block truncate">
                                  {payment.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(parseDateOnly(payment.due_date), 'dd MMM', { locale: es })}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                              {formatAmount(payment.amount)}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
                {calendarPayments.length > 0 && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total incluido</span>
                    <span className="text-base font-bold text-gray-900">{formatAmount(calendarTotal)}</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGeneratePlan}
              disabled={!monthlyIncome || isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 py-3 text-base"
            >
              {isGenerating ? (
                <>
                  <Calculator className="h-5 w-5 animate-pulse" />
                  Generando plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generar Escenarios
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {!plan ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Listo para planificar?</h3>
            <p className="text-gray-500">
              Completa tus datos y genera escenarios personalizados
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Fixed Expenses Info */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Gastos fijos calculados</p>
                    {plan.fixed_expenses_source === 'calendar' && (
                      <p className="text-xs text-gray-500">Basado en pagos del calendario</p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {formatAmount(plan.fixed_expenses_used)}
                </span>
              </div>
            </div>

            {/* Scenarios */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-primary-600" />
                Escenarios Financieros
              </h2>

              {scenarios.map((scenario, index) => {
                const colors = getRiskColor(scenario.risk_level)
                const adherencePercentage = scenario.tracking.adherence_ratio * 100

                return (
                  <motion.div
                    key={scenario.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`bg-white rounded-xl shadow-lg border-l-4 ${colors.border} overflow-hidden`}
                  >
                    {/* Header */}
                    <div className={`p-5 ${colors.bg} border-b border-gray-200`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                            <PiggyBank className={`h-5 w-5 ${colors.icon}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{scenario.label}</h3>
                            <p className={`text-xs font-semibold ${colors.text}`}>
                              {scenario.risk_level === 'red' ? '⚠️ Riesgo Alto' :
                               scenario.risk_level === 'yellow' ? '⚡ Riesgo Medio' :
                               '✓ Riesgo Bajo'}
                            </p>
                          </div>
                        </div>
                        {!scenario.feasible && (
                          <span className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs font-semibold rounded-full">
                            No factible
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 italic">"{scenario.recommendation}"</p>
                    </div>

                    <div className="p-5">
                      {/* Not Feasible Warning */}
                      {!scenario.feasible && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          <span className="text-sm text-red-700">
                            Faltan <strong>{formatAmount(scenario.shortfall)}</strong> para este escenario
                          </span>
                        </div>
                      )}

                      {/* Monthly Overview */}
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center gap-2 mb-2">
                            <PiggyBank className="h-4 w-4 text-emerald-600" />
                            <p className="text-xs font-medium text-emerald-700">Ahorro Mensual</p>
                          </div>
                          <p className="text-2xl font-bold text-emerald-900">
                            {formatAmount(scenario.savings_monthly)}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <p className="text-xs font-medium text-blue-700">Disponible Mensual</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatAmount(scenario.available_monthly)}
                          </p>
                        </div>
                      </div>

                      {/* Weekly Plan */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-5">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                          📅 Plan Semanal Recomendado
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatAmount(scenario.weekly.total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Esenciales</p>
                            <p className="text-lg font-bold text-purple-700">
                              {formatAmount(scenario.weekly.essential)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Discrecional</p>
                            <p className="text-lg font-bold text-blue-700">
                              {formatAmount(scenario.weekly.discretionary)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tracking */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        {/* Week Progress */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-2">Semana Actual</p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-xl font-bold text-gray-900">
                              {formatAmount(scenario.tracking.spent_week_to_date)}
                            </span>
                            <span className="text-sm text-gray-500">
                              / {formatAmount(scenario.weekly.total)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                scenario.tracking.week_exceeded ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min((scenario.tracking.spent_week_to_date / scenario.weekly.total) * 100, 100)}%`
                              }}
                            />
                          </div>
                          {scenario.tracking.week_exceeded && (
                            <p className="text-xs text-red-600 mt-2 font-medium">
                              ⚠️ Límite semanal excedido
                            </p>
                          )}
                        </div>

                        {/* Month Adherence */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-2">Adherencia Mensual</p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-xl font-bold text-gray-900">
                              {adherencePercentage.toFixed(0)}%
                            </span>
                            <span className={`text-xs font-medium ${
                              scenario.tracking.adherence_status === 'on_track' ? 'text-emerald-600' :
                              scenario.tracking.adherence_status === 'under' ? 'text-blue-600' :
                              'text-red-600'
                            }`}>
                              {scenario.tracking.adherence_status === 'on_track' ? '✓ En el plan' :
                               scenario.tracking.adherence_status === 'under' ? '↓ Por debajo' :
                               '↑ Por encima'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                scenario.tracking.adherence_status === 'on_track' ? 'bg-emerald-500' :
                                scenario.tracking.adherence_status === 'under' ? 'bg-blue-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(adherencePercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApplyScenario(scenario)}
                        disabled={isApplying || !scenario.feasible}
                        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplying ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 animate-pulse" />
                            Aplicando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Aplicar este escenario al presupuesto
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
