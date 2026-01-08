import { Category } from './category'

export interface Expense {
  id: string
  user_id: string
  amount: number
  category_id: string
  category: Category
  description: string | null
  expense_date: string
  expense_time: string | null
  is_recurring: boolean
  tags: string[]
  attachments: Attachment[]
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  expense_id: string
  file_name: string
  file_type: 'image' | 'pdf' | 'other'
  mime_type: string
  file_size: number
  url: string
  thumbnail_url: string | null
  created_at: string
}

export interface ExpenseCreateData {
  amount: number
  category_id: string
  description?: string
  expense_date?: string
  tags?: string[]
}

export interface ExpenseUpdateData {
  amount?: number
  category_id?: string
  description?: string
  expense_date?: string
  tags?: string[]
}

export interface ExpenseFilters {
  start_date?: string
  end_date?: string
  category_id?: string
  min_amount?: number
  max_amount?: number
  search?: string
  page?: number
  per_page?: number
}

export interface RiskIndicator {
  level: 'green' | 'yellow' | 'red' | 'grey'
  percentage: number
  spent: number
  budget: number
  remaining: number
  message: string
  period_start?: string
  period_end?: string
}

export interface CategorySpending {
  category_id: string
  name: string
  icon: string
  color: string
  total: number
  percentage?: number
}

export interface DashboardSummary {
  current_budget: {
    id: string
    total: number
    spent: number
    remaining: number
    percentage: number
    period_start: string
    period_end: string
  } | null
  risk_indicator: RiskIndicator
  recent_expenses: Expense[]
  category_breakdown: CategorySpending[]
  weekly_trend: WeeklyData[]
}

export interface WeeklyData {
  week_start: string
  week_end: string
  amount: number
}
