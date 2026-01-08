import apiClient from './client'
import { Category, CategoryCreateData, CategoryUpdateData, CategoryType } from '../types'

export const categoriesApi = {
  list: async (params: { type?: CategoryType | 'all'; include_inactive?: boolean } = {}): Promise<Category[]> => {
    const response = await apiClient.get('/categories', {
      params: {
        type: params.type,
        include_inactive: params.include_inactive,
      },
    })
    return response.data.categories
  },

  get: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data.category
  },

  create: async (data: CategoryCreateData): Promise<Category> => {
    const response = await apiClient.post('/categories', data)
    return response.data.category
  },

  update: async (id: string, data: CategoryUpdateData): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data)
    return response.data.category
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },
}
