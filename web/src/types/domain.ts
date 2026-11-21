/**
 * Modelos de dominio del CRM.
 * Estas interfaces son el contrato entre el front y la API (ver docs/API.md).
 * Todas las fechas viajan como string ISO 8601 y los montos como number en GTQ.
 */

export type ID = string

export interface Paginated<T> {
  data: T[]
  meta: { page: number; pageSize: number; total: number }
}

/* ───────────── Auth / usuarios ───────────── */

export type Role = 'admin' | 'supervisor' | 'asesor'

/** Rol real en la API (por empresa). `role` es su equivalente para la interfaz. */
export type ApiRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface User {
  id: ID
  name: string
  email: string
  role: Role
  roleLabel: string
  apiRole?: ApiRole
  /** userId en la API (en el listado de miembros `id` es el de la membresía) */
  userId?: ID
  phone?: string
  position?: string | null
  avatarUrl?: string | null
}

/** Empresa (proyecto) a la que pertenece el usuario. */
export interface ProjectSummary {
  id: ID
  name: string
  slug: string
  description: string | null
  role: ApiRole
}

export type ProfileInput = Pick<User, 'name' | 'email'> & { phone?: string }

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

/* ───────────── Leads ───────────── */

export type LeadStatus =
  | 'nuevo'
  | 'contactado'
  | 'seguimiento'
  | 'cotizacion'
  | 'negociacion'
  | 'ganado'
  | 'perdido'

export type LeadSource =
  | 'whatsapp'
  | 'web'
  | 'referido'
  | 'facebook'
  | 'instagram'
  | 'llamada'
  | 'otro'

export interface Lead {
  id: ID
  name: string
  company: string
  email: string
  phone: string
  status: LeadStatus
  source: LeadSource
  ownerId: ID
  ownerName: string
  value: number
  lastContactAt: string | null
  nextFollowUpAt: string | null
  createdAt: string
}

export type LeadInput = Pick<
  Lead,
  'name' | 'company' | 'email' | 'phone' | 'source' | 'value'
> & { ownerId?: ID; status?: LeadStatus }

export interface LeadFilters {
  search?: string
  status?: LeadStatus | ''
  ownerId?: ID | ''
  source?: LeadSource | ''
  period?: '' | '7d' | '30d' | '90d'
  sort?: '' | 'valor'
  page?: number
  pageSize?: number
}

/* ───────────── Conversaciones / IA ───────────── */

export type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'email' | 'web'

export interface Conversation {
  id: ID
  leadId: ID
  contactName: string
  company: string
  channel: Channel
  lastMessage: string
  lastMessageAt: string
  unread: number
  aiEnabled: boolean
}

export type MessageAuthor = 'lead' | 'agent' | 'ai'

export interface Message {
  id: ID
  conversationId: ID
  author: MessageAuthor
  authorName: string
  text: string
  createdAt: string
}

export interface AiSuggestion {
  id: ID
  text: string
  intent: string
  confidence: number
}

export interface AiSettings {
  enabled: boolean
  autoReply: boolean
  tone: 'formal' | 'cercano' | 'neutro'
  businessHoursOnly: boolean
  handoffKeywords: string[]
  instructions: string
}

/* ───────────── Clientes ───────────── */

export interface Customer {
  id: ID
  name: string
  nit: string
  contactName: string
  contactRole: string
  email: string
  phone: string
  address: string
  ownerName: string
  status: 'activo' | 'inactivo'
  totalSold: number
  quotesCount: number
  averageTicket: number
  lastActivityAt: string
  createdAt: string
}

export interface CustomersSummary {
  active: number
  billedThisYear: number
}

export type CustomerInput = Pick<
  Customer,
  'name' | 'nit' | 'contactName' | 'contactRole' | 'email' | 'phone' | 'address'
>

/* ───────────── Productos y servicios ───────────── */

export type ProductKind = 'producto' | 'servicio'

export interface Product {
  id: ID
  sku: string
  name: string
  kind: ProductKind
  category: string
  description: string
  unitPrice: number
  active: boolean
}

