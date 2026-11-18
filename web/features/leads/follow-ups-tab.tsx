'use client';

import { useState } from 'react';
import { CalendarClock, Check, Mail, MessageCircle, Pencil, Phone, Plus, Trash2, Users, X, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import type { FollowUpType } from '@flowcommerce/types';
import { Badge, Button, Card, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Skeleton, Textarea } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useProject } from '@/hooks/use-project';
import { FollowUpDialog } from './follow-up-dialog';
import { useDeleteFollowUp, useLeadFollowUps, useUpdateFollowUp } from './hooks';
import type { FollowUp, RefSummary } from './types';
import { FOLLOW_UP_STATUS, followUpTypeLabel } from './utils';

const TYPE_ICONS: Record<FollowUpType, React.ComponentType<{ className?: string }>> = {
  CALL: Phone,
  MEETING: Users,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  TASK: ListTodo,
};

export function FollowUpsTab({ lead }: { lead: RefSummary }) {
  const { can } = useProject();
  const canEdit = can('LEAD_UPDATE');
  const { data, isLoading, isError, error, refetch } = useLeadFollowUps(lead.id);
  const update = useUpdateFollowUp();
  const remove = useDeleteFollowUp();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [completing, setCompleting] = useState<FollowUp | null>(null);
  const [outcome, setOutcome] = useState('');
  const [cancelling, setCancelling] = useState<FollowUp | null>(null);
  const [deleting, setDeleting] = useState<FollowUp | null>(null);

  const complete = () => {
    if (!completing) return;
    update.mutate(
      { id: completing.id, input: { status: 'DONE', outcome: outcome.trim() || null } },
      {
        onSuccess: () => {
          toast.success('Seguimiento completado');
          setCompleting(null);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const cancel = () => {
    if (!cancelling) return;
    update.mutate(
      { id: cancelling.id, input: { status: 'CANCELLED' } },
      {
        onSuccess: () => {
          toast.success('Seguimiento cancelado');
          setCancelling(null);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Seguimiento eliminado');
        setDeleting(null);
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  const items = data?.data ?? [];
  const pending = items.filter((item) => item.status === 'PENDING');
  const closed = items.filter((item) => item.status !== 'PENDING');

  const renderItem = (item: FollowUp) => {
    const Icon = TYPE_ICONS[item.type] ?? CalendarClock;
    const status = FOLLOW_UP_STATUS[item.status];
    return (
      <li key={item.id} className="flex gap-3 border-b border-line/60 py-4 last:border-0">
        <span
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            item.status === 'PENDING' ? (item.overdue ? 'bg-rose-100 text-rose-600' : 'bg-brand-50 text-brand-600') : 'bg-slate-100 text-muted',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('font-semibold', item.status === 'CANCELLED' && 'text-muted line-through')}>{item.title}</p>
            <Badge className={status.color}>{status.label}</Badge>
            {item.overdue ? <Badge className="bg-rose-100 text-rose-700">Vencido</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {followUpTypeLabel(item.type)} · {formatDateTime(item.dueAt)}
            {item.assignedUser ? ` · ${item.assignedUser.name}` : ''}
          </p>
          {item.notes ? <p className="mt-2 whitespace-pre-line text-sm text-ink">{item.notes}</p> : null}
          {item.outcome ? (
            <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <strong>Resultado:</strong> {item.outcome}
            </p>
          ) : null}
        </div>
        {canEdit ? (
          <div className="flex shrink-0 items-start gap-1">
            {item.status === 'PENDING' ? (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    setOutcome('');
                    setCompleting(item);
                  }}
                >
                  <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Completar</span>
                </Button>
                <Button size="icon" variant="ghost" aria-label="Editar seguimiento" onClick={() => setEditing(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Cancelar seguimiento" onClick={() => setCancelling(item)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            <Button size="icon" variant="ghost" aria-label="Eliminar seguimiento" onClick={() => setDeleting(item)}>
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Seguimientos</h3>
        {canEdit ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Registrar seguimiento
          </Button>
        ) : null}
      </div>

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Sin seguimientos" description="Agenda una llamada, reunión o tarea para no perder el hilo." icon={<CalendarClock className="h-6 w-6" />} />
      ) : (
        <>
          {pending.length ? (
            <>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">Pendientes ({pending.length})</p>
              <ul>{pending.map(renderItem)}</ul>
            </>
          ) : null}
          {closed.length ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Historial ({closed.length})</p>
              <ul>{closed.map(renderItem)}</ul>
            </>
          ) : null}
        </>
      )}

      <FollowUpDialog open={createOpen} onClose={() => setCreateOpen(false)} lead={lead} />
      <FollowUpDialog open={!!editing} onClose={() => setEditing(null)} followUp={editing} />

      <Dialog
        open={!!completing}
        onClose={() => setCompleting(null)}
        title="Completar seguimiento"
        description={completing?.title}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompleting(null)}>
              Volver
            </Button>
            <Button variant="success" onClick={complete} loading={update.isPending}>
              Completar
            </Button>
          </>
        }
      >
        <Field label="Resultado (opcional)">
          <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={5000} placeholder="Pide la demo el martes" />
        </Field>
      </Dialog>

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={cancel}
        title="¿Cancelar este seguimiento?"
        description="Quedará en el historial como cancelado. No se puede reabrir."
        confirmLabel="Cancelar seguimiento"
        danger
        loading={update.isPending}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="¿Eliminar este seguimiento?"
        description="Se borra definitivamente."
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
    </Card>
  );
}
