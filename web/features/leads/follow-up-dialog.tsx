'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import type { FollowUpType } from '@flowcommerce/types';
import { Avatar, Button, Dialog, Field, Input, Select, Spinner, Textarea } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { stageInfo } from '@/lib/labels';
import { useMe } from '@/hooks/use-session';
import { useCreateFollowUp, useLeadSearch, useMembers, useUpdateFollowUp } from './hooks';
import type { FollowUp, RefSummary } from './types';
import { FOLLOW_UP_TYPES, followUpTypeLabel, toDateTimeLocal } from './utils';
import { useDebounced } from './use-debounced';

/** Buscador para elegir el lead del seguimiento. */
function LeadPicker({ value, onChange }: { value: RefSummary | null; onChange: (lead: RefSummary | null) => void }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search.trim());
  const { data, isFetching } = useLeadSearch(debounced, !value);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
        <Avatar name={value.name} size="sm" />
        <span className="flex-1 truncate text-sm font-medium">{value.name}</span>
        <button type="button" onClick={() => onChange(null)} className="rounded-full p-1 text-muted hover:bg-slate-100" aria-label="Cambiar lead">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa, correo…"
          className="pl-9"
          aria-label="Buscar lead"
          autoFocus
        />
        {isFetching ? <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" /> : null}
      </div>
      <ul className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-line">
        {(data?.data ?? []).map((lead) => {
          const stage = stageInfo(lead.stage);
          return (
            <li key={lead.id}>
              <button
                type="button"
                onClick={() => onChange({ id: lead.id, name: lead.name })}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <Avatar name={lead.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{lead.name}</span>
                  <span className="block truncate text-xs text-muted">{lead.company ?? lead.email ?? lead.phone ?? '—'}</span>
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', stage.color)}>{stage.label}</span>
              </button>
            </li>
          );
        })}
        {data && data.data.length === 0 ? <li className="px-3 py-4 text-center text-sm text-muted">Sin resultados</li> : null}
      </ul>
    </div>
  );
}

/** Mañana a las 9:00 como valor por defecto. */
function defaultDue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toDateTimeLocal(date);
}

/**
 * Diálogo "Registrar seguimiento" (POST /leads/:leadId/follow-ups) o
 * "Editar seguimiento" (PATCH /follow-ups/:id) si recibe `followUp`.
 * Sin `lead` fijo muestra un buscador para elegirlo.
 */
export function FollowUpDialog({
  open,
  onClose,
  lead,
  followUp,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lead?: RefSummary | null;
  followUp?: FollowUp | null;
  onSaved?: (followUp: FollowUp) => void;
}) {
  const { data: me } = useMe();
  const { data: members = [] } = useMembers();
  const create = useCreateFollowUp();
  const update = useUpdateFollowUp();

  const [selected, setSelected] = useState<RefSummary | null>(lead ?? null);
  const [type, setType] = useState<FollowUpType>('CALL');
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(defaultDue);
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (followUp) {
      setSelected(followUp.lead);
      setType(followUp.type);
      setTitle(followUp.title);
      setDueAt(toDateTimeLocal(followUp.dueAt));
      setNotes(followUp.notes ?? '');
      setAssignedUserId(followUp.assignedUserId ?? '');
    } else {
      setSelected(lead ?? null);
      setType('CALL');
      setTitle('');
      setDueAt(defaultDue());
      setNotes('');
      setAssignedUserId(me?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, followUp?.id, lead?.id]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return setError('Elige el lead del seguimiento');
    if (!dueAt) return setError('Indica la fecha y hora');
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return setError('Fecha no válida');
    setError(null);

    const body = {
      type,
      // El asunto es obligatorio en la API: si se deja vacío se usa el tipo.
      title: title.trim() || `${followUpTypeLabel(type)} con ${selected.name}`.slice(0, 255),
      notes: notes.trim() || null,
      dueAt: due.toISOString(),
      assignedUserId: assignedUserId || null,
    };
    const handlers = {
      onSuccess: (saved: FollowUp) => {
        toast.success(followUp ? 'Seguimiento actualizado' : 'Seguimiento registrado');
        onSaved?.(saved);
        onClose();
      },
      onError: (err: unknown) => toast.error(errorMessage(err)),
    };
    if (followUp) update.mutate({ id: followUp.id, input: body }, handlers);
    else create.mutate({ leadId: selected.id, input: body }, handlers);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={followUp ? 'Editar seguimiento' : 'Registrar seguimiento'}
      description={followUp ? undefined : 'Agenda la próxima acción con el lead.'}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Lead *">
          {lead || followUp ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 px-3 py-2">
              <Avatar name={selected?.name} size="sm" />
              <span className="truncate text-sm font-medium">{selected?.name}</span>
            </div>
          ) : (
            <LeadPicker value={selected} onChange={setSelected} />
          )}
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Tipo</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de seguimiento">
            {FOLLOW_UP_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={type === item.value}
                onClick={() => setType(item.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  type === item.value ? 'bg-brand-500 text-white' : 'bg-white text-muted ring-1 ring-line hover:text-ink',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Asunto" hint="Opcional: si lo dejas vacío se usa el tipo y el nombre del lead.">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} placeholder="Llamar para confirmar la demo" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha y hora *">
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
          <Field label="Responsable">
            <Select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
              <option value="">Quien lo registra</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Notas">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} placeholder="Detalles de la acción a realizar" />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {followUp ? 'Guardar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
