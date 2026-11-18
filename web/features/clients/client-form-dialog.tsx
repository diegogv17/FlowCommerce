'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useCreateClient, useMembers, useUpdateClient } from './hooks';
import type { Client } from './types';

interface FormState {
  name: string;
  company: string;
  contactPosition: string;
  taxId: string;
  email: string;
  phone: string;
  assignedUserId: string;
  notes: string;
}

const EMPTY: FormState = {
  name: '',
  company: '',
  contactPosition: '',
  taxId: '',
  email: '',
  phone: '',
  assignedUserId: '',
  notes: '',
};

function fromClient(client: Client): FormState {
  return {
    name: client.name,
    company: client.company ?? '',
    contactPosition: client.contactPosition ?? '',
    taxId: client.taxId ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    assignedUserId: client.assignedUserId ?? '',
    notes: client.notes ?? '',
  };
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Diálogo para crear (POST /clients) o editar (PATCH /clients/:id) un cliente. */
export function ClientFormDialog({
  open,
  onClose,
  client,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  onSaved?: (client: Client) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const members = useMembers();
  const create = useCreateClient();
  const update = useUpdateClient();

  useEffect(() => {
    if (open) {
      setForm(client ? fromClient(client) : EMPTY);
      setErrors({});
    }
  }, [open, client]);

  const set =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'El nombre del contacto es obligatorio';
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) next.email = 'Email inválido';
    setErrors(next);
    if (Object.keys(next).length) return;

    const input = {
      name: form.name.trim(),
      company: orNull(form.company),
      contactPosition: orNull(form.contactPosition),
      taxId: orNull(form.taxId),
      email: orNull(form.email),
      phone: orNull(form.phone),
      assignedUserId: form.assignedUserId || null,
      notes: orNull(form.notes),
    };
    try {
      const saved = client
        ? await update.mutateAsync({ id: client.id, input })
        : await create.mutateAsync(input);
      toast.success(client ? 'Cliente actualizado' : 'Cliente creado');
      onSaved?.(saved);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={client ? 'Editar cliente' : 'Nuevo cliente'} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Contacto principal *" error={errors.name}>
          <Input value={form.name} onChange={set('name')} maxLength={255} autoFocus />
        </Field>
        <Field label="Cargo del contacto" hint="Aparece en el PDF de la cotización">
          <Input value={form.contactPosition} onChange={set('contactPosition')} maxLength={100} />
        </Field>
        <Field label="Empresa">
          <Input value={form.company} onChange={set('company')} maxLength={255} />
        </Field>
        <Field label="NIT">
          <Input value={form.taxId} onChange={set('taxId')} maxLength={32} placeholder="1234567-8" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={set('email')} maxLength={255} />
        </Field>
        <Field label="Teléfono">
          <Input type="tel" value={form.phone} onChange={set('phone')} maxLength={32} placeholder="+502 5555 5555" />
        </Field>
        <Field label="Responsable" className="sm:col-span-2">
          <Select value={form.assignedUserId} onChange={set('assignedUserId')}>
            <option value="">Sin responsable</option>
            {(members.data ?? []).map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notas" className="sm:col-span-2">
          <Textarea value={form.notes} onChange={set('notes')} maxLength={5000} className="min-h-20" />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {client ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
