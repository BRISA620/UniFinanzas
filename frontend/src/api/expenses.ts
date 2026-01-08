import apiClient from './client'
import { Expense, ExpenseFilters, ExpenseCreateData, ExpenseUpdateData, RiskIndicator } from '../types'

interface PaginatedResponse {
  expenses: Expense[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

interface QuickExpenseResponse {
  success: boolean
  expense: {
    id: string
    amount: number
    category: string
  }
  risk_indicator: RiskIndicator
}

export const expensesApi = {
  list: async (filters?: ExpenseFilters): Promise<PaginatedResponse> => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get(`/expenses?${params.toString()}`)
    return response.data
  },

  get: async (id: string): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`)
    return response.data.expense
  },

  create: async (data: ExpenseCreateData, attachment?: File): Promise<Expense> => {
    if (attachment) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v))
        } else if (value !== undefined) {
          formData.append(key, String(value))
        }
      })
      formData.append('attachment', attachment)

      const response = await apiClient.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.expense
    }

    const response = await apiClient.post('/expenses', data)
    return response.data.expense
  },

  quickCreate: async (
    amount: number,
    categoryId: string,
    note?: string
  ): Promise<QuickExpenseResponse> => {
    const response = await apiClient.post('/expenses/quick', {
      amount,
      category_id: categoryId,
      note,
    })
    return response.data
  },

  update: async (id: string, data: ExpenseUpdateData): Promise<Expense> => {
    const response = await apiClient.put(`/expenses/${id}`, data)
    return response.data.expense
  },

  delete: async (id: string, reason?: string): Promise<void> => {
    const data = reason ? { reason } : {}
    await apiClient.delete(`/expenses/${id}`, { data })
  },
}
