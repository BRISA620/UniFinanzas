import { useState, useCallback } from 'react'
import { BudgetWithSpending } from '../types'
import apiClient from '../api/client'

interface DailySpending {
  date: string
  daily_amount: number
  accumulated: number
}

interface DailySpendingResponse {
  period_start: string
  period_end: string
  budget_total: number
  daily_spending: DailySpending[]
}

export function useBudget() {
  const [currentBudget, setCurrentBudget] = useState<BudgetWithSpending | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dailySpending, setDailySpending] = useState<DailySpendingResponse | null>(null)

  const fetchCurrentBudget = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/budgets/current')
      // Si budget es null, establecer currentBudget como null
      if (response.data.budget === null) {
        setCurrentBudget(null)
      } else {
        setCurrentBudget(response.data)
      }
      setError(null)
    } catch (err) {
      setError('Error al cargar presupuesto')
      setCurrentBudget(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDailySpending = useCallback(async () => {
    try {
      const response = await apiClient.get('/budgets/current/daily-spending')
      setDailySpending(response.data)
      return response.data
    } catch (err) {
      console.error('Error fetching daily spending:', err)
      setDailySpending(null)
      return null
    }
  }, [])

  const createBudget = async (data: {
    total_amount: number
    period_start?: string
    period_end?: string
    notes?: string
    allocations?: { category_id: string; amount: number }[]
  }) => {
    const response = await apiClient.post('/budgets', data)
    await fetchCurrentBudget()
    return response.data.budget
  }

  const updateBudget = async (id: string, data: { total_amount?: number; notes?: string }) => {
    const response = await apiClient.put(`/budgets/${id}`, data)
    await fetchCurrentBudget()
    return response.data.budget
  }

  const setAllocations = async (
    budgetId: string,
    allocations: { category_id: string; amount: number }[]
  ) => {
    const response = await apiClient.post(`/budgets/${budgetId}/allocations`, { allocations })
    await fetchCurrentBudget()
    return response.data
  }

  return {
    currentBudget,
    loading,
    error,
    dailySpending,
    fetchCurrentBudget,
    fetchDailySpending,
    createBudget,
    updateBudget,
    setAllocations,
  }
}
