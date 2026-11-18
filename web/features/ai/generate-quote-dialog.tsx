'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Search, Sparkles, X } from 'lucide-react';
import { Button, Dialog, Input, Label, Spinner, Textarea } from '@/components/ui';
import { api, errorMessage, type Paginated } from '@/lib/api';
import { cn } from '@/lib/cn';
import { stageInfo } from '@/lib/labels';
import { useProject } from '@/hooks/use-project';
import type { Lead } from '@/features/leads/types';
import { aiErrorMessage, useGenerateQuoteDraft } from './hooks';
import { MAX_INSTRUCTIONS_LENGTH } from './types';

const EXAMPLES = [
  'Licencia Pro para 12 usuarios con el máximo descuento permitido',
  'Incluye implementación y 2 sesiones de capacitación presencial',
  'Propuesta básica según lo que pidió en la conversación',
];

const PROGRESS_STEPS = [
  'Leyendo la conversación con el lead…',
  'Eligiendo productos del catálogo…',
  'Aplicando precios y descuentos permitidos…',
  'Creando el borrador de la cotización…',
];

interface LeadOption {
  id: string;
  name: string;
  company: string | null;
  stage?: string;
}

interface ClientSummary {
  id: string;
  name: string;
  company: string | null;
}

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * «Generar con IA»: la IA arma un BORRADOR de cotización con el catálogo y la
 * conversación del lead; el backend lo crea en DRAFT (origin AI) y aquí se
 * navega al detalle para revisarlo y aprobarlo.
 */
