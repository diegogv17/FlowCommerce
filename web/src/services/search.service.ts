import type { LeadStatus } from '@/types/domain'
import { http, pp } from './http'
import { STAGE_TO_STATUS, type ApiLeadStage } from './mappers/leads'

/** Búsqueda global (GET /projects/:id/search): leads, clientes y cotizaciones. */
interface ApiSearchResults {
  leads: Array<{ id: string; name: string; company: string | null; stage: ApiLeadStage }>
  clients: Array<{ id: string; name: string; company: string | null; taxId: string | null }>
  quotes: Array<{ id: string; folio: string; status: string; total: number; customerName: string }>
}

export interface SearchResults {
  leads: Array<{ id: string; name: string; company: string; status: LeadStatus }>
  clients: Array<{ id: string; name: string; company: string; nit: string }>
  quotes: Array<{ id: string; folio: string; customerName: string; total: number }>
}

export const searchService = {
  /** La API exige al menos 2 caracteres. */
  async search(q: string, limit = 5): Promise<SearchResults> {
    const res = await http.get<ApiSearchResults>(pp('/search'), { params: { q: q.trim(), limit } })
    return {
      leads: res.leads.map((l) => ({ id: l.id, name: l.name, company: l.company ?? '', status: STAGE_TO_STATUS[l.stage] ?? 'nuevo' })),
      clients: res.clients.map((c) => ({ id: c.id, name: c.name, company: c.company ?? '', nit: c.taxId ?? '' })),
      quotes: res.quotes.map((q) => ({ id: q.id, folio: q.folio, customerName: q.customerName, total: Number(q.total) || 0 })),
    }
  },
}
