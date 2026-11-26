import type { Quote, ApiQuoteStatus } from '@/types/domain'
import { quoteStatusMeta, type Tone } from '@/lib/labels'

/** Etiquetas del estado real de la API (más precisas que las 5 de la UI). */
export const apiQuoteStatusMeta: Record<ApiQuoteStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Borrador', tone: 'slate' },
  PENDING_APPROVAL: { label: 'Pendiente de aprobación', tone: 'amber' },
  APPROVED: { label: 'Aprobada', tone: 'blue' },
  SENT: { label: 'Enviada', tone: 'violet' },
  ACCEPTED: { label: 'Aceptada', tone: 'green' },
  PAID: { label: 'Pagada', tone: 'green' },
  REJECTED: { label: 'Rechazada', tone: 'red' },
}

export const apiQuoteStatusOrder: ApiQuoteStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'PAID', 'REJECTED']

export function quoteBadge(q: Pick<Quote, 'status' | 'apiStatus'>) {
  return q.apiStatus ? apiQuoteStatusMeta[q.apiStatus] : quoteStatusMeta[q.status]
}
