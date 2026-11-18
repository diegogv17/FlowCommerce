'use client';

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LeadStage, QuoteStatus } from '@flowcommerce/types';
import { Card, CardHeader, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { LEAD_STAGES, QUOTE_STATUSES, quoteStatusInfo } from '@/lib/labels';
import { monthLabel } from './hooks';
import type { ConversionByPeriod } from './types';

const AXIS_TICK = { fontSize: 11, fill: '#64748b' };
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
  fontSize: 12,
};

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <Skeleton className="mb-4 h-5 w-40" />
      <Skeleton className="h-52 w-full" />
    </Card>
  );
}

/* --------------------------- Leads por estado --------------------------- */

export function LeadsByStageCard({ porEstado, caption }: { porEstado: Record<LeadStage, number>; caption?: string }) {
  const stages = LEAD_STAGES.filter((stage) => stage.value !== 'LOST');
  const max = Math.max(1, ...stages.map((stage) => porEstado[stage.value] ?? 0));
  return (
    <Card>
      <CardHeader title="Leads por estado" action={caption ? <span className="text-xs text-muted">{caption}</span> : null} />
      <ul className="space-y-3">
        {stages.map((stage) => {
          const value = porEstado[stage.value] ?? 0;
          return (
            <li key={stage.value} className="grid grid-cols-[96px_1fr_32px] items-center gap-3 text-sm">
              <span className="truncate text-ink">{stage.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                <span className={cn('block h-full rounded-full', stage.bar)} style={{ width: `${(value / max) * 100}%` }} />
              </span>
              <span className="text-right font-semibold">{formatNumber(value)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">Perdidos: {formatNumber(porEstado.LOST ?? 0)}</p>
    </Card>
  );
}

/* --------------------------- Conversión mensual -------------------------- */

export function ConversionCard({
  data,
  headline,
  deltaPts,
}: {
  data: ConversionByPeriod[];
  /** 0..1 */
  headline: number;
  deltaPts?: number | null;
}) {
  const rows = data.map((row, index) => ({
    label: monthLabel(row.periodo),
    value: Math.round(row.conversion * 1000) / 10,
    creados: row.creados,
    ganados: row.ganados,
    last: index === data.length - 1,
  }));
  return (
    <Card>
      <CardHeader
        title="Conversión mensual"
        action={
          deltaPts != null ? (
            <span className={cn('text-xs font-semibold', deltaPts >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
              {deltaPts >= 0 ? '+' : ''}
              {deltaPts.toFixed(1)} pts
            </span>
          ) : null
        }
      />
      <p className="font-display text-3xl font-semibold">{formatPercent(headline * 100)}</p>
      <div className="mt-3 h-40">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Sin leads en el período</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, _name, item) => {
                  const payload = (item as { payload?: { creados: number; ganados: number } }).payload;
                  return [`${String(value)}% (${payload?.ganados ?? 0} de ${payload?.creados ?? 0})`, 'Conversión'];
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {rows.map((row) => (
                  <Cell key={row.label} fill={row.last ? '#10b981' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* ------------------------- Cotizaciones por estado ------------------------ */

export function QuotesDonutCard({ porEstado }: { porEstado: Record<QuoteStatus, number> }) {
  const rows = QUOTE_STATUSES.map((status) => ({
    status: status.value,
    label: quoteStatusInfo(status.value).label,
    color: status.chart,
    value: porEstado[status.value] ?? 0,
  })).filter((row) => row.value > 0);
  const total = rows.reduce((acc, row) => acc + row.value, 0);

  return (
    <Card>
      <CardHeader title="Cotizaciones por estado" />
      {total === 0 ? (
        <EmptyState title="Sin cotizaciones" description="No hay cotizaciones creadas en el período." />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="100%"
                  paddingAngle={rows.length > 1 ? 2 : 0}
                  stroke="#fff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {rows.map((row) => (
                    <Cell key={row.status} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [formatNumber(Number(value)), String(name)]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-semibold">{formatNumber(total)}</span>
              <span className="text-[11px] text-muted">total</span>
            </div>
          </div>
          <ul className="w-full space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.status} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
                <span className="flex-1 text-ink">{row.label}</span>
                <span className="font-semibold">{formatNumber(row.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* --------------------------- Ventas por período --------------------------- */

export interface SalesPoint {
  periodo: string;
  total: number;
  /** Total del mes equivalente del período anterior (si se compara). */
  anterior?: number | null;
}

export function SalesCard({
  data,
  headline,
  caption,
  delta,
  currency,
}: {
  data: SalesPoint[];
  headline: number;
  caption?: string;
  delta?: number | null;
  currency?: string;
}) {
  const rows = data.map((row) => ({ ...row, label: monthLabel(row.periodo) }));
  const hasPrevious = rows.some((row) => row.anterior != null);
  return (
    <Card>
      <CardHeader title="Ventas por período" action={caption ? <span className="text-xs text-muted">{caption}</span> : null} />
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="font-display text-3xl font-semibold">{formatMoney(headline, currency)}</p>
        {delta != null ? (
          <span className={cn('text-xs font-semibold', delta >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)}% vs período anterior
          </span>
        ) : null}
      </div>
      <div className="mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fc-sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value: number) => (value >= 1000 ? `Q${Math.round(value / 1000)}k` : `Q${value}`)}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [formatMoney(Number(value), currency), name === 'anterior' ? 'Período anterior' : 'Ventas']}
            />
            <Area type="monotone" dataKey="total" name="total" stroke="#10b981" strokeWidth={2} fill="url(#fc-sales-fill)" dot={rows.length === 1} />
            {hasPrevious ? (
              <Line type="monotone" dataKey="anterior" name="anterior" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-emerald-500" /> Ventas (cotizaciones pagadas)
        </span>
        {hasPrevious ? (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-slate-500" /> Período anterior
          </span>
        ) : null}
      </div>
    </Card>
  );
}
