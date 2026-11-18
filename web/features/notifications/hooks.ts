'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type { AppNotification, NotificationFilters, NotificationsPage } from './types';

export function useNotifications(filters: NotificationFilters, options: { refetchInterval?: number; enabled?: boolean } = {}) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['notifications', projectId, 'list', filters],
    queryFn: () =>
      api.get<NotificationsPage>(path('/notifications'), {
        category: filters.category,
        unread: filters.unread ? true : undefined,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      }),
    enabled: !!projectId && (options.enabled ?? true),
    placeholderData: keepPreviousData,
    refetchInterval: options.refetchInterval,
  });
}

/** Contador de la campana: se refresca cada 30 s. */
export function useUnreadNotificationsCount() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['notifications', projectId, 'unread-count'],
    queryFn: () => api.get<{ unreadCount: number }>(path('/notifications/unread-count')),
    enabled: !!projectId,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationRead() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(path(`/notifications/${id}/read`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', projectId] }),
  });
}

export function useMarkAllNotificationsRead() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(path('/notifications/read-all')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', projectId] });
      toast.success('Todas las notificaciones quedaron como leídas');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

/** Ruta del CRM a la que lleva una notificación (null = no hay detalle). */
export function notificationHref(notification: AppNotification): string | null {
  const { entityType, entityId } = notification;
  if (!entityType) return null;
  // El tipo del backend no incluye CLIENT hoy; se acepta por si se agrega.
  switch (entityType as string) {
    case 'LEAD':
      return entityId ? `/leads/${entityId}` : '/leads';
    case 'QUOTE':
      return entityId ? `/cotizaciones/${entityId}` : '/cotizaciones';
    case 'CLIENT':
      return entityId ? `/clientes/${entityId}` : '/clientes';
    case 'ACCESS_REQUEST':
      return '/configuracion?tab=usuarios';
    default:
      return null;
  }
}

/**
 * Abre una notificación: la marca como leída (sin esperar) y navega a su
 * entidad. Un seguimiento no tiene página propia: se busca su lead.
 */
export function useOpenNotification() {
  const router = useRouter();
  const { path } = useProject();
  const markRead = useMarkNotificationRead();

  return useCallback(
    async (notification: AppNotification) => {
      if (!notification.readAt) markRead.mutate(notification.id);

      if (notification.entityType === 'FOLLOW_UP' && notification.entityId) {
        try {
          const followUp = await api.get<{ leadId: string }>(path(`/follow-ups/${notification.entityId}`));
          router.push(`/leads/${followUp.leadId}`);
        } catch {
          router.push('/leads');
        }
        return;
      }
      const href = notificationHref(notification);
      if (href) router.push(href);
    },
    [markRead, path, router],
  );
}
