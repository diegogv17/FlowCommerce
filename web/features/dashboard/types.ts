import type { LeadStage, QuoteStatus } from '@flowcommerce/types';

// Contrato de GET /projects/:projectId/dashboard
// (src/dashboard/presentation/dto/dashboard.dto.ts). Los objetos porEstado
// traen siempre todas las claves (0 si no hay registros).

export interface DashboardSummary {
  /** NEW + CONTACTED + QUALIFIED + PROPOSAL + NEGOTIATION (foto actual). */
  leadsActivos: number;
  /** Cotizaciones PENDING_APPROVAL. */
  cotizacionesEnRevision: number;
  /** Cantidad de leads en WON. */
  ganado: number;
  /** Suma de estimatedValue de los leads activos (sin IVA). */
  pipeline: number;
  seguimientosPendientes: number;
  seguimientosVencidos: number;
}

export interface SalesByPeriod {
  /** YYYY-MM (UTC) del pago. */
  periodo: string;
  total: number;
}

export interface ConversionByPeriod {
  /** YYYY-MM (UTC) de creación del lead. */
  periodo: string;
  creados: number;
  ganados: number;
  /** ganados / creados (0..1). */
  conversion: number;
}

export interface PeriodTotals {
  ventas: number;
  cotizacionesPagadas: number;
  cotizacionesEnviadas: number;
  leadsCreados: number;
  leadsGanados: number;
  /** 0..1 */
  conversion: number;
}

export interface PeriodComparison {
  from: string;
  to: string;
  actual: PeriodTotals;
  anterior: PeriodTotals & { from: string; to: string };
  /** Variación % (null si el período anterior era 0). */
  variacion: {
    ventas: number | null;
    cotizacionesEnviadas: number | null;
    leadsCreados: number | null;
  };
}

export interface Dashboard {
  summary: DashboardSummary;
  leads: { porEstado: Record<LeadStage, number> };
  quotes: { porEstado: Record<QuoteStatus, number> };
  sales: { porEstado: Record<QuoteStatus, number>; porPeriodo: SalesByPeriod[] };
  conversion: { porPeriodo: ConversionByPeriod[] };
  /** Solo con ?from&to. */
  periodo: PeriodComparison | null;
}

export type PeriodKey = 'this-month' | 'last-month' | 'last-3-months' | 'this-year';

export interface DateRange {
  from: string;
  to: string;
}
