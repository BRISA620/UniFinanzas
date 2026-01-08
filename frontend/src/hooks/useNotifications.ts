import { useCallback, useState } from 'react'
import { notificationsApi } from '../api/notifications'
import { Notification } from '../types'

interface FetchOptions {
  unreadOnly?: boolean
  page?: number
  perPage?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async (options: FetchOptions = {}) => {
    try {
      setLoading(true)
      const response = await notificationsApi.list({
        unreadOnly: options.unreadOnly,
        page: options.page ?? 1,
        perPage: options.perPage ?? 5,
      })
      setNotifications(response.notifications)
      setUnreadCount(response.unread_count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    const existing = notifications.find((item) => item.id === notificationId)
    if (!existing || existing.is_read) return

    try {
      await notificationsApi.markAsRead(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    )
    setUnreadCount((prev) => Math.max(prev - 1, 0))
  }, [notifications])

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return
    try {
      await notificationsApi.markAllAsRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }, [unreadCount])

  const clear = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clear,
  }
}
