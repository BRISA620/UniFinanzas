import { useState } from 'react'
import { ExpenseFilters as Filters } from '../../types'
import { useCategories } from '../../hooks/useCategories'
import { Search, Filter, X } from 'lucide-react'

interface ExpenseFiltersProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
}

export function ExpenseFilters({ filters, onFilterChange }: ExpenseFiltersProps) {
  const { categories } = useCategories()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (key: keyof Filters, value: any) => {
    onFilterChange({ ...filters, [key]: value || undefined })
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en descripción..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showAdvanced
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoría</label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Fecha desde</label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Fecha hasta</label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Monto mínimo</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.min_amount || ''}
                onChange={(e) => handleChange('min_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
