import type { AppNotification, NotificationKind } from '@/types/domain'
import { http, pp, type ApiPaginated } from './http'

/* Forma de la API */
type ApiNotificationType =
  | 'QUOTE_PENDING_APPROVAL'
  | 'QUOTE_APPROVED'
  | 'QUOTE_RETURNED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'QUOTE_PAID'
  | 'QUOTE_EXPIRED'
  | 'MESSAGE_RECEIVED'
  | 'LEAD_ASSIGNED'
  | 'FOLLOW_UP_DUE'
  | 'LEAD_STALE'
  | 'ACCESS_REQUESTED'

type ApiCategory = 'FOLLOW_UP' | 'MESSAGE' | 'QUOTE' | 'LEAD'

interface ApiNotification {
  id: string
  projectId: string
  type: ApiNotificationType
  title: string
  body: string | null
  entityType: 'LEAD' | 'QUOTE' | 'FOLLOW_UP' | 'ACCESS_REQUEST' | null
  entityId: string | null
  readAt: string | null
  creadoEn: string
}

const KIND_TO_CATEGORY: Record<NotificationKind, ApiCategory> = {
  seguimiento: 'FOLLOW_UP',
  mensaje: 'MESSAGE',
  cotizacion: 'QUOTE',
  lead: 'LEAD',
}

type Meta = { kind: NotificationKind; tag: string; tone: AppNotification['tone'] }

const TYPE_META: Record<ApiNotificationType, Meta> = {
  QUOTE_PENDING_APPROVAL: { kind: 'cotizacion', tag: 'Por aprobar', tone: 'amber' },
  QUOTE_APPROVED: { kind: 'cotizacion', tag: 'Aprobada', tone: 'green' },
  QUOTE_RETURNED: { kind: 'cotizacion', tag: 'Devuelta', tone: 'amber' },
  QUOTE_ACCEPTED: { kind: 'cotizacion', tag: 'Aceptada', tone: 'green' },
  QUOTE_REJECTED: { kind: 'cotizacion', tag: 'Rechazada', tone: 'red' },
  QUOTE_PAID: { kind: 'cotizacion', tag: 'Pagada', tone: 'green' },
  QUOTE_EXPIRED: { kind: 'cotizacion', tag: 'Vencida', tone: 'red' },
  MESSAGE_RECEIVED: { kind: 'mensaje', tag: 'Mensaje', tone: 'blue' },
  LEAD_ASSIGNED: { kind: 'lead', tag: 'Asignado', tone: 'blue' },
  FOLLOW_UP_DUE: { kind: 'seguimiento', tag: 'Seguimiento', tone: 'amber' },
  LEAD_STALE: { kind: 'lead', tag: 'Sin contacto', tone: 'amber' },
  ACCESS_REQUESTED: { kind: 'lead', tag: 'Solicitud de acceso', tone: 'violet' },
}

/** Ruta de la interfaz a la que lleva "Ver detalle". */
function hrefOf(n: ApiNotification): string {
  const id = n.entityId
  switch (n.entityType) {
    case 'LEAD':
      if (!id) return '/leads'
      return n.type === 'MESSAGE_RECEIVED' ? `/conversaciones/${id}` : `/leads/${id}`
    case 'QUOTE':
      return id ? `/cotizaciones/${id}` : '/cotizaciones'
    case 'FOLLOW_UP':
      return '/notas'
    case 'ACCESS_REQUEST':
      return '/configuracion?tab=usuarios'
    default:
      return n.type.startsWith('QUOTE_') ? '/cotizaciones' : '/notificaciones'
  }
}

function toNotification(n: ApiNotification): AppNotification {
  const meta = TYPE_META[n.type] ?? { kind: 'lead', tag: 'Aviso', tone: 'blue' }
  return {
    id: n.id,
    kind: meta.kind,
    tag: meta.tag,
    tone: meta.tone,
    title: n.title,
    description: n.body ?? '',
    createdAt: n.creadoEn,
    read: n.readAt !== null,
    href: hrefOf(n),
  }
}

export const notificationsService = {
  /** Últimas 100 notificaciones del usuario en la empresa activa. */
  list: async (params: { kind?: NotificationKind | '' } = {}) => {
    const res = await http.get<ApiPaginated<ApiNotification> & { unreadCount: number }>(pp('/notifications'), {
      params: { category: params.kind ? KIND_TO_CATEGORY[params.kind] : undefined, limit: 100 },
    })
    return res.data.map(toNotification)
  },
  unreadCount: async () => (await http.get<{ unreadCount: number }>(pp('/notifications/unread-count'))).unreadCount,
  markRead: (id: string) => http.post<void>(pp(`/notifications/${id}/read`)),
  markAllRead: () => http.post<void>(pp('/notifications/read-all')),
}
