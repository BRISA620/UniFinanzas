export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  category_type: CategoryType
  monthly_limit: number | null
  description: string | null
  is_default: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryCreateData {
  name: string
  icon?: string
  color?: string
  category_type?: CategoryType
  monthly_limit?: number | null
  description?: string | null
}

export interface CategoryUpdateData {
  name?: string
  icon?: string
  color?: string
  category_type?: CategoryType
  monthly_limit?: number | null
  description?: string | null
  sort_order?: number
  is_active?: boolean
}
