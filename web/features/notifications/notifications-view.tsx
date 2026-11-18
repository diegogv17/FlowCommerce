'use client';

import { useState } from 'react';
import { BellOff, CheckCheck } from 'lucide-react';
import type { NotificationCategory } from '@flowcommerce/types';
import { Button, Card, EmptyState, ErrorState, PageHeader, Pagination, Pills, Skeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { notificationHref, useMarkAllNotificationsRead, useNotifications, useOpenNotification } from './hooks';
import { NOTIFICATION_TABS } from './meta';
import { NotificationContent, NotificationIcon } from './notification-item';

const PAGE_SIZE = 20;

export function NotificationsView() {
  const [category, setCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [page, setPage] = useState(1);

  const notifications = useNotifications({
    category: category === 'ALL' ? undefined : category,
    unread: onlyUnread,
    page,
    limit: PAGE_SIZE,
  });
  const markAll = useMarkAllNotificationsRead();
  const open = useOpenNotification();

  const data = notifications.data;
  const unreadCount = data?.unreadCount ?? 0;

  function changeCategory(value: NotificationCategory | 'ALL') {
    setCategory(value);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Notificaciones"
        subtitle={
          data
            ? `${formatNumber(unreadCount)} sin leer · ${formatNumber(data.meta.total)} ${
                category === 'ALL' && !onlyUnread ? 'en total' : 'en este filtro'
              }`
            : 'Cargando…'
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => markAll.mutate()}
            loading={markAll.isPending}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" aria-hidden /> Marcar todas como leídas
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Pills options={NOTIFICATION_TABS} value={category} onChange={changeCategory} />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={onlyUnread}
            onChange={(event) => {
              setOnlyUnread(event.target.checked);
              setPage(1);
            }}
          />
          Solo no leídas
        </label>
      </div>

      <Card className="overflow-hidden p-0">
        {notifications.isLoading ? (
          <div className="divide-y divide-line/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.isError ? (
          <div className="p-4">
            <ErrorState message={errorMessage(notifications.error)} onRetry={() => notifications.refetch()} />
          </div>
        ) : !data?.data.length ? (
          <EmptyState
            icon={<BellOff className="h-6 w-6" />}
            title={onlyUnread ? 'No tienes notificaciones sin leer' : 'Sin notificaciones'}
            description="Aquí verás cotizaciones por revisar, mensajes nuevos, seguimientos y leads asignados."
          />
        ) : (
          <ul className={cn('divide-y divide-line/60', notifications.isPlaceholderData && 'opacity-60')}>
            {data.data.map((notification) => {
              const unread = !notification.readAt;
              const hasDetail = notification.entityType === 'FOLLOW_UP' || notificationHref(notification) !== null;
              return (
                <li
                  key={notification.id}
                  className={cn('flex items-start gap-3 px-4 py-4 sm:px-5', unread ? 'bg-slate-50/80' : 'bg-white')}
                >
                  <NotificationIcon type={notification.type} />
                  <NotificationContent notification={notification} />
                  <div className="flex shrink-0 items-center gap-3 self-center">
                    {hasDetail ? (
                      <Button variant="secondary" size="sm" className="text-brand-600" onClick={() => open(notification)}>
                        Ver detalle
                      </Button>
                    ) : unread ? (
                      <Button variant="ghost" size="sm" onClick={() => open(notification)}>
                        Marcar leída
                      </Button>
                    ) : null}
                    <span
                      className={cn('h-2 w-2 rounded-full', unread ? 'bg-emerald-500' : 'bg-transparent')}
                      aria-label={unread ? 'Sin leer' : undefined}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {data && data.meta.totalPages > 1 ? (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onPage={setPage}
          label="notificaciones"
        />
      ) : null}
    </div>
  );
}
