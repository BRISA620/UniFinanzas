import { useState, useEffect } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { ExpenseFilters } from '../components/expenses/ExpenseFilters'
import { ExpenseForm } from '../components/expenses/ExpenseForm'
import { Modal } from '../components/common/Modal'
import { Loading } from '../components/common/Loading'
import { EmptyState } from '../components/common/EmptyState'
import { Expense, ExpenseFilters as Filters } from '../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseDateOnly } from '../utils/date'
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Receipt, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/currency'
import { CategoryIcon } from '../components/categories/CategoryIcon'

export function ExpensesPage() {
  const { expenses, pagination, loading, error, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses()
  const { user } = useAuth()

  const [filters, setFilters] = useState<Filters>({ per_page: 10 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => fetchExpenses(filters), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [actionError])

  useEffect(() => {
    fetchExpenses(filters)
  }, [filters, fetchExpenses])

  const handleFilterChange = (newFilters: Filters) => {
    setFilters({ ...newFilters, page: 1, per_page: filters.per_page })
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const handleCreate = async (data: any) => {
    try {
      setIsSubmitting(true)
      setActionError(null)
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      }
      await createExpense(formattedData)
      setShowCreateModal(false)
      fetchExpenses(filters)
    } catch (err) {
      setActionError('Error al crear el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!selectedExpense) return
    try {
      setIsSubmitting(true)
      setActionError(null)
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      }
      await updateExpense(selectedExpense.id, formattedData)
      setShowEditModal(false)
      setSelectedExpense(null)
      fetchExpenses(filters)
    } catch (err) {
      setActionError('Error al actualizar el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return
    try {
      setIsSubmitting(true)
      setActionError(null)
      await deleteExpense(selectedExpense.id)
      setShowDeleteDialog(false)
      setSelectedExpense(null)
      fetchExpenses(filters)
    } catch (err) {
      setActionError('Error al eliminar el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowEditModal(true)
  }

  const openDeleteDialog = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowDeleteDialog(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Gastos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona y revisa todos tus gastos registrados
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </button>
      </div>

      <ExpenseFilters filters={filters} onFilterChange={handleFilterChange} />

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 rounded-xl shadow-lg mb-6"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
              <span className="font-medium flex-1">{error}</span>
            </div>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-red-500"
            />
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 rounded-xl shadow-lg mb-6"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
              <span className="font-medium flex-1">{actionError}</span>
            </div>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-red-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12">
            <Loading message="Cargando gastos..." />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Receipt}
              title="No hay gastos"
              description="No se encontraron gastos con los filtros seleccionados."
              action={{
                label: 'Crear primer gasto',
                onClick: () => setShowCreateModal(true),
              }}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(parseDateOnly(expense.expense_date), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CategoryIcon
                              icon={expense.category?.icon || 'package'}
                              color={expense.category?.color || '#6B7280'}
                              size={16}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{expense.category?.name || 'Sin categoría'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <span className="text-sm text-gray-600 truncate block">
                          {expense.description || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {expense.tags.length > 0 ? (
                            expense.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          {expense.tags.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                              +{expense.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(expense.amount, user?.profile.currency_code || 'USD')}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(expense)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="bg-gray-50 px-5 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    Mostrando{' '}
                    <span className="font-semibold text-gray-900">
                      {(pagination.page - 1) * pagination.per_page + 1}
                    </span>
                    {' - '}
                    <span className="font-semibold text-gray-900">
                      {Math.min(pagination.page * pagination.per_page, pagination.total)}
                    </span>
                    {' de '}
                    <span className="font-semibold text-gray-900">{pagination.total}</span>
                    {' gastos'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.has_prev}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-2">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.has_next}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Gasto"
        size="lg"
      >
        <ExpenseForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedExpense(null)
        }}
        title="Editar Gasto"
        size="lg"
      >
        {selectedExpense && (
          <ExpenseForm
            initialData={{
              amount: selectedExpense.amount,
              category_id: selectedExpense.category_id,
              description: selectedExpense.description || '',
              expense_date: selectedExpense.expense_date,
              tags: selectedExpense.tags,
            }}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedExpense(null)
            }}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedExpense(null)
        }}
        title="Eliminar Gasto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Estas seguro de que deseas eliminar este gasto? Esta accion quedara registrada en el historial de auditoria.
          </p>
          {selectedExpense && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{formatCurrency(selectedExpense.amount, user?.profile.currency_code || 'USD')}</p>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <CategoryIcon
                  icon={selectedExpense.category?.icon || 'package'}
                  color={selectedExpense.category?.color || '#6B7280'}
                  size={16}
                />
                {selectedExpense.category?.name || 'Sin categoría'}
              </p>
              <p className="text-sm text-gray-500">{selectedExpense.description || 'Sin descripcion'}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedExpense(null)
              }}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
