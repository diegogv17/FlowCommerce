'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import type { LeadStage } from '@flowcommerce/types';
import { Avatar, ErrorState, Skeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { stageInfo } from '@/lib/labels';
import { useProject } from '@/hooks/use-project';
import { PIPELINE_STAGES, useMoveLeadStage, usePipelineLeads } from './hooks';
import type { Lead, LeadFilters } from './types';
import { formatDueDate } from './utils';

const DRAG_TYPE = 'application/x-flowcommerce-lead';

/**
 * Kanban por etapa (sin LOST). Arrastrar y soltar con la API nativa de HTML5;
 * al soltar hace PATCH {stage} con actualización optimista (ver useMoveLeadStage).
 */
export function PipelineBoard({ filters, currency }: { filters: Omit<LeadFilters, 'stages'>; currency?: string }) {
  const { can } = useProject();
  const canMove = can('LEAD_UPDATE');
  const { data, isLoading, isError, error, refetch } = usePipelineLeads(filters);
  const move = useMoveLeadStage();
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const columns = useMemo(() => {
    const byStage = new Map<LeadStage, Lead[]>(PIPELINE_STAGES.map((stage): [LeadStage, Lead[]] => [stage, []]));
    for (const lead of data?.data ?? []) byStage.get(lead.stage)?.push(lead);
    return PIPELINE_STAGES.map((stage) => {
      const leads = byStage.get(stage) ?? [];
      return { stage, leads, total: leads.reduce((acc, lead) => acc + Number(lead.estimatedValue ?? 0), 0) };
    });
  }, [data]);

  const drop = (stage: LeadStage, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(null);
    const leadId = event.dataTransfer.getData(DRAG_TYPE) || event.dataTransfer.getData('text/plain');
    const lead = data?.data.find((item) => item.id === leadId);
    if (!lead || lead.stage === stage) return;
    move.mutate(
      { leadId, stage },
      {
        onSuccess: () => toast.success(`${lead.name} → ${stageInfo(stage).label}`),
        onError: (err) => toast.error(`No se pudo mover: ${errorMessage(err)}`),
      },
    );
  };

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      {data && data.meta.total > data.data.length ? (
        <p className="mb-3 text-xs text-muted">
          Mostrando {data.data.length} de {data.meta.total} leads. Usa los filtros para acotar el tablero.
        </p>
      ) : null}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map(({ stage, leads, total }) => {
          const info = stageInfo(stage);
          return (
            <section
              key={stage}
              aria-label={`Etapa ${info.label}`}
              onDragOver={(event) => {
                if (!canMove) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (dragOver !== stage) setDragOver(stage);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(null);
              }}
              onDrop={(event) => drop(stage, event)}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/80 p-3 transition-colors',
                dragOver === stage && 'bg-brand-50 ring-2 ring-brand-500/40',
              )}
            >
              <header className="mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', info.bar)} />
                  <h3 className="text-sm font-semibold">{info.label}</h3>
                  <span className="rounded-full bg-white px-2 text-xs font-semibold text-muted">{leads.length}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">{formatMoney(total, currency)}</p>
              </header>

              <div className="flex min-h-24 flex-1 flex-col gap-2">
                {isLoading
                  ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)
                  : leads.map((lead) => (
                      <article
                        key={lead.id}
                        draggable={canMove}
                        onDragStart={(event) => {
                          event.dataTransfer.setData(DRAG_TYPE, lead.id);
                          event.dataTransfer.setData('text/plain', lead.id);
                          event.dataTransfer.effectAllowed = 'move';
                          setDragging(lead.id);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setDragOver(null);
                        }}
                        className={cn(
                          'rounded-xl border border-line/60 bg-white p-3 shadow-sm transition-opacity',
                          canMove && 'cursor-grab active:cursor-grabbing',
                          dragging === lead.id && 'opacity-50',
                        )}
                      >
                        <Link href={`/leads/${lead.id}`} className="block font-semibold text-ink hover:text-brand-600" draggable={false}>
                          {lead.name}
                        </Link>
                        <p className="truncate text-xs text-muted">{lead.company ?? lead.email ?? '—'}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {lead.estimatedValue != null ? formatMoney(lead.estimatedValue, currency) : '—'}
                          </span>
                          {lead.assignedUser ? <Avatar name={lead.assignedUser.name} size="sm" /> : null}
                        </div>
                        {lead.nextFollowUpAt ? (
                          <p
                            className={cn(
                              'mt-2 flex items-center gap-1 text-xs',
                              new Date(lead.nextFollowUpAt).getTime() < Date.now() ? 'text-rose-600' : 'text-muted',
                            )}
                          >
                            <CalendarClock className="h-3.5 w-3.5" /> {formatDueDate(lead.nextFollowUpAt)}
                          </p>
                        ) : null}
                      </article>
                    ))}
                {!isLoading && leads.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">Sin leads</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
