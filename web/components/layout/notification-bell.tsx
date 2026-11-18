'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useOpenNotification,
  useUnreadNotificationsCount,
} from '@/features/notifications/hooks';
import { NotificationContent, NotificationIcon } from '@/features/notifications/notification-item';

/**
 * Campana del encabezado: contador de no leídas (GET unread-count cada 30 s) y
 * un desplegable con las últimas 5 notificaciones.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: unread } = useUnreadNotificationsCount();
  const latest = useNotifications({ page: 1, limit: 5 }, { enabled: open });
  const markAll = useMarkAllNotificationsRead();
  const openNotification = useOpenNotification();

  const count = unread?.unreadCount ?? 0;

  // Cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={count ? `Notificaciones: ${count} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-slate-100"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-canvas">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">
              Notificaciones
              {count ? <span className="ml-1.5 text-xs font-medium text-muted">{count} sin leer</span> : null}
            </p>
            {count ? (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Marcar leídas
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {latest.isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : latest.isError ? (
              <p className="p-4 text-sm text-rose-600">No pudimos cargar las notificaciones.</p>
            ) : !latest.data?.data.length ? (
              <p className="p-6 text-center text-sm text-muted">No tienes notificaciones.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {latest.data.data.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void openNotification(notification);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                        !notification.readAt && 'bg-brand-50/40',
                      )}
                    >
                      <NotificationIcon type={notification.type} className="h-8 w-8 rounded-lg" />
                      <NotificationContent notification={notification} compact />
                      {!notification.readAt ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label="Sin leer" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/notificaciones"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-slate-50"
          >
            Ver todas
          </Link>
        </div>
      ) : null}
    </div>
  );
}