export function GenerateQuoteDialog({
  open,
  onClose,
  leadId,
  clientId,
}: {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  clientId?: string;
}) {
  const router = useRouter();
  const { projectId, path } = useProject();
  const generate = useGenerateQuoteDraft();
  const [selected, setSelected] = useState<LeadOption | null>(null);
  const [search, setSearch] = useState('');
  const [instructions, setInstructions] = useState('');
  const [step, setStep] = useState(0);
  const debouncedSearch = useDebounced(search.trim());
  const fixedTarget = Boolean(leadId || clientId);

  // Reinicia el formulario cada vez que se abre.
  const { reset } = generate;
  useEffect(() => {
    if (open) {
      setSelected(null);
      setSearch('');
      setInstructions('');
      setStep(0);
      reset();
    }
  }, [open, reset]);

  // Avanza el texto de progreso mientras la IA trabaja (no es progreso real:
  // la petición es una sola, pero orienta al usuario durante la espera).
  useEffect(() => {
    if (!generate.isPending) return;
    setStep(0);
    const timer = setInterval(
      () => setStep((current) => Math.min(current + 1, PROGRESS_STEPS.length - 1)),
      2500,
    );
    return () => clearInterval(timer);
  }, [generate.isPending]);

  const fixedLead = useQuery({
    queryKey: ['leads', projectId, 'ai-target', leadId],
    queryFn: () => api.get<Lead>(path(`/leads/${leadId}`)),
    enabled: open && !!projectId && !!leadId,
    staleTime: 60_000,
  });

  const fixedClient = useQuery({
    queryKey: ['clients', projectId, 'ai-target', clientId],
    queryFn: () => api.get<ClientSummary>(path(`/clients/${clientId}`)),
    enabled: open && !!projectId && !!clientId && !leadId,
    staleTime: 60_000,
  });

  const leads = useQuery({
    queryKey: ['leads', projectId, { search: debouncedSearch, limit: 8, sortBy: 'updatedAt', order: 'desc' }],
    queryFn: () =>
      api.get<Paginated<Lead>>(path('/leads'), {
        search: debouncedSearch || undefined,
        limit: 8,
        sortBy: 'updatedAt',
        order: 'desc',
      }),
    enabled: open && !fixedTarget && !selected && !!projectId,
  });

  const target = leadId
    ? { label: 'Lead', name: fixedLead.data?.name, company: fixedLead.data?.company ?? null, loading: fixedLead.isLoading }
    : clientId
      ? { label: 'Cliente', name: fixedClient.data?.name, company: fixedClient.data?.company ?? null, loading: fixedClient.isLoading }
      : null;

  const canSubmit =
    (fixedTarget || !!selected) && instructions.length <= MAX_INSTRUCTIONS_LENGTH && !generate.isPending;

  const handleClose = () => {
    // Si se cierra durante la generación, la cotización se crea igual; se avisa.
    if (generate.isPending) {
      toast.info('La IA sigue preparando la cotización; la encontrarás en Cotizaciones.');
    }
    onClose();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    generate.mutate(
      {
        leadId: leadId ?? selected?.id,
        clientId: leadId ? undefined : clientId,
        instructions: instructions.trim(),
      },
      {
        onSuccess: (result) => {
          toast.success('Cotización preparada por IA: revisa y aprueba', {
            description:
              result.warnings.length > 0
                ? `${result.folio}. Ajustes: ${result.warnings.join(' ')}`
                : `${result.folio}. ${result.summary}`,
            duration: 8000,
          });
          onClose();
          router.push(`/cotizaciones/${result.quoteId}`);
        },
        onError: (error) => {
          toast.error(aiErrorMessage(error) || errorMessage(error));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" aria-hidden />
          Generar cotización con IA
        </span>
      }
      description="La IA arma un borrador con productos del catálogo y la conversación del lead. Nada se envía al cliente sin tu aprobación."
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Destinatario */}
        <div>
          <Label htmlFor={fixedTarget ? undefined : 'ai-quote-lead-search'}>Lead</Label>
          {target ? (
            <div className="flex items-center gap-2 rounded-xl border border-line bg-slate-50 px-3.5 py-2.5 text-sm">
              {target.loading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <>
                  <span className="text-xs font-semibold uppercase text-muted">{target.label}</span>
                  <span className="font-semibold text-ink">{target.name ?? '—'}</span>
                  {target.company ? <span className="text-muted">· {target.company}</span> : null}
                </>
              )}
            </div>
          ) : selected ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-semibold text-ink">{selected.name}</span>
                {selected.company ? <span className="text-muted"> · {selected.company}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1 text-muted hover:bg-violet-100"
                aria-label="Cambiar lead"
                disabled={generate.isPending}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  id="ai-quote-lead-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Busca por nombre, empresa, correo o teléfono"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-line">
                {leads.isLoading ? (
                  <div className="flex justify-center p-4">
                    <Spinner className="h-4 w-4" />
                  </div>
                ) : leads.isError ? (
                  <p className="p-3 text-sm text-rose-700">{errorMessage(leads.error)}</p>
                ) : (leads.data?.data.length ?? 0) === 0 ? (
                  <p className="p-3 text-sm text-muted">No se encontraron leads.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {leads.data?.data.map((lead) => {
                      const stage = stageInfo(lead.stage);
                      return (
                        <li key={lead.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelected({ id: lead.id, name: lead.name, company: lead.company, stage: lead.stage })
                            }
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="min-w-0 truncate">
                              <span className="font-medium text-ink">{lead.name}</span>
                              {lead.company ? <span className="text-muted"> · {lead.company}</span> : null}
                            </span>
                            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', stage.color)}>
                              {stage.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div>
          <Label htmlFor="ai-quote-instructions">Instrucciones para la IA</Label>
          <Textarea
            id="ai-quote-instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={MAX_INSTRUCTIONS_LENGTH}
            placeholder="¿Qué debe incluir? Cantidades, productos, descuentos, condiciones… (opcional)"
            disabled={generate.isPending}
            rows={4}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={generate.isPending}
                  onClick={() => setInstructions(example)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
            <span className="shrink-0 text-[11px] text-muted">
              {instructions.length}/{MAX_INSTRUCTIONS_LENGTH}
            </span>
          </div>
        </div>

        {generate.isPending ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3" aria-live="polite">
            <ol className="space-y-1.5 text-sm">
              {PROGRESS_STEPS.map((label, index) => (
                <li
                  key={label}
                  className={cn(
                    'flex items-center gap-2',
                    index < step ? 'text-violet-700' : index === step ? 'font-medium text-ink' : 'text-muted',
                  )}
                >
                  {index < step ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : index === step ? (
                    <Spinner className="h-4 w-4 text-violet-600" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-line" aria-hidden />
                  )}
                  {label}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {generate.isError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            {aiErrorMessage(generate.error)}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!canSubmit} loading={generate.isPending}>
            {!generate.isPending ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
            {generate.isPending ? 'Generando…' : 'Generar borrador'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