export type ProductInput = Pick<
  Product,
  'sku' | 'name' | 'kind' | 'category' | 'description' | 'unitPrice' | 'active'
>

/* ───────────── Cotizaciones ───────────── */

export type QuoteStatus =
  | 'borrador'
  | 'pendiente'
  | 'enviada'
  | 'aprobada'
  | 'rechazada'

export interface QuoteItem {
  id: ID
  productId?: ID | null
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Quote {
  id: ID
  folio: string
  status: QuoteStatus
  customerId: ID
  customerName: string
  contactName: string
  advisorName: string
  currency: 'GTQ'
  issuedAt: string
  validUntil: string
  items: QuoteItem[]
  /** Suma de conceptos (los precios ya incluyen IVA) */
  subtotal: number
  discount: number
  total: number
  conditions: string
  notes: string
  /** true cuando la cotización fue preparada por el asistente de IA */
  aiGenerated: boolean
  /** true mientras un asesor no la haya revisado y aprobado */
  reviewRequired: boolean
}

export interface QuoteSummary {
  drafts: number
  pending: number
  sent: number
  approved: number
  totalCount: number
  totalValue: number
}

export interface QuoteInput {
  customerId: ID
  validUntil: string
  discount: number
  conditions: string
  notes?: string
  status?: QuoteStatus
  items: Array<Pick<QuoteItem, 'productId' | 'description' | 'quantity' | 'unitPrice'>>
}

/* ───────────── Notas / seguimientos ───────────── */

export interface Note {
  id: ID
  leadId?: ID | null
  leadName?: string | null
  body: string
  authorName: string
  createdAt: string
  followUpAt?: string | null
  done: boolean
  /** Seguimiento cancelado (estado final en la API: no se puede reabrir) */
  cancelled?: boolean
  /** Pendiente y con la fecha ya pasada */
  overdue?: boolean
  type?: NoteType
  /** Resultado registrado al completarlo */
  outcome?: string | null
}

/** Tipo de seguimiento en la API */
export type NoteType = 'TASK' | 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP'

export type NoteInput = Pick<Note, 'body'> & {
  /** Obligatorio en la API: todo seguimiento pertenece a un lead */
  leadId?: ID | null
  /** Obligatorio en la API (fecha límite del seguimiento) */
  followUpAt?: string | null
  type?: NoteType
}

/* ───────────── Dashboard ───────────── */

export interface DashboardSummary {
  kpis: {
    activeLeads: Kpi
    pendingFollowUps: Kpi
    sentQuotes: Kpi
    wonSales: Kpi
    conversion: Kpi
    estimatedPipeline: Kpi
  }
  leadsByStatus: Array<{ status: LeadStatus; count: number }>
  monthlyConversion: Array<{ label: string; value: number }>
  quotesByStatus: Array<{ status: QuoteStatus; count: number }>
  periodLabel: string
  salesByPeriod: Array<{ label: string; sales: number; goal: number }>
  salesTotal: number
  todayFollowUps: Array<{
    id: ID
    leadId: ID
    leadName: string
    company: string
    time: string
    type: 'llamada' | 'reunion' | 'whatsapp' | 'correo'
    ownerName: string
    status: 'pendiente' | 'confirmado' | 'realizado'
  }>
  recentActivity: Array<{ id: ID; title: string; detail: string; at: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'violet' }>
}

export interface Kpi {
  value: number
  /** variación respecto al periodo anterior (puntos porcentuales o %) */
  delta: number
}

/* ───────────── Actividad y notificaciones ───────────── */

export interface ActivityItem {
  id: ID
  title: string
  detail: string
  at: string
  tone: 'blue' | 'green' | 'amber' | 'red' | 'violet'
}

export type NotificationKind = 'seguimiento' | 'mensaje' | 'cotizacion' | 'lead'

export interface AppNotification {
  id: ID
  kind: NotificationKind
  tag: string
  title: string
  description: string
  createdAt: string
  read: boolean
  tone: 'blue' | 'green' | 'amber' | 'red' | 'violet'
  /** Ruta interna a la que lleva "Ver detalle" */
  href: string
}
