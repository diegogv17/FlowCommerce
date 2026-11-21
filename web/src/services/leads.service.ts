import type { ActivityItem, Lead, LeadFilters, LeadInput, LeadStatus, Paginated } from '@/types/domain'
import { http } from './http'

export const leadsService = {
  list: (filters: LeadFilters = {}) => http.get<Paginated<Lead>>('/leads', { params: { ...filters } }),
  get: (id: string) => http.get<Lead>(`/leads/${id}`),
  activity: (id: string) => http.get<ActivityItem[]>(`/leads/${id}/activity`),
  create: (input: LeadInput) => http.post<Lead>('/leads', input),
  update: (id: string, input: Partial<LeadInput>) => http.patch<Lead>(`/leads/${id}`, input),
  updateStatus: (id: string, status: LeadStatus) => http.patch<Lead>(`/leads/${id}/status`, { status }),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/leads/${id}`),
}
