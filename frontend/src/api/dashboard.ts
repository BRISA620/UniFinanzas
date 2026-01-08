import apiClient from './client'
import { DashboardSummary, RiskIndicator } from '../types'

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/dashboard/summary')
    return response.data
  },

  getRiskIndicator: async (): Promise<RiskIndicator> => {
    const response = await apiClient.get('/dashboard/risk-indicator')
    return response.data
  },

  getQuickStats: async (): Promise<{
    today_spent: number
    week_spent: number
    month_spent: number
    total_expenses: number
  }> => {
    const response = await apiClient.get('/dashboard/quick-stats')
    return response.data
  },
}
