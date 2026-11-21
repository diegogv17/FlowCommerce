import type { DashboardSummary, LeadStatus, QuoteStatus } from '@/types/domain'
import { http, pp, type ApiPaginated } from './http'
import { STAGE_TO_STATUS, toActivityItem, type ApiActivityEvent, type ApiFollowUp, type ApiLeadStage } from './mappers/leads'

/* ───────────── Forma de GET /projects/:id/dashboard ───────────── */

type ApiQuoteStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'PAID' | 'REJECTED'

interface ApiPeriodTotals {
  ventas: number
  cotizacionesPagadas: number
  cotizacionesEnviadas: number
  leadsCreados: number
  leadsGanados: number
  /** 0..1 */
  conversion: number
}

interface ApiDashboard {
  summary: {
    leadsActivos: number
    cotizacionesEnRevision: number
    /** Conteo de leads en WON (no es dinero) */
    ganado: number
    pipeline: number
    seguimientosPendientes: number
    seguimientosVencidos: number
  }
  leads: { porEstado: Record<ApiLeadStage, number> }
  quotes: { porEstado: Record<ApiQuoteStatus, number> }
  sales: { porEstado: Record<ApiQuoteStatus, number>; porPeriodo: Array<{ periodo: string; total: number }> }
  conversion: { porPeriodo: Array<{ periodo: string; creados: number; ganados: number; conversion: number }> }
  periodo: {
    from: string
    to: string
    actual: ApiPeriodTotals
    anterior: ApiPeriodTotals & { from: string; to: string }
    /** Variación % (null si el período anterior es 0) */
    variacion: { ventas: number | null; cotizacionesEnviadas: number | null; leadsCreados: number | null }
  } | null
}

/* ───────────── Helpers ───────────── */

const QUOTE_TO_STATUS: Record<ApiQuoteStatus, QuoteStatus> = {
  DRAFT: 'borrador',
  PENDING_APPROVAL: 'pendiente',
  APPROVED: 'aprobada',
  SENT: 'enviada',
  ACCEPTED: 'aprobada',
  PAID: 'aprobada',
  REJECTED: 'rechazada',
}

const LEAD_ORDER: ApiLeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
const QUOTE_ORDER: QuoteStatus[] = ['borrador', 'pendiente', 'enviada', 'aprobada', 'rechazada']
const MONTHS = 8

const FOLLOW_UP_TYPE: Record<string, DashboardSummary['todayFollowUps'][number]['type']> = {
  CALL: 'llamada',
  MEETING: 'reunion',
  WHATSAPP: 'whatsapp',
  EMAIL: 'correo',
  TASK: 'tarea',
}

const monthFmt = new Intl.DateTimeFormat('es-GT', { month: 'short', timeZone: 'UTC' })
const timeFmt = new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false })

/** Primer día (UTC) del mes desplazado `offset` meses respecto al actual. */
function monthStart(offset: number): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
}

const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
const monthLabel = (d: Date) => {
  const label = monthFmt.format(d).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Últimos N meses (el actual incluido), en orden ascendente. */
function lastMonths(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => monthStart(i - n + 1))
}

const round1 = (n: number) => Math.round(n * 10) / 10

