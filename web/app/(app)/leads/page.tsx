'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { LeadSource, LeadStage } from '@flowcommerce/types';
import { Button, Card, Dialog, EmptyState, ErrorState, Field, Input, Pagination, Skeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber } from '@/lib/format';
import { LEAD_SOURCES, LEAD_STAGES, sourceLabel, stageInfo } from '@/lib/labels';
import { useProject } from '@/hooks/use-project';
import { useDashboard } from '@/features/dashboard/hooks';
import { FilterMenu, MenuOption } from '@/features/leads/filter-menu';
import { CreateLeadDialog } from '@/features/leads/lead-form-dialog';
import { FollowUpDialog } from '@/features/leads/follow-up-dialog';
import { LeadsTable } from '@/features/leads/leads-table';
import { PipelineBoard } from '@/features/leads/pipeline-board';
import { useDeleteLeadView, useLeadViews, useLeads, useMembers, useSaveLeadView } from '@/features/leads/hooks';
import { useDebounced } from '@/features/leads/use-debounced';
import type { LeadFilters, LeadSortField, LeadView, LeadViewFilters } from '@/features/leads/types';
import { dateInputToIso, toDateInput } from '@/features/leads/utils';

const PAGE_SIZE = 10;

interface UiFilters {
  search: string;
  stages: LeadStage[];
  assignedUserId: string;
  source: string;
  /** YYYY-MM-DD inclusivos (hora local). */
  dateFrom: string;
  dateTo: string;
  sortBy: LeadSortField | '';
  order: 'asc' | 'desc';
}

const EMPTY_FILTERS: UiFilters = {
  search: '',
  stages: [],
  assignedUserId: '',
  source: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  order: 'desc',
};

const SORT_OPTIONS: { label: string; sortBy: LeadSortField; order: 'asc' | 'desc' }[] = [
  { label: 'Más recientes', sortBy: 'createdAt', order: 'desc' },
  { label: 'Valor', sortBy: 'estimatedValue', order: 'desc' },
  { label: 'Último contacto', sortBy: 'lastContactAt', order: 'desc' },
  { label: 'Más antiguos', sortBy: 'createdAt', order: 'asc' },
  { label: 'Nombre', sortBy: 'name', order: 'asc' },
];

/** Estado de la UI → query de GET /leads (y filtros de una vista guardada). */
function toApiFilters(ui: UiFilters, search: string): LeadViewFilters {
  const filters: LeadViewFilters = {};
  if (search.trim()) filters.search = search.trim().slice(0, 100);
  if (ui.stages.length) filters.stages = ui.stages;
  if (ui.assignedUserId) filters.assignedUserId = ui.assignedUserId;
  if (ui.source) filters.source = ui.source as LeadSource;
  // createdTo es exclusivo: "hasta el 30" = antes del día 31 a las 00:00.
  if (ui.dateFrom) filters.createdFrom = dateInputToIso(ui.dateFrom);
  if (ui.dateTo) filters.createdTo = dateInputToIso(ui.dateTo, true);
  if (ui.sortBy) {
    filters.sortBy = ui.sortBy;
    filters.order = ui.order;
  }
  return filters;
}

function fromViewFilters(filters: LeadViewFilters): UiFilters {
  let dateTo = '';
  if (filters.createdTo) {
    const date = new Date(filters.createdTo);
    date.setDate(date.getDate() - 1);
    dateTo = toDateInput(date);
  }
  return {
    search: filters.search ?? '',
    stages: filters.stages ?? (filters.stage ? [filters.stage] : []),
    assignedUserId: filters.assignedUserId ?? '',
    source: filters.source ?? '',
    dateFrom: filters.createdFrom ? toDateInput(filters.createdFrom) : '',
    dateTo,
    sortBy: filters.sortBy ?? '',
    order: filters.order ?? 'asc',
  };
}

function LeadsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useProject();

  const [mode, setMode] = useState<'table' | 'pipeline'>('table');
  const [ui, setUi] = useState<UiFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState<LeadView | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  // Diálogos que se abren desde la URL (acciones rápidas y otras pantallas).
  const createOpen = searchParams.get('nuevo') === '1';
  const followUpOpen = searchParams.get('seguimiento') === '1';
  const closeUrlDialog = () => router.replace(pathname, { scroll: false });
  const openUrlDialog = (key: 'nuevo' | 'seguimiento') => router.replace(`${pathname}?${key}=1`, { scroll: false });

  // Recordar Tabla / Pipeline en este navegador.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('fc.leads.mode');
      if (saved === 'pipeline' || saved === 'table') setMode(saved);
    } catch {
      // almacenamiento no disponible
    }
  }, []);
  const changeMode = (value: 'table' | 'pipeline') => {
    setMode(value);
    try {
      window.localStorage.setItem('fc.leads.mode', value);
    } catch {
      // almacenamiento no disponible
    }
  };

  const search = useDebounced(ui.search);
  const apiFilters = useMemo(() => toApiFilters(ui, search), [ui, search]);
  const listFilters: LeadFilters = apiFilters;
  // En el kanban las columnas ya son las etapas: no se filtra por estado.
  const pipelineFilters = useMemo(() => {
    const rest: LeadViewFilters = { ...apiFilters };
    delete rest.stages;
    return rest;
  }, [apiFilters]);

  // Cualquier cambio de filtros vuelve a la página 1.
  useEffect(() => setPage(1), [apiFilters]);

  const leads = useLeads(listFilters, page, PAGE_SIZE);
  const summary = useDashboard(null);
  const { data: members = [] } = useMembers();
  const { data: views = [] } = useLeadViews();
  const deleteView = useDeleteLeadView();

  const set = <K extends keyof UiFilters>(key: K, value: UiFilters[K]) => setUi((prev) => ({ ...prev, [key]: value }));
  const toggleStage = (stage: LeadStage) =>
    set('stages', ui.stages.includes(stage) ? ui.stages.filter((item) => item !== stage) : [...ui.stages, stage]);

  const hasFilters =
    !!ui.search || ui.stages.length > 0 || !!ui.assignedUserId || !!ui.source || !!ui.dateFrom || !!ui.dateTo;
  const sortLabel = SORT_OPTIONS.find((item) => item.sortBy === ui.sortBy && item.order === ui.order)?.label ?? 'Más recientes';
  const memberName = members.find((member) => member.userId === ui.assignedUserId)?.name;

  const applyView = (view: LeadView) => {
    setActiveView(view);
    setUi(fromViewFilters(view.filters));
  };

  const removeView = (view: LeadView) =>
    deleteView.mutate(view.id, {
      onSuccess: () => {
        toast.success(`Vista "${view.name}" eliminada`);
        if (activeView?.id === view.id) setActiveView(null);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });

  const leadsActivos = summary.data?.summary.leadsActivos;
  const pipeline = summary.data?.summary.pipeline;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Gestión de Leads</h1>
          <div className="mt-1 text-sm text-muted">
            {summary.data ? (
              <>
                {formatNumber(leadsActivos)} leads activos · {formatMoney(pipeline)} en pipeline estimado
              </>
            ) : (
              <Skeleton className="h-4 w-56" />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-slate-200/70 p-1" role="tablist" aria-label="Vista">
            {(['table', 'pipeline'] as const).map((value) => (
              <button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => changeMode(value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                  mode === value ? 'bg-white text-brand-600 shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                {value === 'table' ? 'Tabla' : 'Pipeline'}
              </button>
            ))}
          </div>
          {can('LEAD_CREATE') ? (
            <Button onClick={() => openUrlDialog('nuevo')}>
              <Plus className="h-4 w-4" /> Nuevo Lead
            </Button>
          ) : null}
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={ui.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Buscar por nombre o empresa…"
            className="rounded-full pl-9"
            aria-label="Buscar leads"
          />
        </div>

        {mode === 'table' ? (
          <FilterMenu label={ui.stages.length ? `Estado (${ui.stages.length})` : 'Estado'} active={ui.stages.length > 0}>
            {LEAD_STAGES.map((stage) => (
              <MenuOption key={stage.value} checkbox selected={ui.stages.includes(stage.value)} onClick={() => toggleStage(stage.value)}>
                <span className={cn('h-2 w-2 rounded-full', stage.bar)} />
                {stage.label}
              </MenuOption>
            ))}
            {ui.stages.length ? (
              <button className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted hover:bg-slate-100" onClick={() => set('stages', [])}>
                Limpiar
              </button>
            ) : null}
          </FilterMenu>
        ) : null}

        <FilterMenu label={memberName ? `Responsable: ${memberName.split(' ')[0]}` : 'Responsable'} active={!!ui.assignedUserId}>
          {(close) => (
            <div className="max-h-72 overflow-y-auto">
              <MenuOption selected={!ui.assignedUserId} onClick={() => (set('assignedUserId', ''), close())}>
                Todos
              </MenuOption>
              {members.map((member) => (
                <MenuOption
                  key={member.userId}
                  selected={ui.assignedUserId === member.userId}
                  onClick={() => (set('assignedUserId', member.userId), close())}
                >
                  {member.name}
                </MenuOption>
              ))}
            </div>
          )}
        </FilterMenu>

        <FilterMenu label={ui.source ? sourceLabel(ui.source) : 'Fuente'} active={!!ui.source}>
          {(close) => (
            <>
              <MenuOption selected={!ui.source} onClick={() => (set('source', ''), close())}>
                Todas
              </MenuOption>
              {LEAD_SOURCES.map((source) => (
                <MenuOption key={source.value} selected={ui.source === source.value} onClick={() => (set('source', source.value), close())}>
                  {source.label}
                </MenuOption>
              ))}
            </>
          )}
        </FilterMenu>

        <FilterMenu label="Fecha" active={!!ui.dateFrom || !!ui.dateTo}>
          <div className="w-60 space-y-3 p-2">
            <Field label="Creados desde">
              <Input type="date" value={ui.dateFrom} max={ui.dateTo || undefined} onChange={(e) => set('dateFrom', e.target.value)} />
            </Field>
            <Field label="Hasta">
              <Input type="date" value={ui.dateTo} min={ui.dateFrom || undefined} onChange={(e) => set('dateTo', e.target.value)} />
            </Field>
            {ui.dateFrom || ui.dateTo ? (
              <Button size="sm" variant="ghost" onClick={() => setUi((prev) => ({ ...prev, dateFrom: '', dateTo: '' }))}>
                Limpiar fechas
              </Button>
            ) : null}
          </div>
        </FilterMenu>

        <FilterMenu label={`Ordenar por: ${sortLabel}`}>
          {(close) =>
            SORT_OPTIONS.map((option) => (
              <MenuOption
                key={option.label}
                selected={ui.sortBy === option.sortBy && ui.order === option.order}
                onClick={() => {
                  setUi((prev) => ({ ...prev, sortBy: option.sortBy, order: option.order }));
                  close();
                }}
              >
                {option.label}
              </MenuOption>
            ))
          }
        </FilterMenu>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUi(EMPTY_FILTERS);
              setActiveView(null);
            }}
          >
            <X className="h-3.5 w-3.5" /> Limpiar filtros
          </Button>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <FilterMenu
            align="right"
            label={
              <>
                <Bookmark className="h-3.5 w-3.5" /> {activeView ? activeView.name : 'Vistas'}
              </>
            }
            active={!!activeView}
          >
            {(close) =>
              views.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted">Aún no tienes vistas guardadas.</p>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {views.map((view) => (
                    <li key={view.id} className="flex items-center gap-1">
                      <MenuOption
                        selected={activeView?.id === view.id}
                        onClick={() => {
                          applyView(view);
                          close();
                        }}
                      >
                        {view.name}
                      </MenuOption>
                      <button
                        className="rounded-full p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Eliminar vista ${view.name}`}
                        onClick={() => removeView(view)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }
          </FilterMenu>
          <button
            onClick={() => setSaveOpen(true)}
            className="h-10 rounded-full border border-dashed border-line px-4 text-sm font-semibold text-muted hover:border-brand-500 hover:text-brand-600"
          >
            Guardar vista
          </button>
        </div>
      </div>

      {/* Contenido */}
      {mode === 'pipeline' ? (
        <PipelineBoard filters={pipelineFilters} />
      ) : (
        <Card className="p-0">
          {leads.isError ? (
            <div className="p-4">
              <ErrorState message={errorMessage(leads.error)} onRetry={() => leads.refetch()} />
            </div>
          ) : !leads.isLoading && leads.data?.data.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'Sin resultados' : 'Aún no hay leads'}
              description={hasFilters ? 'Prueba con otros filtros o limpia la búsqueda.' : 'Registra tu primer prospecto para empezar.'}
              action={
                !hasFilters && can('LEAD_CREATE') ? (
                  <Button className="mt-2" onClick={() => openUrlDialog('nuevo')}>
                    <Plus className="h-4 w-4" /> Nuevo Lead
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <div className={cn(leads.isFetching && !leads.isLoading && 'opacity-60 transition-opacity')}>
                <LeadsTable leads={leads.data?.data ?? []} loading={leads.isLoading} />
              </div>
              {leads.data ? (
                <div className="px-4">
                  <Pagination
                    page={leads.data.meta.page}
                    totalPages={leads.data.meta.totalPages}
                    total={leads.data.meta.total}
                    onPage={setPage}
                    label="leads"
                  />
                </div>
              ) : null}
            </>
          )}
        </Card>
      )}

      {ui.stages.length && mode === 'table' ? (
        <p className="mt-2 text-xs text-muted">Estados: {ui.stages.map((stage) => stageInfo(stage).label).join(', ')}</p>
      ) : null}

      <SaveViewDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        filters={apiFilters}
        activeView={activeView}
        onSaved={setActiveView}
      />
      <CreateLeadDialog open={createOpen} onClose={closeUrlDialog} />
      <FollowUpDialog open={followUpOpen} onClose={closeUrlDialog} />
    </div>
  );
}

function SaveViewDialog({
  open,
  onClose,
  filters,
  activeView,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  filters: LeadViewFilters;
  activeView: LeadView | null;
  onSaved: (view: LeadView) => void;
}) {
  const save = useSaveLeadView();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  const done = (view: LeadView, message: string) => {
    toast.success(message);
    onSaved(view);
    onClose();
  };

  const createNew = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError('Ponle un nombre a la vista');
    save.mutate(
      { name: name.trim(), filters },
      { onSuccess: (view) => done(view, `Vista "${view.name}" guardada`), onError: (err) => setError(errorMessage(err)) },
    );
  };

  const updateActive = () => {
    if (!activeView) return;
    save.mutate(
      { id: activeView.id, filters },
      { onSuccess: (view) => done(view, `Vista "${view.name}" actualizada`), onError: (err) => toast.error(errorMessage(err)) },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Guardar vista" description="Guarda los filtros y el orden actuales para volver a usarlos." size="sm">
      {activeView ? (
        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm">
          <p>
            Vista activa: <strong>{activeView.name}</strong>
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={updateActive} loading={save.isPending}>
            Actualizar con los filtros actuales
          </Button>
        </div>
      ) : null}
      <form onSubmit={createNew} className="space-y-4">
        <Field label={activeView ? 'O guárdala como nueva' : 'Nombre'} error={error ?? undefined}>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Mis leads en negociación" autoFocus />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={save.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <LeadsPageContent />
    </Suspense>
  );
}
