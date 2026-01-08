import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import { Loading } from '../components/common/Loading'
import apiClient from '../api/client'
import { Archive, Bell, Palette, Plus, RotateCcw, Search, Shield, Trash2, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryIcon } from '../components/categories/CategoryIcon'
import { CATEGORY_ICON_OPTIONS, DEFAULT_CATEGORY_ICON } from '../utils/categoryIcons'
import { formatCurrency } from '../utils/currency'
import { Category, CategoryType } from '../types'

const CATEGORY_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']

interface UserProfile {
  first_name: string
  last_name: string
  currency_code: string
  timezone: string
  notification_preferences: {
    email_enabled: boolean
    push_enabled: boolean
    weekly_summary: boolean
    threshold_alerts: boolean
    daily_reminder?: boolean
    reminder_time?: string
    payment_reminders?: boolean
    payment_reminder_time?: string
  }
}

export function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const currencyCode = user?.profile.currency_code || 'USD'
  const formatAmount = (value: number) => formatCurrency(value, currencyCode, { minimumFractionDigits: 0 })
  const { categories, addCategory, updateCategory, deleteCategory, loading: categoriesLoading } = useCategories({
    type: 'all',
    includeInactive: true,
  })

  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'notifications' | 'security'>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Auto-hide messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Categories
  const [categoryView, setCategoryView] = useState<'expense' | 'income' | 'archived'>('expense')
  const [categorySearch, setCategorySearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryIcon, setCategoryIcon] = useState(DEFAULT_CATEGORY_ICON)
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0])
  const [categoryType, setCategoryType] = useState<CategoryType>('expense')
  const [categoryMonthlyLimit, setCategoryMonthlyLimit] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryIsActive, setCategoryIsActive] = useState(true)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/profile')
      setProfile(response.data.profile)
    } catch (err) {
      setError('Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    try {
      setSaving(true)
      setError(null)
      await apiClient.put('/profile', profile)
      await refreshUser() // Refresh user data to update currency across the app
      setSuccess('Perfil actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al guardar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!profile) return
    try {
      setSaving(true)
      setError(null)
      const response = await apiClient.put('/profile', {
        notification_preferences: profile.notification_preferences,
      })
      if (response.data?.profile) {
        setProfile(response.data.profile)
      }
      setSuccess('Preferencias guardadas')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al guardar preferencias')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    try {
      setSaving(true)
      setError(null)
      await apiClient.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setSuccess('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al cambiar contraseña')
    } finally {
      setSaving(false)
    }
  }

  const resetCategoryForm = (options: { type?: CategoryType } = {}) => {
    setCategoryName('')
    setCategoryIcon(DEFAULT_CATEGORY_ICON)
    setCategoryColor(CATEGORY_COLORS[0])
    setCategoryType(options.type ?? 'expense')
    setCategoryMonthlyLimit('')
    setCategoryDescription('')
    setCategoryIsActive(true)
  }

  const applyCategoryToForm = (category: Category) => {
    setCategoryName(category.name || '')
    setCategoryIcon(category.icon || DEFAULT_CATEGORY_ICON)
    setCategoryColor(category.color || CATEGORY_COLORS[0])
    setCategoryType(category.category_type || 'expense')
    setCategoryMonthlyLimit(
      category.monthly_limit !== null && category.monthly_limit !== undefined
        ? category.monthly_limit.toString()
        : ''
    )
    setCategoryDescription(category.description || '')
    setCategoryIsActive(category.is_active)
  }

  const filteredCategories = useMemo(() => {
    const normalizedSearch = categorySearch.trim().toLowerCase()

    return categories
      .filter((cat) => {
        if (categoryView === 'archived') {
          return !cat.is_active
        }
        if (!cat.is_active) {
          return false
        }
        return cat.category_type === categoryView
      })
      .filter((cat) => {
        if (!normalizedSearch) return true
        return cat.name.toLowerCase().includes(normalizedSearch)
      })
  }, [categories, categorySearch, categoryView])

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null
    return categories.find((cat) => cat.id === selectedCategoryId) || null
  }, [categories, selectedCategoryId])

  useEffect(() => {
    if (isCreatingCategory) return

    const stillVisible = selectedCategoryId
      ? filteredCategories.some((cat) => cat.id === selectedCategoryId)
      : false

    if (!stillVisible && filteredCategories.length > 0) {
      const first = filteredCategories[0]
      setSelectedCategoryId(first.id)
      applyCategoryToForm(first)
      return
    }

    if (!stillVisible && filteredCategories.length === 0) {
      setSelectedCategoryId(null)
      resetCategoryForm({ type: categoryView === 'income' ? 'income' : 'expense' })
    }
  }, [categoryView, filteredCategories, isCreatingCategory, selectedCategoryId])

  useEffect(() => {
    if (isCreatingCategory || !selectedCategory) return
    applyCategoryToForm(selectedCategory)
  }, [isCreatingCategory, selectedCategory])

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setError('El nombre es requerido')
      return
    }

    const monthlyLimitValue = categoryMonthlyLimit.trim()
      ? Number.parseFloat(categoryMonthlyLimit)
      : null

    if (categoryMonthlyLimit.trim() && (monthlyLimitValue === null || Number.isNaN(monthlyLimitValue) || monthlyLimitValue < 0)) {
      setError('Monto mensual invalido')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const payload = {
        name: categoryName.trim(),
        icon: categoryIcon,
        color: categoryColor,
        category_type: categoryType,
        monthly_limit: monthlyLimitValue,
        description: categoryDescription.trim() || null,
        is_active: categoryIsActive,
      }

      if (isCreatingCategory) {
        const created = await addCategory(payload)
        setIsCreatingCategory(false)
        setSelectedCategoryId(created.id)
        setSuccess('Categoria creada')
      } else if (selectedCategoryId) {
        await updateCategory(selectedCategoryId, payload)
        setSuccess('Categoria actualizada')
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al guardar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Eliminar esta categoria?')) return
    try {
      await deleteCategory(id)
      setSuccess('Categoria eliminada')
      setSelectedCategoryId(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al eliminar categoria')
    }
  }

  const handleArchiveCategory = async () => {
    if (!selectedCategory) return
    if (!confirm('Archivar esta categoria?')) return
    try {
      await updateCategory(selectedCategory.id, { is_active: false })
      setCategoryIsActive(false)
      setSuccess('Categoria archivada')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al archivar categoria')
    }
  }

  const handleRestoreCategory = async () => {
    if (!selectedCategory) return
    try {
      await updateCategory(selectedCategory.id, { is_active: true })
      setCategoryIsActive(true)
      setSuccess('Categoria restaurada')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al restaurar categoria')
    }
  }

  const startCreateCategory = () => {
    const defaultType = categoryView === 'income' ? 'income' : 'expense'
    setIsCreatingCategory(true)
    setSelectedCategoryId(null)
    resetCategoryForm({ type: defaultType })
  }

  const handleCancelCategory = () => {
    setIsCreatingCategory(false)
    if (filteredCategories.length > 0) {
      const nextCategory = filteredCategories[0]
      setSelectedCategoryId(nextCategory.id)
      applyCategoryToForm(nextCategory)
      return
    }
    resetCategoryForm({ type: categoryView === 'income' ? 'income' : 'expense' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading message="Cargando configuración..." />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl shadow-lg mb-6"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <span className="font-medium flex-1">{success}</span>
            </div>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-4 w-4 inline-block mr-2" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="h-4 w-4 inline-block mr-2" />
              Categorías
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="h-4 w-4 inline-block mr-2" />
              Notificaciones
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="h-4 w-4 inline-block mr-2" />
              Seguridad
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <select
                      value={profile.currency_code}
                      onChange={(e) => setProfile({ ...profile, currency_code: e.target.value })}
                      className="input"
                    >
                      <option value="MXN">MXN - Peso Mexicano</option>
                      <option value="USD">USD - Dólar Estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="COP">COP - Peso Colombiano</option>
                      <option value="ARS">ARS - Peso Argentino</option>
                      <option value="PEN">PEN - Sol Peruano</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Categorias</h3>
                  <p className="text-sm text-gray-500">Administra gastos e ingresos desde un solo lugar.</p>
                </div>
                <button
                  onClick={startCreateCategory}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva categoria
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryView('expense')}
                  className={`btn-secondary ${categoryView === 'expense' ? 'bg-primary-100 text-primary-700' : ''}`}
                >
                  Gastos
                </button>
                <button
                  onClick={() => setCategoryView('income')}
                  className={`btn-secondary ${categoryView === 'income' ? 'bg-primary-100 text-primary-700' : ''}`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setCategoryView('archived')}
                  className={`btn-secondary ${categoryView === 'archived' ? 'bg-primary-100 text-primary-700' : ''}`}
                >
                  Archivadas
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Buscar categoria"
                      className="input pl-9"
                    />
                  </div>

                  {categoriesLoading ? (
                    <Loading message="Cargando categorias..." />
                  ) : (
                    <div className="space-y-2">
                      {filteredCategories.length === 0 ? (
                        <div className="text-sm text-gray-500">No hay categorias para mostrar.</div>
                      ) : (
                        filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setIsCreatingCategory(false)
                              setSelectedCategoryId(cat.id)
                              applyCategoryToForm(cat)
                            }}
                            className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                              cat.id === selectedCategoryId && !isCreatingCategory
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${cat.color}1A` }}
                              >
                                <CategoryIcon icon={cat.icon} color={cat.color} size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                                <p className="text-xs text-gray-500">
                                  {cat.category_type === 'income' ? 'Ingreso' : 'Gasto'}
                                  {' · '}
                                  {cat.monthly_limit !== null && cat.monthly_limit !== undefined
                                    ? `Limite ${formatAmount(cat.monthly_limit)}`
                                    : 'Sin limite'}
                                </p>
                              </div>
                            </div>
                            {cat.is_default && (
                              <span className="text-[10px] uppercase text-gray-400">Base</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {isCreatingCategory ? 'Nueva categoria' : 'Detalle de categoria'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Define icono, color y limites para tus categorias.
                        </p>
                      </div>
                      {!isCreatingCategory && selectedCategory && (
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedCategory.is_active ? (
                            !selectedCategory.is_default && (
                              <button
                                onClick={handleArchiveCategory}
                                className="btn-secondary flex items-center gap-2"
                              >
                                <Archive className="h-4 w-4" />
                                Archivar
                              </button>
                            )
                          ) : (
                            <button
                              onClick={handleRestoreCategory}
                              className="btn-secondary flex items-center gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restaurar
                            </button>
                          )}
                          {!selectedCategory.is_default && (
                            <button
                              onClick={() => handleDeleteCategory(selectedCategory.id)}
                              className="btn-secondary flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          className="input"
                          placeholder="Ej: Alimentacion"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={categoryType}
                          onChange={(e) => setCategoryType(e.target.value as CategoryType)}
                          className="input"
                        >
                          <option value="expense">Gasto</option>
                          <option value="income">Ingreso</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limite mensual</label>
                        <input
                          type="number"
                          step="0.01"
                          value={categoryMonthlyLimit}
                          onChange={(e) => setCategoryMonthlyLimit(e.target.value)}
                          className="input"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              categoryIsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {categoryIsActive ? 'Activa' : 'Archivada'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCategoryIcon(key)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                              categoryIcon === key
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-xs text-gray-700">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCategoryColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              categoryColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                      <textarea
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        className="input"
                        rows={3}
                        placeholder="Notas internas o uso sugerido"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      {isCreatingCategory && (
                        <button
                          type="button"
                          onClick={handleCancelCategory}
                          className="btn-secondary"
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveCategory}
                        className="btn-primary"
                        disabled={saving || !categoryName.trim()}
                      >
                        {saving
                          ? 'Guardando...'
                          : isCreatingCategory
                            ? 'Crear categoria'
                            : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && profile && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Preferencias de Notificaciones</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Alertas por Email</p>
                    <p className="text-sm text-gray-500">Recibe alertas importantes en tu correo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notification_preferences.email_enabled}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          notification_preferences: {
                            ...profile.notification_preferences,
                            email_enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Notificaciones Push</p>
                    <p className="text-sm text-gray-500">Notificaciones en tiempo real</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notification_preferences.push_enabled}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          notification_preferences: {
                            ...profile.notification_preferences,
                            push_enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Resumen Semanal</p>
                    <p className="text-sm text-gray-500">Recibe un resumen de tus gastos cada semana</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notification_preferences.weekly_summary}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          notification_preferences: {
                            ...profile.notification_preferences,
                            weekly_summary: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">Recordatorio diario</p>
                    <p className="text-sm text-gray-500">Te avisamos a una hora fija para revisar gastos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        value={profile.notification_preferences.reminder_time || '20:00'}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            notification_preferences: {
                              ...profile.notification_preferences,
                              reminder_time: e.target.value,
                            },
                          })
                        }
                        className="input pl-10 pr-3 py-2 w-32 text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!profile.notification_preferences.daily_reminder}
                      />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.notification_preferences.daily_reminder}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            notification_preferences: {
                              ...profile.notification_preferences,
                              daily_reminder: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">Recordatorios de Pagos</p>
                    <p className="text-sm text-gray-500">Notificaciones sobre pagos próximos a vencer</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        value={profile.notification_preferences.payment_reminder_time || '18:00'}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            notification_preferences: {
                              ...profile.notification_preferences,
                              payment_reminder_time: e.target.value,
                            },
                          })
                        }
                        className="input pl-10 pr-3 py-2 w-32 text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!profile.notification_preferences.payment_reminders}
                      />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.notification_preferences.payment_reminders ?? true}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            notification_preferences: {
                              ...profile.notification_preferences,
                              payment_reminders: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Alertas de Presupuesto</p>
                    <p className="text-sm text-gray-500">
                      Notificaciones cuando alcanzas límites de presupuesto
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notification_preferences.threshold_alerts}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          notification_preferences: {
                            ...profile.notification_preferences,
                            threshold_alerts: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveNotifications} disabled={saving} className="btn-primary">
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-primary"
                >
                  {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
