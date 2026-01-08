import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useDashboardSummary } from '../hooks/useDashboard'
import { StatsCards } from '../components/dashboard/StatsCards'
import { QuickExpenseCard } from '../components/dashboard/QuickExpenseCard'
import { BudgetOverview } from '../components/dashboard/BudgetOverview'
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline'
import { CategorySpendingCard } from '../components/dashboard/CategorySpendingCard'
import { DashboardSkeleton } from '../components/common/Skeleton'
import { ErrorDisplay } from '../components/common/ErrorDisplay'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currencyCode = user?.profile.currency_code || 'USD'

  // React Query hook - maneja loading, error, caching, retry automáticamente
  const { data: summary, isLoading, error, refetch } = useDashboardSummary()

  const handleExpenseSuccess = useCallback(() => {
    // Invalidar y refetch dashboard para obtener datos actualizados
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
  }, [queryClient])

  // Mostrar skeleton mientras carga
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Mostrar error con botón de reintentar
  if (error) {
    return (
      <ErrorDisplay
        title="Error al cargar el dashboard"
        message={error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
        onRetry={() => refetch()}
      />
    )
  }

  // No hay datos (no debería pasar si la API funciona)
  if (!summary) {
    return (
      <ErrorDisplay
        title="Sin datos"
        message="No se pudo cargar la información del dashboard"
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Hola, {user?.profile?.first_name || 'Usuario'} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí está tu resumen financiero de esta semana
        </p>
      </motion.div>

      {/* Stats Cards */}
      {summary?.current_budget && (
        <StatsCards
          budget={summary.current_budget.total}
          spent={summary.current_budget.spent}
          remaining={summary.current_budget.remaining}
          percentage={summary.risk_indicator.percentage}
          currencyCode={currencyCode}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <QuickExpenseCard onSuccess={handleExpenseSuccess} />

          {summary && (
            <BudgetOverview
              data={summary.risk_indicator}
              currencyCode={currencyCode}
              onViewBudget={() => navigate('/app/budget')}
            />
          )}
        </div>

        {/* Right Column - Activity & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {summary && (
            <ActivityTimeline
              expenses={summary.recent_expenses}
              currencyCode={currencyCode}
              onViewAll={() => navigate('/app/expenses')}
            />
          )}

          {summary && (
            <CategorySpendingCard
              categories={summary.category_breakdown}
              currencyCode={currencyCode}
            />
          )}
        </div>
      </div>
    </div>
  )
}
