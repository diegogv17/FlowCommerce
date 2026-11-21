import type { AppNotification, NotificationKind } from '@/types/domain'
import { http } from './http'

export const notificationsService = {
  list: (params: { kind?: NotificationKind | '' } = {}) => http.get<AppNotification[]>('/notifications', { params }),
  markRead: (id: string) => http.patch<AppNotification>(`/notifications/${id}`, { read: true }),
  markAllRead: () => http.post<{ ok: boolean }>('/notifications/read-all'),
}
