import type { Channel, LeadSource, LeadStatus, QuoteStatus } from '@/types/domain'

export type Tone = 'blue' | 'green' | 'amber' | 'orange' | 'violet' | 'cyan' | 'red' | 'slate'

export const leadStatusMeta: Record<LeadStatus, { label: string; tone: Tone }> = {
  nuevo: { label: 'Nuevo', tone: 'cyan' },
  contactado: { label: 'Contactado', tone: 'blue' },
  seguimiento: { label: 'Seguimiento', tone: 'violet' },
  cotizacion: { label: 'Cotización', tone: 'amber' },
  negociacion: { label: 'Negociación', tone: 'orange' },
  ganado: { label: 'Ganado', tone: 'green' },
  perdido: { label: 'Perdido', tone: 'red' },
}

export const leadStatusOrder: LeadStatus[] = [
  'nuevo',
  'contactado',
  'seguimiento',
  'cotizacion',
  'negociacion',
  'ganado',
  'perdido',
]

export const quoteStatusMeta: Record<QuoteStatus, { label: string; tone: Tone }> = {
  borrador: { label: 'Borrador', tone: 'slate' },
  pendiente: { label: 'Pendiente', tone: 'amber' },
  enviada: { label: 'Enviada', tone: 'violet' },
  aprobada: { label: 'Aprobada', tone: 'green' },
  rechazada: { label: 'Rechazada', tone: 'red' },
}

export const sourceLabel: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  web: 'Sitio web',
  referido: 'Referido',
  facebook: 'Facebook',
  instagram: 'Instagram',
  llamada: 'Llamada',
  otro: 'Otro',
}

export const channelLabel: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Messenger',
  email: 'Correo',
  web: 'Chat web',
}

export const toneColor: Record<Tone, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  red: '#ef4444',
  slate: '#64748b',
}
