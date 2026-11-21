import type { Customer, CustomerInput, CustomersSummary, Paginated, Quote } from '@/types/domain'
import { http, pp, type ApiPaginated } from './http'
import { quotesService } from './quotes.service'

/** Cliente tal como lo devuelve la API (`name` es el contacto principal). */
interface ApiClient {
  id: string
  projectId: string
  name: string
  company: string | null
  contactPosition: string | null
  taxId: string | null
  email: string | null
  phone: string | null
  notes: string | null
  assignedUserId: string | null
  assignedUser: { id: string; name: string } | null
  sourceLeadId: string | null
  active: boolean
  creadoEn: string
  actualizadoEn: string
}

interface ApiClientStats {
  quotesCount: number
  paidQuotesCount: number
  salesTotal: number
  lastActivityAt: string | null
}

type ApiClientListItem = ApiClient & ApiClientStats

interface ApiClientsPage extends ApiPaginated<ApiClientListItem> {
  summary: { activeClients: number; billedThisYear: number }
}

/*
 * Mapeo UI ↔ API:
 *   Customer.name (razón social) ↔ company (si falta, el nombre del contacto)
 *   Customer.contactName ↔ name · contactRole ↔ contactPosition · nit ↔ taxId
 *   Customer.address: la API no tiene dirección → se guarda en notes como «Dirección: …».
 *   totalSold = ventas (cotizaciones PAID); averageTicket = ventas / cotizaciones pagadas.
 */
const ADDRESS_LINE = /^Direcci[oó]n:\s*(.*)$/m

function addressOf(notes: string | null): string {
  return notes?.match(ADDRESS_LINE)?.[1]?.trim() ?? ''
}

function notesWithAddress(notes: string | null | undefined, address: string): string | null {
  const rest = (notes ?? '').replace(ADDRESS_LINE, '').trim()
  const line = address.trim() ? `Dirección: ${address.trim()}` : ''
  const text = [line, rest].filter(Boolean).join('\n')
  return text || null
}

function toCustomer(c: ApiClient, stats?: ApiClientStats | null): Customer {
  const sold = Number(stats?.salesTotal ?? 0)
  const paid = Number(stats?.paidQuotesCount ?? 0)
  return {
    id: c.id,
    name: c.company?.trim() || c.name,
    nit: c.taxId ?? '',
    contactName: c.name,
    contactRole: c.contactPosition ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    address: addressOf(c.notes),
    ownerName: c.assignedUser?.name ?? 'Sin asignar',
    ownerId: c.assignedUserId,
    status: c.active ? 'activo' : 'inactivo',
    totalSold: sold,
    quotesCount: Number(stats?.quotesCount ?? 0),
    averageTicket: paid > 0 ? Math.round((sold / paid) * 100) / 100 : 0,
    lastActivityAt: stats?.lastActivityAt ?? c.actualizadoEn,
    createdAt: c.creadoEn,
    notes: c.notes ?? '',
  }
}

const orNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null)

function toApiBody(input: Partial<CustomerInput>, currentNotes?: string | null) {
  const body: Record<string, unknown> = {}
  if (input.contactName !== undefined) body.name = input.contactName.trim() || input.name?.trim()
  if (input.name !== undefined) body.company = orNull(input.name)
  if (input.contactRole !== undefined) body.contactPosition = orNull(input.contactRole)
  if (input.nit !== undefined) body.taxId = orNull(input.nit)
  if (input.email !== undefined) body.email = orNull(input.email)
  if (input.phone !== undefined) body.phone = orNull(input.phone)
  if (input.address !== undefined) body.notes = notesWithAddress(currentNotes, input.address)
  return body
}

export const customersService = {
  list: async (params: { search?: string; page?: number; pageSize?: number; active?: boolean } = {}): Promise<Paginated<Customer>> => {
    const res = await http.get<ApiClientsPage>(pp('/clients'), {
      params: { search: params.search?.trim(), active: params.active, page: params.page ?? 1, limit: Math.min(params.pageSize ?? 20, 100) },
    })
    return {
      data: res.data.map((c) => toCustomer(c, c)),
      meta: { page: res.meta.page, pageSize: res.meta.limit, total: res.meta.total },
    }
  },
  /** El listado trae el resumen de toda la cartera (no depende de filtros). */
  summary: async (): Promise<CustomersSummary> => {
    const res = await http.get<ApiClientsPage>(pp('/clients'), { params: { page: 1, limit: 1 } })
    return { active: res.summary?.activeClients ?? 0, billedThisYear: Number(res.summary?.billedThisYear ?? 0) }
  },
  get: async (id: string) => {
    const [client, stats] = await Promise.all([
      http.get<ApiClient>(pp(`/clients/${id}`)),
      http.get<ApiClientStats>(pp(`/clients/${id}/stats`)).catch(() => null),
    ])
    return toCustomer(client, stats)
  },
  create: async (input: CustomerInput) =>
    toCustomer(await http.post<ApiClient>(pp('/clients'), toApiBody(input))),
  update: async (id: string, input: Partial<CustomerInput>) => {
    // La dirección vive en notes: se conserva el resto de las notas.
    const current = input.address !== undefined ? await http.get<ApiClient>(pp(`/clients/${id}`)) : null
    return toCustomer(await http.patch<ApiClient>(pp(`/clients/${id}`), toApiBody(input, current?.notes)))
  },
  /** Cotizaciones del cliente (GET /quotes?clientId=…), más recientes primero. */
  quotes: async (id: string): Promise<Quote[]> =>
    (await quotesService.list({ clientId: id, page: 1, pageSize: 100 })).data,
}
