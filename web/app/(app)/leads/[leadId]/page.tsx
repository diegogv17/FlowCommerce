'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Building2, MoreHorizontal, Trash2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import type { LeadStage } from '@flowcommerce/types';
import { AiBadge, Avatar, Badge, Button, Card, ConfirmDialog, Dialog, ErrorState, Skeleton, Tabs } from '@/components/ui';
import { ApiError, errorMessage } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { sourceLabel, stageInfo } from '@/lib/labels';
import { useProject } from '@/hooks/use-project';
import { LeadInsightCard } from '@/features/ai/lead-insight-card';
import { ChatThread } from '@/features/conversations/chat-thread';
import { ConvertLeadDialog } from '@/features/leads/convert-lead-dialog';
import { FilterMenu } from '@/features/leads/filter-menu';
import { FollowUpDialog } from '@/features/leads/follow-up-dialog';
import { FollowUpsTab } from '@/features/leads/follow-ups-tab';
import { useDeleteLead, useLead, useUpdateLead } from '@/features/leads/hooks';
import { EditLeadDialog } from '@/features/leads/lead-form-dialog';
import { ActivityTab, AttachmentsTab, QuotesTab } from '@/features/leads/lead-tabs';
import { StageStepper } from '@/features/leads/stage-stepper';
import type { Lead } from '@/features/leads/types';

type TabKey = 'resumen' | 'seguimiento' | 'conversaciones' | 'cotizaciones' | 'actividad' | 'archivos';

const TABS: { value: TabKey; label: string }[] = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'conversaciones', label: 'Conversaciones' },
  { value: 'cotizaciones', label: 'Cotizaciones' },
  { value: 'actividad', label: 'Actividad' },
  { value: 'archivos', label: 'Archivos' },
];

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2.5 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

