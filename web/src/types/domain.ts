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
  /** Teléfono y etapa del lead (vienen en la bandeja de la API) */
  phone?: string
  status?: LeadStatus
  /** Hasta cuándo se puede enviar texto libre por WhatsApp (24 h tras el último mensaje del cliente). null = nunca escribió. */
  windowOpenUntil?: string | null
}

export type MessageAuthor = 'lead' | 'agent' | 'ai'

export type MessageDelivery = 'enviando' | 'enviado' | 'entregado' | 'leido' | 'fallido'

export interface Message {
  id: ID
  conversationId: ID
  author: MessageAuthor
  authorName: string
  text: string
  createdAt: string
  /** Solo mensajes enviados: estado que reporta WhatsApp */
  delivery?: MessageDelivery
  /** Motivo de WhatsApp cuando delivery = fallido */
  errorMessage?: string | null
  /** Archivo adjunto (imagen, documento…) descargable */
  attachmentId?: string | null
  /** Nombre de la plantilla cuando el mensaje es una plantilla de WhatsApp */
  templateName?: string | null
}

/** Plantilla de WhatsApp aprobada (para escribir con la ventana de 24 h cerrada). */
export interface WhatsAppTemplate {
  name: string
  language: string
  category: string
  bodyText: string | null
  bodyParameterCount: number
  /** true = el encabezado necesita datos: no se puede enviar desde el CRM */
  headerNeedsParameters: boolean
}

export interface AiSuggestion {
  id: ID
  text: string
  intent: string
  /** 0..1; la API actual no la devuelve */
  confidence?: number
}

/** Insight de IA de un lead (GET /assistant/leads/:leadId/insight). */
export interface LeadInsight {
  summary: string
  nextBestAction: string
  /** 0..100 */
  closeProbability: number
  risks: string[]
  suggestedFollowUpDays: number
  generatedAt: string
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
  /** Responsable (userId) en la API */
  ownerId?: ID | null
  /** Notas libres del cliente (la dirección se guarda aquí, la API no tiene campo propio) */
  notes?: string
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
  /** Unidad de venta en la API (unidad, hora, mes, servicio…). `kind` se deriva de aquí. */
  unit?: string
  /** Descuento máximo permitido por partida al cotizar (%) */
  maxDiscountPercent?: number
}

export type ProductInput = Pick<
  Product,
  'sku' | 'name' | 'kind' | 'category' | 'description' | 'unitPrice' | 'active'
> &
  Partial<Pick<Product, 'unit' | 'maxDiscountPercent'>>

/* ───────────── Cotizaciones ───────────── */

export type QuoteStatus =
  | 'borrador'
  | 'pendiente'
  | 'enviada'
  | 'aprobada'
  | 'rechazada'

/** Estado real de la cotización en la API (las acciones dependen de este). */
export type ApiQuoteStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'PAID' | 'REJECTED'

export interface QuoteItem {
  id: ID
  productId?: ID | null
  description: string
  quantity: number
  /** Precio de lista del catálogo, antes de IVA */
  unitPrice: number
  /** Importe de la partida: cantidad × precio − descuento de línea (antes de IVA) */
  amount: number
  discountPercent?: number
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
  /** Suma bruta de las partidas (precios antes de IVA) */
  subtotal: number
  /** Suma de descuentos de línea */
  discount: number
  total: number
  conditions: string
  notes: string
  /** true cuando la cotización fue preparada por el asistente de IA */
  aiGenerated: boolean
  /** true mientras la cotización no haya sido aprobada internamente (DRAFT o PENDING_APPROVAL) */
  reviewRequired: boolean
  /** Estado real en la API */
  apiStatus?: ApiQuoteStatus
  leadId?: ID
  leadName?: string
  /** Ajuste comercial: descuento global en dinero, antes de IVA */
  adjustment?: number
  /** IVA en dinero y su porcentaje (lo calcula la API sobre subtotal − descuentos − ajuste) */
  tax?: number
  taxPercent?: number
}

/** Resultado de POST /assistant/quote-draft (la cotización ya queda guardada en borrador). */
export interface AiQuoteDraftResult {
  id: ID
  folio: string
  summary: string
  warnings: string[]
}

/** Lead elegible para cotizar (la API exige un lead en cada cotización). */
export interface QuoteLeadOption {
  id: ID
  name: string
  company: string
  email: string
  phone: string
  clientId: ID | null
  clientName: string | null
}

/** Ajustes de cotización de la empresa (GET /projects/:id → quoteSettings). */
export interface QuoteSettings {
  taxPercent: number
  validityDays: number
  defaultTerms: string | null
  currency: string
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
  /** Lead dueño de la cotización (obligatorio en la API) */
  leadId: ID
  /** Si se omite, la API usa el cliente del lead */
  customerId?: ID | null
  /** Fecha YYYY-MM-DD (vence al final de ese día) */
  validUntil: string
  /** Ajuste comercial: descuento global en dinero, antes de IVA */
  discount: number
  conditions: string
  notes?: string
  /** 'borrador' (por defecto) o 'pendiente' = crear y enviar a aprobación */
  status?: QuoteStatus
  /** Los precios salen del catálogo: solo producto, cantidad y descuento % */
  items: Array<{ productId: ID; quantity: number; discountPercent?: number; description?: string }>
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
  /** `goal` solo si la API llega a tener metas de venta (hoy no existe). */
  salesByPeriod: Array<{ label: string; sales: number; goal?: number }>
  salesTotal: number
  todayFollowUps: Array<{
    id: ID
    leadId: ID
    leadName: string
    company: string
    /** Título del seguimiento */
    title?: string
    time: string
    type: 'llamada' | 'reunion' | 'whatsapp' | 'correo' | 'tarea'
    ownerName: string
    status: 'pendiente' | 'confirmado' | 'realizado'
  }>
  recentActivity: Array<{ id: ID; title: string; detail: string; at: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'violet' }>
  /** false = esa sección no se pudo cargar (sin permiso o error): la pantalla la oculta. */
  sections?: { followUps: boolean; activity: boolean }
}

export interface Kpi {
  value: number
  /** variación respecto al periodo anterior (puntos porcentuales o %); null = la API no la calcula */
  delta: number | null
  /** Texto corto bajo el valor cuando no hay variación */
  hint?: string
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
