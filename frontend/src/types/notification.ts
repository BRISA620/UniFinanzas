export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: 'threshold_alert' | 'weekly_summary' | 'reminder' | 'daily_reminder'
  data: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  sent_via: 'push' | 'email' | 'both' | 'none'
  sent_at: string | null
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  unread_count: number
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}