function SummaryTab({ lead }: { lead: Lead }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-2 text-base font-semibold">Información de contacto</h3>
        <dl>
          <InfoRow label="Email">
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="hover:text-brand-600">
                {lead.email}
              </a>
            ) : (
              '—'
            )}
          </InfoRow>
          <InfoRow label="Teléfono">
            {lead.phone ? (
              <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="hover:text-brand-600">
                {lead.phone}
              </a>
            ) : (
              '—'
            )}
          </InfoRow>
          <InfoRow label="Empresa">{lead.company ?? '—'}</InfoRow>
          {lead.contactPosition ? <InfoRow label="Cargo">{lead.contactPosition}</InfoRow> : null}
          <InfoRow label="Origen">
            <span className="inline-flex items-center gap-2">
              {sourceLabel(lead.source)}
              {lead.origin === 'AI' ? <AiBadge /> : null}
            </span>
          </InfoRow>
          <InfoRow label="Servicio de interés">{lead.interestProduct?.name ?? '—'}</InfoRow>
          <InfoRow label="Responsable">{lead.assignedUser?.name ?? 'Sin asignar'}</InfoRow>
          {lead.client ? (
            <InfoRow label="Cliente">
              <Link href={`/clientes/${lead.client.id}`} className="text-brand-600 hover:underline">
                {lead.client.name}
              </Link>
            </InfoRow>
          ) : null}
          <InfoRow label="Fecha de creación">{formatDate(lead.creadoEn)}</InfoRow>
        </dl>
      </Card>
      <Card>
        <h3 className="mb-3 text-base font-semibold">Notas iniciales</h3>
        {lead.notes ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{lead.notes}</p>
        ) : (
          <p className="text-sm text-muted">Sin notas.</p>
        )}
        <div className="mt-4">
          <LeadInsightCard leadId={lead.id} />
        </div>
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full max-w-lg" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params?.leadId ?? '';
  const router = useRouter();
  const { can } = useProject();
  const { data: lead, isLoading, isError, error, refetch } = useLead(leadId);
  const update = useUpdateLead(leadId);
  const remove = useDeleteLead();

  const [tab, setTab] = useState<TabKey>('resumen');
  const [editOpen, setEditOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [pendingStage, setPendingStage] = useState<LeadStage | null>(null);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !lead) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div>
        <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Volver a Leads
        </Link>
        <ErrorState message={notFound ? 'Este lead no existe o fue eliminado.' : errorMessage(error)} onRetry={notFound ? undefined : () => refetch()} />
      </div>
    );
  }

  const canEdit = can('LEAD_UPDATE');
  const stage = stageInfo(lead.stage);

  const changeStage = (next: LeadStage, message?: string) => {
    setPendingStage(next);
    update.mutate(
      { stage: next },
      {
        onSuccess: () => toast.success(message ?? `Etapa: ${stageInfo(next).label}`),
        onError: (err) => toast.error(errorMessage(err)),
        onSettled: () => setPendingStage(null),
      },
    );
  };

  const markLost = () => {
    changeStage('LOST', 'Lead marcado como perdido');
    setLostOpen(false);
    setDeleteBlocked(false);
  };

  const confirmDelete = () => {
    remove.mutate(lead.id, {
      onSuccess: () => {
        toast.success('Lead eliminado');
        router.replace('/leads');
      },
      onError: (err) => {
        setDeleteOpen(false);
        // 409: tiene historial comercial (cotizaciones, mensajes o cliente).
        if (err instanceof ApiError && err.status === 409) setDeleteBlocked(true);
        else toast.error(errorMessage(err));
      },
    });
  };

  return (
    <div>
      <Link href="/leads" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Volver a Leads
      </Link>

      {/* Cabecera */}
      <Card className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar name={lead.name} size="lg" className="rounded-2xl bg-brand-500" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{lead.name}</h1>
              <Badge className={stage.color}>{stage.label}</Badge>
              {lead.origin === 'AI' ? <AiBadge /> : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted">
              {lead.company ?? 'Sin empresa'} · Responsable: {lead.assignedUser?.name ?? 'sin asignar'}
            </p>
          </div>
          <div className="hidden border-l border-line pl-5 sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Valor estimado</p>
            <p className="font-mono text-2xl font-semibold text-emerald-600">
              {lead.estimatedValue != null ? formatMoney(lead.estimatedValue) : '—'}
            </p>
          </div>
        </div>
        <p className="font-mono text-xl font-semibold text-emerald-600 sm:hidden">
          {lead.estimatedValue != null ? formatMoney(lead.estimatedValue) : 'Sin valor estimado'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          ) : null}
          <Link href={`/conversaciones?leadId=${lead.id}`}>
            <Button variant="secondary">Enviar mensaje</Button>
          </Link>
          {canEdit ? (
            <Button variant="secondary" onClick={() => setFollowUpOpen(true)}>
              Registrar seguimiento
            </Button>
          ) : null}
          {can('QUOTE_CREATE') ? (
            <Link href={`/cotizaciones/nueva?leadId=${lead.id}`}>
              <Button>Nueva Cotización</Button>
            </Link>
          ) : null}
          {lead.clientId ? (
            <Link href={`/clientes/${lead.clientId}`}>
              <Button variant="outline">
                <Building2 className="h-4 w-4" /> Ver cliente
              </Button>
            </Link>
          ) : can('CLIENT_CREATE') && canEdit ? (
            <Button variant="success" onClick={() => setConvertOpen(true)}>
              <Building2 className="h-4 w-4" /> Convertir a cliente
            </Button>
          ) : null}
          {canEdit && lead.stage !== 'LOST' ? (
            <Button variant="outline" className="text-rose-600" onClick={() => setLostOpen(true)}>
              <UserX className="h-4 w-4" /> Marcar como perdido
            </Button>
          ) : null}
          {can('LEAD_DELETE') ? (
            <FilterMenu align="right" ariaLabel="Más acciones" label={<MoreHorizontal className="h-4 w-4" />}>
              {(close) => (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    close();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Eliminar lead
                </button>
              )}
            </FilterMenu>
          ) : null}
        </div>
      </Card>

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-5" />

      {/* Etapa comercial */}
      <Card className="mb-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Etapa comercial</h3>
          {lead.stage === 'LOST' ? (
            <span className="text-xs text-rose-600">Lead perdido · elige una etapa para reactivarlo</span>
          ) : null}
        </div>
        <StageStepper stage={lead.stage} onChange={(next) => changeStage(next)} disabled={!canEdit || update.isPending} pending={pendingStage} />
      </Card>

      {tab === 'resumen' ? <SummaryTab lead={lead} /> : null}
      {tab === 'seguimiento' ? <FollowUpsTab lead={{ id: lead.id, name: lead.name }} /> : null}
      {tab === 'conversaciones' ? <ChatThread leadId={lead.id} /> : null}
      {tab === 'cotizaciones' ? <QuotesTab leadId={lead.id} /> : null}
      {tab === 'actividad' ? <ActivityTab leadId={lead.id} /> : null}
      {tab === 'archivos' ? <AttachmentsTab leadId={lead.id} /> : null}

      <EditLeadDialog open={editOpen} onClose={() => setEditOpen(false)} lead={lead} />
      <FollowUpDialog open={followUpOpen} onClose={() => setFollowUpOpen(false)} lead={{ id: lead.id, name: lead.name }} />
      <ConvertLeadDialog open={convertOpen} onClose={() => setConvertOpen(false)} lead={lead} />
      <ConfirmDialog
        open={lostOpen}
        onClose={() => setLostOpen(false)}
        onConfirm={markLost}
        title="¿Marcar como perdido?"
        description="El lead sale del embudo activo. Puedes reactivarlo eligiendo otra etapa."
        confirmLabel="Marcar como perdido"
        danger
        loading={update.isPending}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar este lead?"
        description="Se borran también sus borradores de cotización y seguimientos. No se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
      <Dialog
        open={deleteBlocked}
        onClose={() => setDeleteBlocked(false)}
        title="No se puede eliminar"
        description="Este lead tiene historial comercial (cotizaciones enviadas, mensajes o un cliente asociado), así que no se borra."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteBlocked(false)}>
              Cerrar
            </Button>
            {canEdit && lead.stage !== 'LOST' ? (
              <Button variant="danger" onClick={markLost} loading={update.isPending}>
                Marcar como Perdido
              </Button>
            ) : null}
          </>
        }
      >
        <p className="text-sm text-muted">Para retirarlo del embudo, márcalo como Perdido.</p>
      </Dialog>
    </div>
  );
}
