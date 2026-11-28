import type {
  AiQuoteDraftResult,
  ApiQuoteStatus,
  Paginated,
  Quote,
  QuoteInput,
  QuoteItem,
  QuoteLeadOption,
  QuoteSettings,
  QuoteStatus,
  QuoteSummary,
} from '@/types/domain'
import { http, pp, type ApiPaginated } from './http'

/* ───────────── Formas de la API ───────────── */

interface ApiRef {
  id: string
  name: string
}

interface ApiQuoteItem {
  id: string
  quoteId: string
  productId: string
  description: string
  quantity: number
  unitPrice: number
  discountPercent: number
  lineTotal: number
  position: number
}

interface ApiQuote {
  id: string
  projectId: string
  leadId: string
  lead: ApiRef | null
  clientId: string | null
  client: ApiRef | null
  folio: string
  subtotal: number
  discount: number
  adjustment: number
  taxPercent: number
  tax: number
  total: number
  status: ApiQuoteStatus
  validUntil: string | null
  notes: string | null
  terms: string | null
  createdByUserId: string | null
  createdBy: { id: string; name: string; email: string; phone: string | null } | null
  origin: 'MANUAL' | 'AI'
  approvedAt: string | null
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  paidAt: string | null
  paymentReference?: string | null
  creadoEn: string
  actualizadoEn: string
  items?: ApiQuoteItem[]
}

type ApiQuotesPage = ApiPaginated<ApiQuote> & { meta: { sumTotal?: number } }

interface ApiLead {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  clientId: string | null
  client: ApiRef | null
}

/* ───────────── Estados ───────────── */

/** API → UI. APPROVED, ACCEPTED y PAID se muestran como «aprobada»; `apiStatus` conserva el real. */
export const API_TO_UI_STATUS: Record<ApiQuoteStatus, QuoteStatus> = {
  DRAFT: 'borrador',
  PENDING_APPROVAL: 'pendiente',
  APPROVED: 'aprobada',
  SENT: 'enviada',
  ACCEPTED: 'aprobada',
  PAID: 'aprobada',
  REJECTED: 'rechazada',
}

const UI_TO_API_STATUS: Record<QuoteStatus, ApiQuoteStatus> = {
  borrador: 'DRAFT',
  pendiente: 'PENDING_APPROVAL',
  aprobada: 'APPROVED',
  enviada: 'SENT',
  rechazada: 'REJECTED',
}

const API_STATUSES: readonly string[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'PAID', 'REJECTED']

/** Acepta un estado de la API o de la UI y devuelve el de la API. */
export function toApiStatus(status: string): ApiQuoteStatus | undefined {
  if (!status) return undefined
  if (API_STATUSES.includes(status)) return status as ApiQuoteStatus
  return UI_TO_API_STATUS[status as QuoteStatus]
}

/* ───────────── Mapeo ───────────── */

function toItem(it: ApiQuoteItem): QuoteItem {
  return {
    id: it.id,
    productId: it.productId,
    description: it.description,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
    amount: Number(it.lineTotal),
    discountPercent: Number(it.discountPercent ?? 0),
  }
}

export function toQuote(q: ApiQuote): Quote {
  const leadName = q.lead?.name ?? ''
  const customerName = q.client?.name ?? leadName ?? '—'
  return {
    id: q.id,
    folio: q.folio,
    status: API_TO_UI_STATUS[q.status] ?? 'borrador',
    apiStatus: q.status,
    customerId: q.clientId ?? '',
    customerName: customerName || '—',
    contactName: leadName && leadName !== customerName ? leadName : '',
    leadId: q.leadId,
    leadName,
    advisorName: q.createdBy?.name ?? '—',
    currency: 'GTQ',
    issuedAt: q.creadoEn,
    validUntil: q.validUntil ?? '',
    items: (q.items ?? []).map(toItem),
    subtotal: Number(q.subtotal),
    discount: Number(q.discount),
    adjustment: Number(q.adjustment ?? 0),
    tax: Number(q.tax ?? 0),
    taxPercent: Number(q.taxPercent ?? 0),
    total: Number(q.total),
    conditions: q.terms ?? '',
    notes: q.notes ?? '',
    paymentReference: q.paymentReference ?? null,
    aiGenerated: q.origin === 'AI',
    reviewRequired: q.status === 'DRAFT' || q.status === 'PENDING_APPROVAL',
  }
}

