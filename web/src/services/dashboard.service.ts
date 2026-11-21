import type { DashboardSummary } from '@/types/domain'
import { http } from './http'

export const dashboardService = {
  summary: () => http.get<DashboardSummary>('/dashboard/summary'),
}
