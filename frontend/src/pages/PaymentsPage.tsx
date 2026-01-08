import { useEffect, useMemo, useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, CheckCircle2, Trash2, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { usePayments } from '../hooks/usePayments'
import { useCategories } from '../hooks/useCategories'
import { Modal } from '../components/common/Modal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getCurrencySymbol } from '../utils/currency'
import { parseDateOnly } from '../utils/date'
import { PaymentFrequency } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryIcon } from '../components/categories/CategoryIcon'

const frequencyLabels: Record<PaymentFrequency, string> = {
  one_time: 'Una vez',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

export function PaymentsPage() {
  const { user } = useAuth()
  const currencyCode = user?.profile.currency_code || 'USD'
  const currencySymbol = getCurrencySymbol(currencyCode)
  const formatAmount = (amount: number) => formatCurrency(amount, currencyCode)

  const { payments, loading, fetchPayments, createPayment, markPaid, deletePayment } = usePayments()
  const { categories } = useCategories()

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDueDate, setFormDueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formFrequency, setFormFrequency] = useState<PaymentFrequency>('monthly')
  const [formCategory, setFormCategory] = useState<string>('')
  const [formNotes, setFormNotes] = useState('')

  const calendarStart = useMemo(
    () => startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    [currentMonth]
  )
  const calendarEnd = useMemo(
    () => endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    [currentMonth]
  )

  useEffect(() => {
    fetchPayments({
      start: format(calendarStart, 'yyyy-MM-dd'),
      end: format(calendarEnd, 'yyyy-MM-dd'),
      includePaid: true,
    })
  }, [calendarStart, calendarEnd, fetchPayments])

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  )

  const paymentsByDate = useMemo(() => {
    const map = new Map<string, typeof payments>()
    payments.forEach((payment) => {
      const key = payment.due_date
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)?.push(payment)
    })
    return map
  }, [payments])

  const paymentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return paymentsByDate.get(key) || []
  }, [selectedDate, paymentsByDate])

  const monthlyTotals = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const total = payments.reduce((sum, payment) => {
      const due = parseDateOnly(payment.due_date)
      if (due >= start && due <= end && !payment.is_paid) {
        return sum + payment.amount
      }
      return sum
    }, 0)
    return total
  }, [payments, currentMonth])

  const upcomingPayments = useMemo(() => {
    const start = new Date()
    const end = addMonths(start, 1)
    const upcoming = payments
      .filter((payment) => {
        const due = parseDateOnly(payment.due_date)
        return due >= start && due <= end && !payment.is_paid
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5)
    return upcoming
  }, [payments])

  const monthStats = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const monthPayments = payments.filter((payment) => {
      const due = parseDateOnly(payment.due_date)
      return due >= start && due <= end
    })
    const pendingCount = monthPayments.filter(p => !p.is_paid).length
    const paidCount = monthPayments.filter(p => p.is_paid).length

    return {
      totalPending: monthlyTotals,
      pendingCount,
      paidCount,
      totalCount: monthPayments.length
    }
  }, [payments, currentMonth, monthlyTotals])

  const nextPayment = useMemo(() => {
    const start = new Date()
    const next = payments
      .filter((payment) => {
        const due = parseDateOnly(payment.due_date)
        return due >= start && !payment.is_paid
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
    return next
  }, [payments])

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      await createPayment({
        name: formName,
        amount: parseFloat(formAmount),
        due_date: formDueDate,
        frequency: formFrequency,
        category_id: formCategory || undefined,
        notes: formNotes || undefined,
      })
      setShowModal(false)
      setFormName('')
      setFormAmount('')
      setFormDueDate(format(new Date(), 'yyyy-MM-dd'))
      setFormFrequency('monthly')
      setFormCategory('')
      setFormNotes('')
      await fetchPayments({
        start: format(calendarStart, 'yyyy-MM-dd'),
        end: format(calendarEnd, 'yyyy-MM-dd'),
        includePaid: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    await markPaid(id)
    await fetchPayments({
      start: format(calendarStart, 'yyyy-MM-dd'),
      end: format(calendarEnd, 'yyyy-MM-dd'),
      includePaid: true,
    })
  }

  const handleDelete = (id: string) => {
    setPaymentToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!paymentToDelete) return
    try {
      setIsSubmitting(true)
      await deletePayment(paymentToDelete)
      setShowDeleteConfirm(false)
      setPaymentToDelete(null)
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona y programa tus pagos recurrentes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo pago
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow border-l-4 border-red-500"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente este mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(monthStats.totalPending)}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <span>{monthStats.pendingCount} pago{monthStats.pendingCount !== 1 ? 's' : ''} pendiente{monthStats.pendingCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow border-l-4 border-emerald-500"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagos realizados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{monthStats.paidCount}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <span>De {monthStats.totalCount} total{monthStats.totalCount !== 1 ? 'es' : ''}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow border-l-4 border-blue-500"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximo pago</p>
                {nextPayment ? (
                  <>
                    <p className="text-lg font-bold text-gray-900 mt-1">{nextPayment.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(parseDateOnly(nextPayment.due_date), "d 'de' MMMM", { locale: es })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Sin pagos próximos</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {nextPayment && (
              <div className="mt-3 flex items-center text-xs font-semibold text-gray-900">
                <span>{formatAmount(nextPayment.amount)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Calendar and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200"
        >
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                className="p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <CalendarDays className="h-4 w-4 text-gray-700" />
                </div>
                <span className="text-base font-semibold text-gray-900 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </span>
              </div>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayPayments = paymentsByDate.get(key) || []
                const hasPending = dayPayments.some((p) => !p.is_paid)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isTodayDay = isToday(day)

                return (
                  <motion.button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      rounded-lg border p-2 min-h-[60px] text-left transition-all
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white border-gray-200'}
                      ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''}
                      ${isTodayDay && !isSelected ? 'bg-blue-50 border-blue-200' : ''}
                      ${hasPending && !isSelected ? 'hover:border-primary-300' : 'hover:border-gray-300'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-sm font-medium ${isTodayDay && isCurrentMonth ? 'text-blue-600' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayPayments.length > 0 && (
                        <span className={`h-2 w-2 rounded-full ${hasPending ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      )}
                    </div>
                    {dayPayments.length > 0 && (
                      <p className="mt-1 text-[10px] text-gray-600 font-medium">
                        {dayPayments.length} {dayPayments.length === 1 ? 'pago' : 'pagos'}
                      </p>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Pagos del día */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow border border-gray-200"
          >
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {paymentsForSelectedDate.length} pago{paymentsForSelectedDate.length !== 1 ? 's' : ''} programado{paymentsForSelectedDate.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-5">
                  <p className="text-sm text-gray-500">Cargando...</p>
                </div>
              ) : paymentsForSelectedDate.length === 0 ? (
                <div className="p-5">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No hay pagos programados</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {paymentsForSelectedDate.map((payment, index) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CategoryIcon
                              icon={payment.category?.icon || 'credit-card'}
                              color={payment.category?.color || '#6B7280'}
                              size={20}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{payment.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {frequencyLabels[payment.frequency]} • {payment.category?.name || 'Sin categoría'}
                                </p>
                              </div>
                              <p className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                                {formatAmount(payment.amount)}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                payment.is_paid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              }`}>
                                {payment.is_paid ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>

                            <div className="mt-3 flex gap-2">
                              {!payment.is_paid && (
                                <button
                                  onClick={() => handleMarkPaid(payment.id)}
                                  className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                  Marcar pagado
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(payment.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Próximos pagos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow border border-gray-200"
          >
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Próximos 30 días</h2>
              <p className="text-xs text-gray-500 mt-0.5">Pagos pendientes</p>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {upcomingPayments.length === 0 ? (
                <div className="p-5">
                  <div className="text-center py-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">¡Todo al día!</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedDate(parseDateOnly(payment.due_date))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CategoryIcon
                            icon={payment.category?.icon || 'credit-card'}
                            color={payment.category?.color || '#6B7280'}
                            size={18}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{payment.name}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseDateOnly(payment.due_date), 'dd MMM', { locale: es })}
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                          {formatAmount(payment.amount)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo pago programado"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del pago</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input"
              placeholder="Ej: Alquiler, Servicios, Suscripción"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="input pl-8"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de vencimiento</label>
            <input
              type="date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Frecuencia</label>
            <select
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value as PaymentFrequency)}
              className="input"
            >
              {Object.entries(frequencyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="input"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="input resize-none"
              rows={3}
              placeholder="Agrega detalles adicionales sobre este pago..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="btn-primary flex items-center gap-2"
              disabled={isSubmitting || !formName || !formAmount || !formDueDate}
            >
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="h-4 w-4 animate-pulse" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear pago
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      {paymentToDelete && (() => {
        const payment = payments.find(p => p.id === paymentToDelete)
        if (!payment) return null
        return (
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false)
              setPaymentToDelete(null)
            }}
            onConfirm={confirmDelete}
            title="Eliminar Pago"
            message="¿Estás seguro de que deseas eliminar este pago programado? Esta acción no se puede deshacer."
            confirmText="Sí, eliminar"
            cancelText="Cancelar"
            variant="danger"
            isLoading={isSubmitting}
            details={
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Nombre:</span>
                  <span className="text-sm font-semibold text-gray-900">{payment.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Monto:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatAmount(payment.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Vencimiento:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(parseDateOnly(payment.due_date), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Frecuencia:</span>
                  <span className="text-sm font-semibold text-gray-900">{frequencyLabels[payment.frequency]}</span>
                </div>
              </div>
            }
          />
        )
      })()}
    </motion.div>
  )
}
