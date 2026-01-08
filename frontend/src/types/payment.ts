import { Category } from './category'

export type PaymentFrequency = 'one_time' | 'weekly' | 'monthly' | 'yearly'

export interface Payment {
  id: string
  user_id: string
  category_id: string | null
  category?: Category | null
  name: string
  amount: number
  due_date: string
  frequency: PaymentFrequency
  notes?: string | null
  is_paid: boolean
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentListResponse {
  payments: Payment[]
}
