import type { Paginated, Quote, QuoteInput, QuoteStatus, QuoteSummary } from '@/types/domain'
import { http } from './http'

export const quotesService = {
  list: (params: { search?: string; status?: string; page?: number; pageSize?: number } = {}) =>
    http.get<Paginated<Quote>>('/quotes', { params }),
  summary: () => http.get<QuoteSummary>('/quotes/summary'),
  aiDraft: (input: { customerId: string; prompt?: string }) => http.post<Quote>('/quotes/ai-draft', input),
  get: (id: string) => http.get<Quote>(`/quotes/${id}`),
  create: (input: QuoteInput) => http.post<Quote>('/quotes', input),
  updateStatus: (id: string, status: QuoteStatus) => http.patch<Quote>(`/quotes/${id}/status`, { status }),
}
