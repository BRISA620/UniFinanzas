import { useCallback, useState } from 'react'
import { paymentsApi, PaymentPayload } from '../api/payments'
import { Payment } from '../types'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPayments = useCallback(async (options: { start?: string; end?: string; includePaid?: boolean } = {}) => {
    try {
      setLoading(true)
      const response = await paymentsApi.list(options)
      setPayments(response.payments)
    } finally {
      setLoading(false)
    }
  }, [])

  const createPayment = useCallback(async (payload: PaymentPayload) => {
    const response = await paymentsApi.create(payload)
    setPayments((prev) => [...prev, response.payment])
    return response.payment
  }, [])

  const updatePayment = useCallback(async (id: string, payload: Partial<PaymentPayload>) => {
    const response = await paymentsApi.update(id, payload)
    setPayments((prev) => prev.map((item) => (item.id === id ? response.payment : item)))
    return response.payment
  }, [])

  const markPaid = useCallback(async (id: string) => {
    const response = await paymentsApi.markPaid(id)
    setPayments((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      if (response.payment) {
        updated.unshift(response.payment)
      }
      if (response.next_payment) {
        updated.push(response.next_payment)
      }
      return updated
    })
    return response
  }, [])

  const deletePayment = useCallback(async (id: string) => {
    await paymentsApi.delete(id)
    setPayments((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return {
    payments,
    loading,
    fetchPayments,
    createPayment,
    updatePayment,
    markPaid,
    deletePayment,
  }
}
