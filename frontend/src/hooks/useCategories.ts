import { useState, useEffect, useCallback } from 'react'
import { Category, CategoryCreateData, CategoryType, CategoryUpdateData } from '../types'
import { categoriesApi } from '../api/categories'

interface CategoryListOptions {
  type?: CategoryType | 'all'
  includeInactive?: boolean
}

const RETRY_DELAYS_MS = [0, 500, 1200, 2500]

const isRetryableError = (error: any) => {
  if (!error) return false
  if (!error.response) return true
  if (error.code === 'ECONNABORTED') return true
  if (typeof error.message === 'string' && error.message.toLowerCase().includes('network')) return true
  return error.response?.status >= 500
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useCategories({ type = 'expense', includeInactive = false }: CategoryListOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async (options: CategoryListOptions = {}) => {
    setLoading(true)
    setError(null)

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
      if (RETRY_DELAYS_MS[attempt] > 0) {
        await sleep(RETRY_DELAYS_MS[attempt])
      }
      try {
        const data = await categoriesApi.list({
          type: options.type ?? type,
          include_inactive: options.includeInactive ?? includeInactive,
        })
        setCategories(data)
        setError(null)
        setLoading(false)
        return
      } catch (err) {
        if (!isRetryableError(err) || attempt === RETRY_DELAYS_MS.length - 1) {
          break
        }
      }
    }

    setError('Error al cargar categorias')
    setLoading(false)
  }, [type, includeInactive])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (data: CategoryCreateData) => {
    const newCategory = await categoriesApi.create(data)
    setCategories((prev) => [...prev, newCategory])
    return newCategory
  }

  const updateCategory = async (id: string, data: CategoryUpdateData) => {
    const updated = await categoriesApi.update(id, data)
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  const deleteCategory = async (id: string) => {
    await categoriesApi.delete(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
