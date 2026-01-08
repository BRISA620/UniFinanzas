export interface User {
  id: string
  email: string
  is_verified: boolean
  profile: UserProfile
  created_at: string
  last_login: string | null
}

export interface UserProfile {
  first_name: string | null
  last_name: string | null
  full_name: string
  currency_code: string
  timezone: string
  weekly_closing_day: number
  budget_method: 'weekly' | 'biweekly' | 'monthly'
  notification_preferences: NotificationPreferences
  risk_thresholds: RiskThresholds
}

export interface NotificationPreferences {
  push_enabled: boolean
  email_enabled: boolean
  threshold_alerts: boolean
  weekly_summary: boolean
  daily_reminder: boolean
  reminder_time: string
}

export interface RiskThresholds {
  yellow: number
  red: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface AuthResponse {
  message: string
  user: User
  access_token: string
  refresh_token: string
}
