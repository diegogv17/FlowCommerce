'use client';

import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { notificationMeta } from './meta';
import type { AppNotification } from './types';

/** Icono cuadrado de color según el tipo de notificación. */
export function NotificationIcon({ type, className }: { type: string; className?: string }) {
  const meta = notificationMeta(type);
  const Icon = meta.icon;
  return (
    <span
      className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.iconClass, className)}
      aria-hidden
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

/** Contenido de una notificación (título, etiqueta, cuerpo y hora). */
export function NotificationContent({
  notification,
  compact,
}: {
  notification: AppNotification;
  compact?: boolean;
}) {
  const meta = notificationMeta(notification.type);
  const unread = !notification.readAt;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className={cn('text-sm text-ink', unread ? 'font-semibold' : 'font-medium', compact && 'line-clamp-1')}>
          {notification.title}
        </p>
        {!compact ? (
          <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', meta.badgeClass)}>{meta.label}</span>
        ) : null}
      </div>
      {notification.body ? (
        <p className={cn('mt-0.5 text-sm text-muted', compact ? 'line-clamp-1 text-xs' : 'line-clamp-2')}>
          {notification.body}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-slate-400 first-letter:uppercase">{formatRelative(notification.creadoEn)}</p>
    </div>
  );
}
