import type { Customer, CustomerInput, CustomersSummary, Paginated, Quote } from '@/types/domain'
import { http } from './http'

export const customersService = {
  list: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    http.get<Paginated<Customer>>('/customers', { params }),
  summary: () => http.get<CustomersSummary>('/customers/summary'),
  get: (id: string) => http.get<Customer>(`/customers/${id}`),
  create: (input: CustomerInput) => http.post<Customer>('/customers', input),
  update: (id: string, input: Partial<CustomerInput>) => http.patch<Customer>(`/customers/${id}`, input),
  quotes: (id: string) => http.get<Quote[]>(`/customers/${id}/quotes`),
}
