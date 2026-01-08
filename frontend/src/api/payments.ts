import apiClient from './client'
import { Payment, PaymentListResponse, PaymentFrequency } from '../types'

export interface PaymentPayload {
  name: string
  amount: number
  due_date: string
  frequency: PaymentFrequency
  category_id?: string | null
  notes?: string | null
}

export const paymentsApi = {
  list: async (params: { start?: string; end?: string; includePaid?: boolean } = {}): Promise<PaymentListResponse> => {
    const response = await apiClient.get('/payments', {
      params: {
        start: params.start,
        end: params.end,
        include_paid: params.includePaid,
      },
    })
    return response.data
  },

  create: async (payload: PaymentPayload): Promise<{ payment: Payment }> => {
    const response = await apiClient.post('/payments', payload)
    return response.data
  },

  update: async (id: string, payload: Partial<PaymentPayload>): Promise<{ payment: Payment }> => {
    const response = await apiClient.put(`/payments/${id}`, payload)
    return response.data
  },

  markPaid: async (id: string): Promise<{ payment: Payment; next_payment?: Payment }> => {
    const response = await apiClient.put(`/payments/${id}/mark-paid`, { advance: true })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}`)
  },
}