function startOfToday(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/* ───────────── Servicio ───────────── */

export const dashboardService = {
  /**
   * Combina varias lecturas reales de la API:
   *  - GET /dashboard (histórico de 8 meses) → gráficas y conteos.
   *  - GET /dashboard?from&to (mes en curso) → variaciones contra el mes anterior.
   *  - GET /follow-ups (vencen hoy) y GET /activity (recientes).
   * Lo que la API no tiene (meta de ventas, variación de algunos KPI) se deja
   * vacío y la pantalla oculta ese dato.
   */
  async summary(): Promise<DashboardSummary> {
    const months = lastMonths(MONTHS)
    const rangeFrom = months[0].toISOString()
    const nextMonth = monthStart(1).toISOString()
    const thisMonth = monthStart(0).toISOString()
    const today = startOfToday()
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const [history, current, followUps, activity] = await Promise.all([
      http.get<ApiDashboard>(pp('/dashboard'), { params: { from: rangeFrom, to: nextMonth } }),
      http.get<ApiDashboard>(pp('/dashboard'), { params: { from: thisMonth, to: nextMonth } }).catch(() => null),
      http
        .get<ApiPaginated<ApiFollowUp>>(pp('/follow-ups'), {
          params: { dueFrom: today.toISOString(), dueTo: tomorrow.toISOString(), limit: 50 },
        })
        .catch(() => null),
      http.get<ApiPaginated<ApiActivityEvent>>(pp('/activity'), { params: { limit: 9 } }).catch(() => null),
    ])

    const s = history.summary
    const period = current?.periodo ?? null

    // Leads por estado (foto actual, las 7 etapas)
    const leadsByStatus = LEAD_ORDER.map((stage) => ({
      status: STAGE_TO_STATUS[stage] as LeadStatus,
      count: history.leads.porEstado?.[stage] ?? 0,
    }))

    // Cotizaciones por estado (agrupadas a los 5 estados de la interfaz)
    const quoteCounts = new Map<QuoteStatus, number>(QUOTE_ORDER.map((q) => [q, 0]))
    for (const [api, count] of Object.entries(history.quotes.porEstado ?? {}) as Array<[ApiQuoteStatus, number]>) {
      const ui = QUOTE_TO_STATUS[api]
      if (ui) quoteCounts.set(ui, (quoteCounts.get(ui) ?? 0) + (count ?? 0))
    }
    const quotesByStatus = QUOTE_ORDER.map((status) => ({ status, count: quoteCounts.get(status) ?? 0 }))

    // Series mensuales: la API solo devuelve meses con datos; se rellenan con 0.
    const sales = new Map(history.sales.porPeriodo.map((r) => [r.periodo, Number(r.total) || 0]))
    const conv = new Map(history.conversion.porPeriodo.map((r) => [r.periodo, r.conversion]))
    const salesByPeriod = months.map((m) => ({ label: monthLabel(m), sales: sales.get(monthKey(m)) ?? 0 }))
    const monthlyConversion = months.map((m) => ({ label: monthLabel(m), value: round1((conv.get(monthKey(m)) ?? 0) * 100) }))
    const salesTotal = salesByPeriod.reduce((a, b) => a + b.sales, 0)

    const conversionNow = period ? round1(period.actual.conversion * 100) : monthlyConversion[monthlyConversion.length - 1].value
    const conversionDelta = period ? round1((period.actual.conversion - period.anterior.conversion) * 100) : null

    const todayFollowUps: DashboardSummary['todayFollowUps'] = (followUps?.data ?? [])
      .filter((f) => f.status !== 'CANCELLED')
      .map((f) => ({
        id: f.id,
        leadId: f.leadId,
        leadName: f.lead?.name ?? 'Lead',
        company: '',
        title: f.title,
        time: timeFmt.format(new Date(f.dueAt)),
        type: FOLLOW_UP_TYPE[f.type] ?? 'tarea',
        ownerName: f.assignedUser?.name ?? 'Sin asignar',
        status: f.status === 'DONE' ? 'realizado' : 'pendiente',
      }))

    return {
      kpis: {
        activeLeads: { value: s.leadsActivos, delta: null },
        pendingFollowUps: {
          value: s.seguimientosPendientes,
          delta: null,
          hint: s.seguimientosVencidos > 0 ? `${s.seguimientosVencidos} vencidos` : 'Ninguno vencido',
        },
        sentQuotes: period
          ? { value: period.actual.cotizacionesEnviadas, delta: period.variacion.cotizacionesEnviadas, hint: 'Este mes' }
          : { value: 0, delta: null, hint: 'Este mes' },
        wonSales: { value: s.ganado, delta: null, hint: 'Leads ganados' },
        conversion: { value: conversionNow, delta: conversionDelta, hint: 'Leads creados este mes' },
        estimatedPipeline: { value: Number(s.pipeline) || 0, delta: null, hint: 'Leads activos, antes de IVA' },
      },
      leadsByStatus,
      monthlyConversion,
      quotesByStatus,
      periodLabel: 'Estado actual',
      salesByPeriod,
      salesTotal,
      todayFollowUps,
      recentActivity: (activity?.data ?? []).map(toActivityItem),
      sections: { followUps: followUps !== null, activity: activity !== null },
    }
  },
}
