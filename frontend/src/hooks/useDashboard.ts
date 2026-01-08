import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'
import { expensesApi } from '../api/expenses'
import { DashboardSummary } from '../types'

/**
 * Hook for fetching dashboard summary with React Query
 * Features: automatic retry, caching, background refetch
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
    staleTime: 30000, // Cache válido por 30 segundos
    retry: 3, // Reintentar 3 veces en caso de error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  })
}

/**
 * Hook for creating quick expenses with optimistic updates
 */
export function useQuickExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ amount, categoryId, note }: { amount: number; categoryId: string; note?: string }) =>
      expensesApi.quickCreate(amount, categoryId, note),

    onMutate: async (newExpense) => {
      // Cancel outgoing refetches para evitar sobrescribir optimistic update
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'summary'] })

      // Snapshot del estado anterior
      const previousData = queryClient.getQueryData<DashboardSummary>(['dashboard', 'summary'])

      // Optimistically update dashboard summary
      if (previousData) {
        queryClient.setQueryData<DashboardSummary>(['dashboard', 'summary'], (old) => {
          if (!old) return old

          return {
            ...old,
            current_budget: old.current_budget ? {
              ...old.current_budget,
              spent: old.current_budget.spent + newExpense.amount,
              remaining: old.current_budget.remaining - newExpense.amount,
              percentage: ((old.current_budget.spent + newExpense.amount) / old.current_budget.total) * 100
            } : old.current_budget
          }
        })
      }

      // Return context con previous data para rollback
      return { previousData }
    },

    onError: (_err, _newExpense, context) => {
      // Revertir optimistic update si falla
      if (context?.previousData) {
        queryClient.setQueryData(['dashboard', 'summary'], context.previousData)
      }
    },

    onSuccess: () => {
      // Invalidar y refetch para obtener data real del servidor
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

/**
 * Hook for fetching risk indicator
 */
export function useRiskIndicator() {
  return useQuery({
    queryKey: ['dashboard', 'risk-indicator'],
    queryFn: dashboardApi.getRiskIndicator,
    staleTime: 30000,
    retry: 3,
  })
}

/**
 * Hook for fetching quick stats
 */
export function useQuickStats() {
  return useQuery({
    queryKey: ['dashboard', 'quick-stats'],
    queryFn: dashboardApi.getQuickStats,
    staleTime: 60000, // 1 minuto
    retry: 3,
  })
}
