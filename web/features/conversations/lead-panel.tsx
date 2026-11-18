'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { quoteStatusInfo, sourceLabel, stageInfo } from '@/lib/labels';
import { useProject } from '@/hooks/use-project';
import { Avatar, Badge, Button, ErrorState, Skeleton } from '@/components/ui';
import { useLeadPanel, useLeadQuoteSummaries } from './hooks';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

/** Panel derecho de Conversaciones: datos del lead y sus cotizaciones. */
export function LeadPanel({
  leadId,
  onBack,
  className,
}: {
  leadId: string;
  /** Botón volver (solo en pantallas donde el panel ocupa la columna del chat). */
  onBack?: () => void;
  className?: string;
}) {
  const { can } = useProject();
  const { data: lead, isLoading, isError, error, refetch } = useLeadPanel(leadId);
  const quotes = useLeadQuoteSummaries(leadId);
  const stage = lead ? stageInfo(lead.stage) : null;

  return (
    <aside
      className={cn('flex min-h-0 flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-sm', className)}
      aria-label="Datos del lead"
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 self-start rounded-full px-2 py-1 text-sm text-muted hover:bg-slate-100 xl:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al chat
        </button>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
          <Skeleton className="mx-auto h-4 w-1/2" />
          <Skeleton className="h-32" />
        </div>
      ) : isError || !lead ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="flex flex-col items-center text-center">
            <Avatar name={lead.name} size="lg" className="rounded-2xl" />
            <p className="mt-3 text-base font-semibold text-ink">{lead.name}</p>
            {lead.company ? <p className="text-sm text-muted">{lead.company}</p> : null}
            {stage ? <Badge className={cn('mt-2', stage.color)}>{stage.label}</Badge> : null}
          </div>

          <dl className="mt-5">
            <Row label="Estado">{stage?.label ?? '—'}</Row>
            <Row label="Responsable">{lead.assignedUser?.name ?? 'Sin asignar'}</Row>
            <Row label="Valor estimado">
              {lead.estimatedValue !== null ? formatMoney(lead.estimatedValue) : '—'}
            </Row>
            <Row label="Último contacto">{formatDateTime(lead.lastContactAt)}</Row>
            <Row label="Próximo seguimiento">{formatDateTime(lead.nextFollowUpAt)}</Row>
            <Row label="Origen">{sourceLabel(lead.source)}</Row>
            {lead.phone ? <Row label="Teléfono">{lead.phone}</Row> : null}
          </dl>

          {can('QUOTE_READ') ? (
            <div className="mt-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Cotizaciones</h2>
              {quotes.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              ) : quotes.isError ? (
                <ErrorState message={errorMessage(quotes.error)} onRetry={() => void quotes.refetch()} />
              ) : (quotes.data?.data.length ?? 0) === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-muted">
                  Este lead aún no tiene cotizaciones.
                </p>
              ) : (
                <ul className="space-y-2">
                  {quotes.data?.data.map((quote) => {
                    const status = quoteStatusInfo(quote.status);
                    return (
                      <li key={quote.id}>
                        <Link
                          href={`/cotizaciones/${quote.id}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 transition-colors hover:bg-slate-50"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-ink">
                              <FileText className="h-3.5 w-3.5 text-muted" />
                              {quote.folio}
                            </span>
                            <span className="text-xs text-muted">{formatMoney(quote.total)}</span>
                          </span>
                          <Badge className={status.color}>{status.label}</Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {can('QUOTE_CREATE') ? (
            <Link href={`/cotizaciones/nueva?leadId=${lead.id}`} className="mt-4 block">
              <Button className="w-full">
                <Sparkles className="h-4 w-4" />
                Generar cotización
              </Button>
            </Link>
          ) : null}
        </>
      )}
    </aside>
  );
}
