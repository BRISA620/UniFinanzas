import { Category } from './category'

export interface Budget {
  id: string
  user_id: string
  total_amount: number
  period_start: string
  period_end: string
  is_active: boolean
  notes: string | null
  allocations: BudgetAllocation[]
  created_at: string
  updated_at: string
}

export interface BudgetAllocation {
  id: string
  budget_id: string
  category_id: string
  category: Category
  allocated_amount: number
  created_at: string
}

export interface BudgetCreateData {
  total_amount: number
  period_start?: string
  period_end?: string
  notes?: string
  allocations?: {
    category_id: string
    amount: number
  }[]
}

export interface BudgetWithSpending {
  budget: Budget
  spent: number
  remaining: number
  percentage_used: number
  by_category: {
    category_id: string
    name: string
    icon: string
    color: string
    total: number
  }[]
}
