import apiClient from './client'
import { NotificationListResponse, Notification } from '../types'

interface ListNotificationsParams {
  unreadOnly?: boolean
  page?: number
  perPage?: number
}

export const notificationsApi = {
  list: async (params: ListNotificationsParams = {}): Promise<NotificationListResponse> => {
    const response = await apiClient.get('/notifications', {
      params: {
        unread_only: params.unreadOnly,
        page: params.page,
        per_page: params.perPage,
      },
    })
    return response.data
  },

  markAsRead: async (notificationId: string): Promise<{ notification: Notification }> => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all')
  },
}