/** 'YYYY-MM-DD' → ISO al final de ese día (hora local). */
function endOfDayIso(date: string): string | null {
  if (!date) return null
  const d = new Date(`${date.slice(0, 10)}T23:59:59`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const orNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null)

export interface SimulatedPaymentInput {
  brand: 'VISA' | 'MASTERCARD'
  lastFourDigits: string
  installments: number
}

export interface RecurrenteAvailability {
  available: boolean
  reason: 'MISSING_KEY' | 'INVALID_KEY' | 'NOT_SANDBOX' | 'UNREACHABLE' | null
  message: string | null
}

export interface RecurrenteCheckout {
  checkoutId: string
  checkoutUrl: string
  amountInCents: number
  currency: string
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  paidAt: string | null
  createdAt: string
}

export interface RecurrenteVerification {
  outcome: 'PAID' | 'PENDING' | 'IN_PROGRESS' | 'EXPIRED'
  message: string
  transitioned: boolean
  checkout: RecurrenteCheckout
  quote: Quote
}

export interface QuoteListParams {
  search?: string
  /** Estado de la UI (borrador…) o de la API (DRAFT…) */
  status?: string
  leadId?: string
  clientId?: string
  page?: number
  pageSize?: number
}

async function listRaw(params: QuoteListParams) {
  return http.get<ApiQuotesPage>(pp('/quotes'), {
    params: {
      search: params.search?.trim(),
      status: toApiStatus(params.status ?? ''),
      leadId: params.leadId,
      clientId: params.clientId,
      sortBy: 'createdAt',
      order: 'desc',
      page: params.page ?? 1,
      limit: Math.min(params.pageSize ?? 20, 100),
    },
  })
}

const countOf = async (status?: ApiQuoteStatus) => {
  const res = await http.get<ApiQuotesPage>(pp('/quotes'), { params: { status, page: 1, limit: 1 } })
  return { total: res.meta.total, sum: Number(res.meta.sumTotal ?? 0) }
}

/* ───────────── Servicio ───────────── */

export const quotesService = {
  list: async (params: QuoteListParams = {}): Promise<Paginated<Quote>> => {
    const res = await listRaw(params)
    return {
      data: res.data.map(toQuote),
      meta: { page: res.meta.page, pageSize: res.meta.limit, total: res.meta.total },
    }
  },

  /** No hay endpoint de resumen: se cuenta por estado con listados de 1 elemento (meta.total / meta.sumTotal). */
  summary: async (): Promise<QuoteSummary> => {
    const [all, drafts, pending, approved, sent, accepted, paid] = await Promise.all([
      countOf(),
      countOf('DRAFT'),
      countOf('PENDING_APPROVAL'),
      countOf('APPROVED'),
      countOf('SENT'),
      countOf('ACCEPTED'),
      countOf('PAID'),
    ])
    return {
      drafts: drafts.total,
      pending: pending.total,
      sent: sent.total,
      approved: approved.total + accepted.total + paid.total,
      totalCount: all.total,
      totalValue: all.sum,
    }
  },

  /**
   * Borrador con IA (POST /assistant/quote-draft). La API ya lo GUARDA en DRAFT
   * con origin = AI; basta con abrirlo. Con solo clientId usa el lead más reciente del cliente.
   */
  aiDraft: async (input: { leadId?: string; customerId?: string; prompt?: string }): Promise<AiQuoteDraftResult> => {
    const res = await http.post<{ quoteId: string; folio: string; summary: string; warnings: string[] }>(pp('/assistant/quote-draft'), {
      leadId: input.leadId || undefined,
      clientId: input.leadId ? undefined : input.customerId || undefined,
      instructions: input.prompt?.trim() ?? '',
    })
    return { id: res.quoteId, folio: res.folio, summary: res.summary ?? '', warnings: res.warnings ?? [] }
  },

  get: async (id: string) => toQuote(await http.get<ApiQuote>(pp(`/quotes/${id}`))),

  /**
   * La API siempre crea en DRAFT. Con status 'pendiente' se envía después a
   * aprobación; si ese segundo paso falla se devuelve el borrador (apiStatus = DRAFT).
   */
  create: async (input: QuoteInput): Promise<Quote> => {
    const created = await http.post<ApiQuote>(pp('/quotes'), {
      leadId: input.leadId,
      ...(input.customerId ? { clientId: input.customerId } : {}),
      validUntil: endOfDayIso(input.validUntil),
      notes: orNull(input.notes),
      terms: orNull(input.conditions),
      adjustment: Math.max(0, Math.round((Number(input.discount) || 0) * 100) / 100),
      items: input.items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        discountPercent: Number(it.discountPercent) || 0,
        ...(it.description?.trim() ? { description: it.description.trim() } : {}),
      })),
    })
    if (input.status === 'pendiente') {
      try {
        return toQuote(await http.patch<ApiQuote>(pp(`/quotes/${created.id}/status`), { status: 'PENDING_APPROVAL' }))
      } catch {
        return toQuote(created)
      }
    }
    return toQuote(created)
  },

  /**
   * PATCH /quotes/:id/status. Transiciones válidas en la API:
   * DRAFT→PENDING_APPROVAL→APPROVED→SENT→ACCEPTED→PAID; PENDING_APPROVAL→DRAFT; SENT→REJECTED.
   * APPROVED y PAID exigen rol Propietario/Administrador.
   */
  updateStatus: async (id: string, status: QuoteStatus | ApiQuoteStatus) =>
    toQuote(await http.patch<ApiQuote>(pp(`/quotes/${id}/status`), { status: toApiStatus(status) })),

  /** POST /quotes/:id/simulated-payment: pago simulado (ACCEPTED → PAID). Solo viajan marca, últimos 4 dígitos y cuotas. */
  simulatePayment: async (id: string, input: SimulatedPaymentInput) =>
    toQuote(await http.post<ApiQuote>(pp(`/quotes/${id}/simulated-payment`), input)),

  recurrenteAvailability: () => http.get<RecurrenteAvailability>(pp('/recurrente-sandbox/availability')),

  recurrenteCheckout: async (id: string) =>
    (await http.get<{ checkout: RecurrenteCheckout | null }>(pp(`/quotes/${id}/recurrente/checkout`))).checkout,

  createRecurrenteCheckout: (id: string) => http.post<RecurrenteCheckout>(pp(`/quotes/${id}/recurrente/checkout`)),

  verifyRecurrentePayment: async (id: string): Promise<RecurrenteVerification> => {
    const result = await http.post<Omit<RecurrenteVerification, 'quote'> & { quote: ApiQuote }>(pp(`/quotes/${id}/recurrente/verify`))
    return { ...result, quote: toQuote(result.quote) }
  },

  /** Envía el PDF por correo (APPROVED → SENT, o reenvío si ya está SENT). Sin `to` usa el correo del cliente o del lead. */
  send: async (id: string, input: { to?: string; message?: string } = {}) =>
    toQuote(
      await http.post<ApiQuote>(pp(`/quotes/${id}/send`), {
        ...(input.to?.trim() ? { to: input.to.trim() } : {}),
        ...(input.message?.trim() ? { message: input.message.trim() } : {}),
      }),
    ),

  /** Descarga (o abre en otra pestaña) el PDF generado por la API. */
  pdf: (id: string, folio: string, open = false) =>
    http.download(pp(`/quotes/${id}/pdf${open ? '' : '?download=true'}`), `${folio || 'cotizacion'}.pdf`, open),

  /** Solo borradores (DRAFT). */
  remove: (id: string) => http.delete<void>(pp(`/quotes/${id}`)),

  /** Leads para el selector de Nueva cotización (la API exige leadId). */
  leadOptions: async (params: { search?: string; clientId?: string } = {}): Promise<QuoteLeadOption[]> => {
    const res = await http.get<ApiPaginated<ApiLead>>(pp('/leads'), {
      params: { search: params.search?.trim(), clientId: params.clientId, sortBy: 'updatedAt', order: 'desc', page: 1, limit: 100 },
    })
    return res.data.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company ?? '',
      email: l.email ?? '',
      phone: l.phone ?? '',
      clientId: l.clientId,
      clientName: l.client?.name ?? null,
    }))
  },

  /** IVA, vigencia y condiciones por defecto de la empresa (GET /projects/:id). */
  settings: async (): Promise<QuoteSettings> => {
    const project = await http.get<{ quoteSettings?: Partial<QuoteSettings> | null }>(pp(''))
    const s = project.quoteSettings ?? {}
    return {
      taxPercent: Number(s.taxPercent ?? 12),
      validityDays: Number(s.validityDays ?? 30),
      defaultTerms: s.defaultTerms ?? null,
      currency: s.currency ?? 'GTQ',
    }
  },
}
