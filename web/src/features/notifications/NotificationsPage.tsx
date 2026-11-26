import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, CheckCheck, CircleCheck, FileText, MessageCircle, Sparkles, UserX, XCircle, type LucideIcon } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, PageLoader, PageHeader } from '@/components/ui'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useNotificationsUnread } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import type { AppNotification, NotificationKind } from '@/types/domain'

const filters: Array<{ value: NotificationKind | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'seguimiento', label: 'Seguimientos' },
  { value: 'mensaje', label: 'Mensajes' },
  { value: 'cotizacion', label: 'Cotizaciones' },
  { value: 'lead', label: 'Leads' },
]

const iconBg: Record<AppNotification['tone'], string> = {
  blue: 'bg-flow-50 text-flow-600',
  green: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-500',
  violet: 'bg-violet-50 text-violet-600',
}

function iconFor(n: AppNotification): LucideIcon {
  if (n.tone === 'green') return CircleCheck
  if (n.tone === 'red') return XCircle
  if (n.tag === 'Oportunidad') return Sparkles
  if (n.kind === 'mensaje') return MessageCircle
  if (n.kind === 'seguimiento') return CalendarClock
  if (n.kind === 'lead') return UserX
  return FileText
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<NotificationKind | ''>('')
  const { data, isLoading, isError, refetch } = useNotifications(kind)
  const markAll = useMarkAllNotificationsRead()
  const markOne = useMarkNotificationRead()
  const unreadCount = useNotificationsUnread()
  // El total sin leer viene de la API (la lista solo trae las 100 más recientes de la pestaña).
  const unread = unreadCount.data ?? (data ?? []).filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle={`${unread} sin leer · ${data?.length ?? 0} ${kind ? 'en esta pestaña' : 'recientes'}`}
        actions={<Button variant="secondary" size="sm" icon={<CheckCheck className="size-4" />} onClick={() => markAll.mutate()} disabled={unread === 0}>Marcar todas como leídas</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setKind(f.value)} className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition-colors', kind === f.value ? 'bg-flow-500 text-white' : 'bg-white text-navy-500 hover:bg-navy-100/70')}>{f.label}</button>
        ))}
      </div>

      <Card className="mx-auto max-w-4xl">
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading || !data ? <PageLoader /> : data.length === 0 ? <EmptyState title="Sin notificaciones" text="Estás al día." /> : (
          <ul className="divide-y divide-navy-100/60">
            {data.map((n) => {
              const Icon = iconFor(n)
              return (
                <li key={n.id} className={cn('flex items-center gap-4 px-5 py-4', !n.read && 'bg-flow-50/40')}>
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', iconBg[n.tone])}><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold">{n.title}</p>
                      <Badge tone={n.tone === 'violet' ? 'violet' : n.tone}>{n.tag}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-navy-500">{n.description}</p>
                    <p className="mt-1 text-[11px] text-navy-300">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="size-2 shrink-0 rounded-full bg-teal-500" aria-label="Sin leer" />}
                  <Button variant="secondary" size="sm" onClick={() => { if (!n.read) markOne.mutate(n.id); navigate(n.href) }}>Ver detalle</Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
