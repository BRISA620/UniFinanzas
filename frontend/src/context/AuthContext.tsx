import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authApi } from '../api/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const { user } = await authApi.getCurrentUser()
      setUser(user)
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    setUser(response.user)
  }

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await authApi.register({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    })
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    setUser(response.user)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const { user } = await authApi.getCurrentUser()
      setUser(user)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
