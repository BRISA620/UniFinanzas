import { useState, useCallback } from 'react'
import { Expense, ExpenseFilters } from '../types'
import { expensesApi } from '../api/expenses'

interface PaginationInfo {
  page: number
  per_page: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async (filters?: ExpenseFilters) => {
    try {
      setLoading(true)
      const response = await expensesApi.list(filters)
      setExpenses(response.expenses)
      setPagination(response.pagination)
      setError(null)
    } catch (err) {
      setError('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [])

  const createExpense = async (data: any, attachment?: File) => {
    const newExpense = await expensesApi.create(data, attachment)
    setExpenses((prev) => [newExpense, ...prev])
    return newExpense
  }

  const updateExpense = async (id: string, data: any) => {
    const updated = await expensesApi.update(id, data)
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }

  const deleteExpense = async (id: string) => {
    await expensesApi.delete(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  return {
    expenses,
    pagination,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
