import type { ActivityItem, Lead, LeadSource, LeadStatus, Note, NoteType } from '@/types/domain'

/* ───────────── Formas de la API (NestJS) ───────────── */

export type ApiLeadStage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
export type ApiLeadSource = 'REFERRAL' | 'WEBSITE' | 'WHATSAPP' | 'SOCIAL_MEDIA' | 'EVENT' | 'COLD_OUTREACH' | 'OTHER'

export interface ApiRef {
  id: string
  name: string
}

export interface ApiLead {
  id: string
  projectId: string
  name: string
  email: string | null
  phone: string | null
  stage: ApiLeadStage
  score: number
  company: string | null
  contactPosition: string | null
  origin: 'MANUAL' | 'AI'
  source: ApiLeadSource | null
  estimatedValue: number | string | null
  notes: string | null
  assignedUserId: string | null
  assignedUser: ApiRef | null
  clientId: string | null
  client: ApiRef | null
  interestProductId: string | null
  interestProduct: ApiRef | null
  lastContactAt: string | null
  nextFollowUpAt: string | null
  creadoEn: string
  actualizadoEn: string
}

export interface ApiActivityEvent {
  id: string
  projectId: string
  type: string
  title: string
  actor: ApiRef | null
  leadId: string | null
  clientId: string | null
  quoteId: string | null
  metadata: Record<string, unknown>
  creadoEn: string
}

export type ApiFollowUpType = NoteType
export type ApiFollowUpStatus = 'PENDING' | 'DONE' | 'CANCELLED'

export interface ApiFollowUp {
  id: string
  projectId: string
  leadId: string
  lead: ApiRef
  type: ApiFollowUpType
  title: string
  notes: string | null
  dueAt: string
  status: ApiFollowUpStatus
  overdue: boolean
  assignedUserId: string | null
  assignedUser: ApiRef | null
  createdByUserId: string | null
  completedAt: string | null
  outcome: string | null
  creadoEn: string
  actualizadoEn: string
}

/* ───────────── Etapas ───────────── */

export const STAGE_TO_STATUS: Record<ApiLeadStage, LeadStatus> = {
  NEW: 'nuevo',
  CONTACTED: 'contactado',
  QUALIFIED: 'seguimiento',
  PROPOSAL: 'cotizacion',
  NEGOTIATION: 'negociacion',
  WON: 'ganado',
  LOST: 'perdido',
}

export const STATUS_TO_STAGE: Record<LeadStatus, ApiLeadStage> = {
  nuevo: 'NEW',
  contactado: 'CONTACTED',
  seguimiento: 'QUALIFIED',
  cotizacion: 'PROPOSAL',
  negociacion: 'NEGOTIATION',
  ganado: 'WON',
  perdido: 'LOST',
}

/* ───────────── Fuentes ───────────── */

const API_TO_SOURCE: Record<ApiLeadSource, LeadSource> = {
  REFERRAL: 'referido',
  WEBSITE: 'web',
  WHATSAPP: 'whatsapp',
  SOCIAL_MEDIA: 'facebook',
  EVENT: 'otro',
  COLD_OUTREACH: 'llamada',
  OTHER: 'otro',
}

const SOURCE_TO_API: Record<LeadSource, ApiLeadSource> = {
  referido: 'REFERRAL',
  web: 'WEBSITE',
  whatsapp: 'WHATSAPP',
  facebook: 'SOCIAL_MEDIA',
  instagram: 'SOCIAL_MEDIA',
  llamada: 'COLD_OUTREACH',
  otro: 'OTHER',
}

export const toUiSource = (s: ApiLeadSource | null | undefined): LeadSource => (s ? API_TO_SOURCE[s] ?? 'otro' : 'otro')
export const toApiSource = (s: LeadSource): ApiLeadSource => SOURCE_TO_API[s] ?? 'OTHER'

/**
 * La API solo distingue "redes sociales" (Facebook e Instagram son la misma
 * fuente). Estas son las opciones que ofrecen los selects de leads, y la
 * etiqueta con la que se muestra cada fuente.
 */
