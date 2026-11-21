import type { ActivityItem, Lead, LeadFilters, LeadInput, LeadStatus, Paginated } from '@/types/domain'
import { http, pp, type ApiPaginated, type QueryParams } from './http'
import {
  STATUS_TO_STAGE,
  toActivityItem,
  toApiSource,
  toLead,
  type ApiActivityEvent,
  type ApiLead,
} from './mappers/leads'

/** La API acepta como máximo 100 elementos por página. */
const API_MAX_LIMIT = 100

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }

function listParams(f: LeadFilters): QueryParams {
  const days = f.period ? PERIOD_DAYS[f.period] : undefined
  return {
    search: f.search?.trim() || undefined,
    stage: f.status ? STATUS_TO_STAGE[f.status] : undefined,
    assignedUserId: f.ownerId || undefined,
    source: f.source ? toApiSource(f.source) : undefined,
    createdFrom: days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined,
    sortBy: f.sort === 'valor' ? 'estimatedValue' : 'createdAt',
    order: 'desc',
  }
}

/** Campos de LeadInput → body de la API. Solo incluye lo que viene definido (PATCH parcial). */
function toApiBody(input: Partial<LeadInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  const text = (v: string | undefined) => (v?.trim() ? v.trim() : null)
  if (input.name !== undefined) body.name = input.name.trim()
  if (input.company !== undefined) body.company = text(input.company)
  if (input.email !== undefined) body.email = text(input.email)
  if (input.phone !== undefined) body.phone = text(input.phone)
  if (input.source !== undefined) body.source = toApiSource(input.source)
  if (input.value !== undefined) body.estimatedValue = Number.isFinite(input.value) ? Math.round(input.value * 100) / 100 : null
  if (input.status !== undefined) body.stage = STATUS_TO_STAGE[input.status]
  // '' = sin responsable (en edición). En la creación, sin responsable queda sin asignar.
  if (input.ownerId !== undefined) body.assignedUserId = input.ownerId || null
  return body
}

async function list(filters: LeadFilters = {}): Promise<Paginated<Lead>> {
  const pageSize = filters.pageSize ?? 20
  const params = listParams(filters)

  // Pipeline (kanban) pide más de lo que la API sirve en una página: se juntan varias.
  if (pageSize > API_MAX_LIMIT) {
    const pages = Math.ceil(pageSize / API_MAX_LIMIT)
    const first = await http.get<ApiPaginated<ApiLead>>(pp('/leads'), { params: { ...params, page: 1, limit: API_MAX_LIMIT } })
    const rest = await Promise.all(
      Array.from({ length: Math.min(pages, first.meta.totalPages) - 1 }, (_, i) =>
        http.get<ApiPaginated<ApiLead>>(pp('/leads'), { params: { ...params, page: i + 2, limit: API_MAX_LIMIT } }),
      ),
    )
    const data = [first, ...rest].flatMap((r) => r.data).slice(0, pageSize).map(toLead)
    return { data, meta: { page: 1, pageSize, total: first.meta.total } }
  }

  const res = await http.get<ApiPaginated<ApiLead>>(pp('/leads'), {
    params: { ...params, page: filters.page ?? 1, limit: pageSize },
  })
  return { data: res.data.map(toLead), meta: { page: res.meta.page, pageSize: res.meta.limit, total: res.meta.total } }
}

export const leadsService = {
  list,
  get: async (id: string) => toLead(await http.get<ApiLead>(pp(`/leads/${id}`))),
  /** Pestaña Actividad: historial del lead, más reciente primero. */
  activity: async (id: string): Promise<ActivityItem[]> => {
    const res = await http.get<ApiPaginated<ApiActivityEvent>>(pp('/activity'), { params: { leadId: id, limit: 50 } })
    return res.data.map(toActivityItem)
  },
  create: async (input: LeadInput) => {
    const body = toApiBody(input)
    if (!body.assignedUserId) delete body.assignedUserId
    return toLead(await http.post<ApiLead>(pp('/leads'), body))
  },
  update: async (id: string, input: Partial<LeadInput>) => toLead(await http.patch<ApiLead>(pp(`/leads/${id}`), toApiBody(input))),
  /** El cambio de etapa es un PATCH del lead con `stage`. */
  updateStatus: async (id: string, status: LeadStatus) =>
    toLead(await http.patch<ApiLead>(pp(`/leads/${id}`), { stage: STATUS_TO_STAGE[status] })),
  /** Borrado definitivo (solo ADMIN/OWNER). Arrastra cotizaciones y mensajes del lead. */
  remove: (id: string) => http.delete<void>(pp(`/leads/${id}`)),
}
