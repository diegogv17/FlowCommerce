'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarClock, RefreshCw, Sparkles, Target } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { aiErrorMessage, isAiNotConfigured, useLeadInsight } from './hooks';

function probabilityColor(value: number) {
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function followUpLabel(days: number) {
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

/**
 * Tarjeta morada «Insight de IA» del detalle del lead (mockup Lead detalle).
 * Se carga bajo demanda con «Analizar» y queda en caché por lead.
 */
export function LeadInsightCard({ leadId }: { leadId: string }) {
  const [requested, setRequested] = useState(false);
  const insight = useLeadInsight(leadId, requested);
  const { data, error, isFetching } = insight;

  const header = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Insight de IA
      </p>
      {data ? (
        <button
          type="button"
          onClick={() => void insight.refetch()}
          disabled={isFetching}
          className="rounded-full p-1 text-violet-600 hover:bg-violet-100 disabled:opacity-50"
          aria-label="Volver a analizar con IA"
          title="Volver a analizar"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      ) : null}
    </div>
  );

  return (
    <section
      className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 text-sm text-ink"
      aria-label="Insight de IA del lead"
      aria-busy={isFetching}
    >
      {header}

      {!data && !isFetching && !error ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">
            Analiza la conversación, cotizaciones y seguimientos de este lead para estimar su probabilidad de cierre y
            sugerir el siguiente paso.
          </p>
          <Button variant="ai" size="sm" onClick={() => setRequested(true)}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Analizar
          </Button>
        </div>
      ) : null}

      {!data && isFetching ? (
        <div className="space-y-2" aria-live="polite">
          <p className="text-xs text-violet-700">Analizando el lead…</p>
          <Skeleton className="h-3 w-full bg-violet-200/60" />
          <Skeleton className="h-3 w-5/6 bg-violet-200/60" />
          <Skeleton className="h-3 w-2/3 bg-violet-200/60" />
        </div>
      ) : null}

      {error && !isFetching ? (
        <div className="space-y-3" role="alert">
          {isAiNotConfigured(error) ? (
            <p className="text-sm font-semibold text-violet-800">IA no configurada</p>
          ) : null}
          <p className={cn('text-sm', isAiNotConfigured(error) ? 'text-muted' : 'text-rose-700')}>
            {aiErrorMessage(error)}
          </p>
          {!isAiNotConfigured(error) ? (
            <Button variant="outline" size="sm" onClick={() => void insight.refetch()}>
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : null}

      {data ? (
        <div className={cn('space-y-3', isFetching && 'opacity-60')}>
          <p className="leading-relaxed">{data.summary}</p>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Probabilidad de cierre</span>
              <span className="font-semibold text-ink">{data.closeProbability}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-violet-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={data.closeProbability}
              aria-label="Probabilidad de cierre"
            >
              <div
                className={cn('h-full rounded-full transition-all', probabilityColor(data.closeProbability))}
                style={{ width: `${data.closeProbability}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg bg-white/80 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-violet-700">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Siguiente acción
            </p>
            <p>{data.nextBestAction}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Próximo seguimiento sugerido: {followUpLabel(data.suggestedFollowUpDays)}
            </p>
          </div>

          {data.risks.length > 0 ? (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Riesgos
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm">
                {data.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-[11px] text-muted">
            Generado {formatRelative(data.generatedAt)} · Es una estimación de la IA, revísala antes de actuar.
          </p>
        </div>
      ) : null}
    </section>
  );
}
