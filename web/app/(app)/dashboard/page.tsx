'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarCheck, CircleCheck, Clock, FileText, Plus, TrendingUp, Users, Wallet } from 'lucide-react';
import { Button, ErrorState, Select, Skeleton, StatCard } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { useMe } from '@/hooks/use-session';
import { useProject } from '@/hooks/use-project';
import { CreateLeadDialog } from '@/features/leads/lead-form-dialog';
import { FollowUpDialog } from '@/features/leads/follow-up-dialog';
import { ChartSkeleton, ConversionCard, LeadsByStageCard, QuotesDonutCard, SalesCard, type SalesPoint } from '@/features/dashboard/charts';
import { PERIOD_OPTIONS, monthsInRange, periodRange, useDashboard } from '@/features/dashboard/hooks';
import type { ConversionByPeriod, DateRange, PeriodKey } from '@/features/dashboard/types';

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** "+12%" / "-3%" (variación que da el backend). */
function pct(value: number | null | undefined) {
  if (value == null) return null;
  return `${value >= 0 ? '+' : ''}${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function diff(value: number) {
  return `${value >= 0 ? '+' : ''}${formatNumber(value)}`;
}

/** Últimos `count` meses YYYY-MM que terminan en el mes de `to` (exclusivo). */
function lastMonths(to: string, count: number): string[] {
  const end = new Date(to);
  end.setMilliseconds(end.getMilliseconds() - 1);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(end.getFullYear(), end.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const { can } = useProject();
  const [period, setPeriod] = useState<PeriodKey>('this-month');
  const [newLead, setNewLead] = useState(false);
  const [followUp, setFollowUp] = useState(false);

  const range = useMemo<DateRange>(() => periodRange(period), [period]);
  const current = useDashboard(range);
  const data = current.data;
  const periodo = data?.periodo ?? null;

  // Para comparar las ventas mes a mes con el período anterior.
  const previousRange = periodo ? { from: periodo.anterior.from, to: periodo.anterior.to } : null;
  const previous = useDashboard(previousRange, { enabled: !!previousRange });
  // Rangos cortos (1 mes) muestran la tendencia de los últimos 6 meses con el histórico.
  const rangeMonths = monthsInRange(range);
  const useHistory = rangeMonths.length < 3;
  const history = useDashboard(null, { enabled: useHistory });

  const trendMonths = useHistory ? lastMonths(range.to, 6) : rangeMonths;
  const trendSource = useHistory ? history.data : data;

  const salesPoints: SalesPoint[] = useMemo(() => {
    const totals = new Map((trendSource?.sales.porPeriodo ?? []).map((row) => [row.periodo, row.total]));
    const prevMonths = previousRange ? monthsInRange(previousRange) : [];
    const prevTotals = new Map((previous.data?.sales.porPeriodo ?? []).map((row) => [row.periodo, row.total]));
    return trendMonths.map((month, index) => ({
      periodo: month,
      total: totals.get(month) ?? 0,
      // Solo se compara mes a mes cuando el gráfico es el propio rango.
      anterior: !useHistory && previous.data && prevMonths[index] ? prevTotals.get(prevMonths[index]!) ?? 0 : null,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendSource, previous.data, trendMonths.join(), useHistory]);

  const conversionPoints: ConversionByPeriod[] = useMemo(() => {
    const rows = new Map((trendSource?.conversion.porPeriodo ?? []).map((row) => [row.periodo, row]));
    return trendMonths.map((month) => rows.get(month) ?? { periodo: month, creados: 0, ganados: 0, conversion: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendSource, trendMonths.join()]);

  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? '';
  const firstName = me?.name?.split(' ')[0] ?? '';
  const conversionDelta = periodo ? (periodo.actual.conversion - periodo.anterior.conversion) * 100 : null;
  const salesTotal = periodo ? periodo.actual.ventas : salesPoints.reduce((acc, row) => acc + row.total, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted">Aquí tienes el resumen de tu actividad comercial.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can('LEAD_CREATE') ? (
            <Button onClick={() => setNewLead(true)}>
              <Plus className="h-4 w-4" /> Nuevo Lead
            </Button>
          ) : null}
          {can('QUOTE_CREATE') ? (
            <Link href="/cotizaciones/nueva">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Nueva Cotización
              </Button>
            </Link>
          ) : null}
          {can('LEAD_UPDATE') ? (
            <Button variant="secondary" onClick={() => setFollowUp(true)}>
              <Plus className="h-4 w-4" /> Registrar Seguimiento
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-end gap-2">
        <label htmlFor="dashboard-period" className="text-sm text-muted">
          Período
        </label>
        <Select id="dashboard-period" value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="w-auto min-w-44">
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {current.isError && !data ? (
        <ErrorState message={errorMessage(current.error)} onRetry={() => current.refetch()} />
      ) : null}

      {/* Tarjetas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {!data ? (
          Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Leads activos"
              value={formatNumber(data.summary.leadsActivos)}
              icon={<Users className="h-4 w-4" />}
              iconClass="bg-brand-500"
              delta={periodo ? `${pct(periodo.variacion.leadsCreados) ?? diff(periodo.actual.leadsCreados)} nuevos` : null}
              deltaPositive={(periodo?.variacion.leadsCreados ?? 0) >= 0}
            />
            <StatCard
              label="Seguimientos pendientes"
              value={formatNumber(data.summary.seguimientosPendientes)}
              icon={<Clock className="h-4 w-4" />}
              iconClass="bg-amber-500"
            />
            <StatCard
              label="Cotizaciones enviadas"
              value={formatNumber(periodo ? periodo.actual.cotizacionesEnviadas : data.quotes.porEstado.SENT)}
              icon={<FileText className="h-4 w-4" />}
              iconClass="bg-violet-500"
              delta={periodo ? pct(periodo.variacion.cotizacionesEnviadas) : null}
              deltaPositive={(periodo?.variacion.cotizacionesEnviadas ?? 0) >= 0}
            />
            <StatCard
              label="Ventas ganadas"
              value={formatNumber(data.summary.ganado)}
              icon={<CircleCheck className="h-4 w-4" />}
              iconClass="bg-emerald-600"
              delta={periodo ? diff(periodo.actual.leadsGanados - periodo.anterior.leadsGanados) : null}
              deltaPositive={!periodo || periodo.actual.leadsGanados >= periodo.anterior.leadsGanados}
            />
            <StatCard
              label="Conversión"
              value={formatPercent((periodo ? periodo.actual.conversion : 0) * 100)}
              icon={<TrendingUp className="h-4 w-4" />}
              iconClass="bg-cyan-500"
              delta={conversionDelta != null ? `${conversionDelta >= 0 ? '+' : ''}${conversionDelta.toFixed(1)} pts` : null}
              deltaPositive={(conversionDelta ?? 0) >= 0}
            />
            <StatCard
              label="Pipeline estimado"
              value={formatMoney(data.summary.pipeline)}
              icon={<Wallet className="h-4 w-4" />}
              iconClass="bg-orange-500"
            />
          </>
        )}
      </div>
      {data && data.summary.seguimientosVencidos > 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
          <CalendarCheck className="h-3.5 w-3.5" />
          {data.summary.seguimientosVencidos} seguimiento(s) vencido(s).{' '}
          <Link href="/notificaciones" className="font-semibold underline">
            Revisar
          </Link>
        </p>
      ) : null}

      {/* Gráficas */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {!data ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton className="lg:col-span-3" />
          </>
        ) : (
          <>
            <LeadsByStageCard porEstado={data.leads.porEstado} caption="Hoy" />
            {useHistory && history.isLoading ? (
              <ChartSkeleton />
            ) : (
              <ConversionCard data={conversionPoints} headline={periodo?.actual.conversion ?? 0} deltaPts={conversionDelta} />
            )}
            <QuotesDonutCard porEstado={data.quotes.porEstado} />
            <div className="lg:col-span-3">
              {useHistory && history.isLoading ? (
                <ChartSkeleton />
              ) : (
                <SalesCard
                  data={salesPoints}
                  headline={salesTotal}
                  delta={periodo?.variacion.ventas ?? null}
                  caption={useHistory ? `${periodLabel} · tendencia de 6 meses` : periodLabel}
                />
              )}
            </div>
          </>
        )}
      </div>

      <CreateLeadDialog open={newLead} onClose={() => setNewLead(false)} navigateOnCreate />
      <FollowUpDialog open={followUp} onClose={() => setFollowUp(false)} />
    </div>
  );
}
