import type { NotificationCategory, NotificationEntity, NotificationType } from '@flowcommerce/types';
import type { Paginated } from '@/lib/api';

export interface AppNotification {
  id: string;
  projectId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /** A qué lleva "Ver detalle" (LEAD, QUOTE, FOLLOW_UP, ACCESS_REQUEST). */
  entityType: NotificationEntity | null;
  entityId: string | null;
  readAt: string | null;
  creadoEn: string;
}

export interface NotificationsPage extends Paginated<AppNotification> {
  /** No leídas en total (para "7 sin leer"). */
  unreadCount: number;
}

export interface NotificationFilters {
  category?: NotificationCategory;
  unread?: boolean;
  page?: number;
  limit?: number;
}