export const leadSourceOptions: Array<{ value: LeadSource; label: string }> = [
  { value: 'web', label: 'Sitio web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referido', label: 'Referido' },
  { value: 'facebook', label: 'Redes sociales' },
  { value: 'llamada', label: 'Llamada / prospección' },
  { value: 'otro', label: 'Otro' },
]

export const leadSourceLabel = (s: LeadSource): string =>
  s === 'instagram' ? 'Redes sociales' : leadSourceOptions.find((o) => o.value === s)?.label ?? 'Otro'

/* ───────────── Lead ───────────── */

export function toLead(l: ApiLead): Lead {
  return {
    id: l.id,
    name: l.name,
    company: l.company ?? '',
    email: l.email ?? '',
    phone: l.phone ?? '',
    status: STAGE_TO_STATUS[l.stage] ?? 'nuevo',
    source: toUiSource(l.source),
    ownerId: l.assignedUserId ?? '',
    ownerName: l.assignedUser?.name ?? 'Sin asignar',
    value: l.estimatedValue == null ? 0 : Number(l.estimatedValue),
    lastContactAt: l.lastContactAt ?? null,
    nextFollowUpAt: l.nextFollowUpAt ?? null,
    createdAt: l.creadoEn,
  }
}

/* ───────────── Actividad ───────────── */

type Tone = ActivityItem['tone']

const ACTIVITY_TONE: Record<string, Tone> = {
  LEAD_CREATED: 'blue',
  LEAD_STAGE_CHANGED: 'violet',
  LEAD_ASSIGNED: 'blue',
  LEAD_CONVERTED: 'green',
  CLIENT_CREATED: 'green',
  QUOTE_CREATED: 'amber',
  QUOTE_STATUS_CHANGED: 'amber',
  QUOTE_SENT_BY_EMAIL: 'violet',
  QUOTE_PAYMENT_LINK_CREATED: 'violet',
  MESSAGE_SENT: 'blue',
  MESSAGE_RECEIVED: 'blue',
  FOLLOW_UP_CREATED: 'amber',
  FOLLOW_UP_COMPLETED: 'green',
  FOLLOW_UP_CANCELLED: 'red',
  ATTACHMENT_ADDED: 'violet',
}

const STAGE_LABEL: Record<ApiLeadStage, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Seguimiento',
  PROPOSAL: 'Cotización',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
}

const isStage = (v: unknown): v is ApiLeadStage => typeof v === 'string' && v in STAGE_LABEL

export function toActivityItem(e: ApiActivityEvent): ActivityItem {
  let tone: Tone = ACTIVITY_TONE[e.type] ?? 'blue'
  const parts: string[] = []
  if (e.type === 'LEAD_STAGE_CHANGED') {
    const { from, to } = e.metadata ?? {}
    if (to === 'WON') tone = 'green'
    if (to === 'LOST') tone = 'red'
    if (isStage(from) && isStage(to)) parts.push(`${STAGE_LABEL[from]} → ${STAGE_LABEL[to]}`)
  }
  parts.push(e.actor ? `Por ${e.actor.name}` : 'Automático')
  return { id: e.id, title: e.title, detail: parts.join(' · '), at: e.creadoEn, tone }
}

/* ───────────── Seguimientos (Notas) ───────────── */

/** El texto de la nota se guarda como título (máx. 255) y, si no cabe, completo en `notes`. */
export function splitNoteBody(body: string): { title: string; notes: string | null } {
  const text = body.trim()
  const firstLine = text.split('\n')[0].trim()
  if (firstLine === text && text.length <= 255) return { title: text, notes: null }
  const title = firstLine.length > 255 ? `${firstLine.slice(0, 252)}…` : firstLine
  return { title, notes: text }
}

export function toNote(f: ApiFollowUp, authorOf: (userId: string | null) => string | undefined): Note {
  return {
    id: f.id,
    leadId: f.leadId,
    leadName: f.lead?.name ?? null,
    body: f.notes?.trim() ? f.notes : f.title,
    authorName: authorOf(f.createdByUserId) ?? f.assignedUser?.name ?? 'Sistema',
    createdAt: f.creadoEn,
    followUpAt: f.dueAt,
    done: f.status === 'DONE',
    cancelled: f.status === 'CANCELLED',
    overdue: f.overdue,
    type: f.type,
    outcome: f.outcome,
  }
}
