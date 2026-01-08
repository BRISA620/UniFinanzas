import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCategories } from '../../hooks/useCategories'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { getCurrencySymbol } from '../../utils/currency'

interface ExpenseFormData {
  amount: number
  category_id: string
  description: string
  expense_date: string
  tags: string
}

interface ExpenseFormProps {
  initialData?: {
    amount: number
    category_id: string
    description: string
    expense_date: string
    tags: string[]
  }
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ExpenseForm({ initialData, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const { categories, loading: categoriesLoading } = useCategories()
  const [attachment, setAttachment] = useState<File | null>(null)
  const { user } = useAuth()
  const currencySymbol = getCurrencySymbol(user?.profile.currency_code || 'USD')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    defaultValues: {
      amount: initialData?.amount || 0,
      category_id: initialData?.category_id || '',
      description: initialData?.description || '',
      expense_date: initialData?.expense_date || format(new Date(), 'yyyy-MM-dd'),
      tags: initialData?.tags?.join(', ') || '',
    },
  })

  useEffect(() => {
    if (categories.length > 0 && !initialData?.category_id) {
      reset((prev) => ({ ...prev, category_id: categories[0].id }))
    }
  }, [categories, initialData, reset])

  const handleFormSubmit = async (data: ExpenseFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {currencySymbol}
          </span>
          <input
            type="number"
            step="0.01"
            {...register('amount', {
              required: 'El monto es requerido',
              min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
            })}
            className="input pl-8"
            placeholder="0.00"
          />
        </div>
        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
        <select
          {...register('category_id', { required: 'Selecciona una categoria' })}
          className="input"
          disabled={categoriesLoading}
        >
          {categoriesLoading ? (
            <option>Cargando...</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
          )}
        </select>
        {errors.category_id && (
          <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
        <input
          type="date"
          {...register('expense_date', { required: 'La fecha es requerida' })}
          className="input"
        />
        {errors.expense_date && (
          <p className="text-red-500 text-sm mt-1">{errors.expense_date.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <textarea
          {...register('description')}
          className="input"
          rows={3}
          placeholder="Descripcion del gasto..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <input
          type="text"
          {...register('tags')}
          className="input"
          placeholder="comida, trabajo, urgente (separados por coma)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adjunto</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          className="input"
        />
        {attachment && (
          <p className="text-sm text-gray-500 mt-1">Archivo seleccionado: {attachment.name}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Gasto'}
        </button>
      </div>
    </form>
  )
}
