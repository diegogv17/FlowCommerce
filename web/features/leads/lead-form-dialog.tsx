'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { LeadSource, LeadStage } from '@flowcommerce/types';
import { Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { LEAD_SOURCES, LEAD_STAGES } from '@/lib/labels';
import { useMe } from '@/hooks/use-session';
import { useCreateLead, useMembers, useProductOptions, useUpdateLead } from './hooks';
import type { Lead, LeadInput } from './types';

interface FormState {
  name: string;
  company: string;
  contactPosition: string;
  phone: string;
  email: string;
  source: string;
  interestProductId: string;
  estimatedValue: string;
  assignedUserId: string;
  stage: string;
  notes: string;
}

const EMPTY: FormState = {
  name: '',
  company: '',
  contactPosition: '',
  phone: '',
  email: '',
  source: '',
  interestProductId: '',
  estimatedValue: '',
  assignedUserId: '',
  stage: 'NEW',
  notes: '',
};

function fromLead(lead: Lead): FormState {
  return {
    name: lead.name,
    company: lead.company ?? '',
    contactPosition: lead.contactPosition ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    source: lead.source ?? '',
    interestProductId: lead.interestProductId ?? '',
    estimatedValue: lead.estimatedValue != null ? String(lead.estimatedValue) : '',
    assignedUserId: lead.assignedUserId ?? '',
    stage: lead.stage,
    notes: lead.notes ?? '',
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errors.email = 'Correo no válido';
  if (form.phone.trim().length > 32) errors.phone = 'Máximo 32 caracteres';
  if (form.estimatedValue.trim()) {
    const value = Number(form.estimatedValue);
    if (!Number.isFinite(value) || value < 0) errors.estimatedValue = 'Debe ser un número positivo';
  }
  return errors;
}

/** Arma el body: '' → null para que el PATCH pueda borrar un campo. */
function toInput(form: FormState, includeStage: boolean): LeadInput {
  const text = (value: string) => (value.trim() ? value.trim() : null);
  const input: LeadInput = {
    name: form.name.trim(),
    company: text(form.company),
    contactPosition: text(form.contactPosition),
    phone: text(form.phone),
    email: text(form.email),
    source: (text(form.source) as LeadSource | null) ?? null,
    interestProductId: text(form.interestProductId),
    estimatedValue: form.estimatedValue.trim() ? Math.round(Number(form.estimatedValue) * 100) / 100 : null,
    assignedUserId: text(form.assignedUserId),
    notes: text(form.notes),
  };
  if (includeStage) input.stage = form.stage as LeadStage;
  return input;
}

function LeadFields({
  form,
  errors,
  set,
  showStage,
}: {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  set: (key: keyof FormState, value: string) => void;
  showStage?: boolean;
}) {
  const { data: members = [] } = useMembers();
  const { data: products = [] } = useProductOptions();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre *" error={errors.name}>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Andrea López" maxLength={255} autoFocus />
      </Field>
      <Field label="Empresa">
        <Input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Constructora Nova" maxLength={255} />
      </Field>
      <Field label="Cargo del contacto">
        <Input value={form.contactPosition} onChange={(e) => set('contactPosition', e.target.value)} placeholder="Gerente de Proyectos" maxLength={100} />
      </Field>
      <Field label="Teléfono" error={errors.phone}>
        <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+502 5541 2288" maxLength={32} />
      </Field>
      <Field label="Correo" error={errors.email}>
        <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@empresa.gt" maxLength={255} />
      </Field>
      <Field label="Fuente">
        <Select value={form.source} onChange={(e) => set('source', e.target.value)}>
          <option value="">Sin especificar</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Producto o servicio de interés">
        <Select value={form.interestProductId} onChange={(e) => set('interestProductId', e.target.value)}>
          <option value="">Ninguno</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Valor estimado (Q, sin IVA)" error={errors.estimatedValue}>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={form.estimatedValue}
          onChange={(e) => set('estimatedValue', e.target.value)}
          placeholder="0.00"
        />
      </Field>
      <Field label="Responsable">
        <Select value={form.assignedUserId} onChange={(e) => set('assignedUserId', e.target.value)}>
          <option value="">Sin asignar</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>
      {showStage ? (
        <Field label="Etapa">
          <Select value={form.stage} onChange={(e) => set('stage', e.target.value)}>
            {LEAD_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Notas" className="sm:col-span-2">
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={5000} placeholder="Qué necesita, presupuesto, contexto…" />
      </Field>
    </div>
  );
}

function useLeadForm(initial: FormState, open: boolean) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  return { form, setForm, errors, setErrors, set };
}

/** Diálogo "Nuevo lead". Se reutiliza en Leads, Dashboard y otras pantallas. */
export function CreateLeadDialog({
  open,
  onClose,
  onCreated,
  navigateOnCreate = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Lead) => void;
  /** true = abre el detalle del lead recién creado. */
  navigateOnCreate?: boolean;
}) {
  const router = useRouter();
  const { data: me } = useMe();
  const create = useCreateLead();
  const { form, setForm, errors, setErrors, set } = useLeadForm(EMPTY, open);

  // Por defecto, el responsable es quien lo crea.
  useEffect(() => {
    if (open && me?.id) setForm((prev) => (prev.assignedUserId ? prev : { ...prev, assignedUserId: me.id }));
  }, [open, me?.id, setForm]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    create.mutate(toInput(form, false), {
      onSuccess: (lead) => {
        toast.success(`Lead "${lead.name}" creado`, {
          action: navigateOnCreate ? undefined : { label: 'Ver', onClick: () => router.push(`/leads/${lead.id}`) },
        });
        onCreated?.(lead);
        onClose();
        if (navigateOnCreate) router.push(`/leads/${lead.id}`);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo lead" description="Registra un prospecto para darle seguimiento." size="lg">
      <form onSubmit={submit} noValidate>
        <LeadFields form={form} errors={errors} set={set} />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending}>
            Crear lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Diálogo "Editar lead" (PATCH parcial con todos los campos del formulario). */
export function EditLeadDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: Lead }) {
  const update = useUpdateLead(lead.id);
  const { form, errors, setErrors, set } = useLeadForm(fromLead(lead), open);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    update.mutate(toInput(form, true), {
      onSuccess: () => {
        toast.success('Lead actualizado');
        onClose();
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Editar lead" size="lg">
      <form onSubmit={submit} noValidate>
        <LeadFields form={form} errors={errors} set={set} showStage />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={update.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
