import apiClient from './client'
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },
}
