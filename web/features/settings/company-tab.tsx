'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, ErrorState, Field, Input, Skeleton, Textarea } from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { useProjectDetail, useUpdateProject } from './hooks';
import { emptyToNull } from './shared';
import type { ProjectDetail } from './types';

/** Datos de la empresa y perfil de facturación (salen en las cotizaciones). */
export function CompanyTab() {
  const detail = useProjectDetail();
  if (detail.isLoading) return <Skeleton className="h-[28rem] max-w-3xl rounded-2xl" />;
  if (detail.isError || !detail.data) {
    return <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />;
  }
  return <CompanyForm project={detail.data} />;
}

interface FormState {
  name: string;
  description: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
}

function toForm(project: ProjectDetail): FormState {
  return {
    name: project.name,
    description: project.description ?? '',
    legalName: project.billing.legalName ?? '',
    taxId: project.billing.taxId ?? '',
    address: project.billing.address ?? '',
    phone: project.billing.phone ?? '',
    email: project.billing.email ?? '',
  };
}

function CompanyForm({ project }: { project: ProjectDetail }) {
  const { can } = useProject();
  const editable = can('PROJECT_UPDATE');
  const update = useUpdateProject('Datos de la empresa guardados');
  const [form, setForm] = useState<FormState>(() => toForm(project));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => setForm(toForm(project)), [project]);

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(project));

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) found.name = 'El nombre es obligatorio.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      found.email = 'Correo no válido.';
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    update.mutate({
      name: form.name.trim(),
      description: emptyToNull(form.description),
      billing: {
        legalName: emptyToNull(form.legalName),
        taxId: emptyToNull(form.taxId),
        address: emptyToNull(form.address),
        phone: emptyToNull(form.phone),
        email: emptyToNull(form.email),
      },
    });
  }

  return (
    <Card className="max-w-3xl p-6">
      <CardHeader
        title="Empresa"
        subtitle={
          editable
            ? 'Nombre del proyecto y datos fiscales que aparecen en tus cotizaciones.'
            : 'Solo los administradores pueden editar estos datos.'
        }
      />
      <form onSubmit={onSubmit}>
        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" error={errors.name}>
            <Input value={form.name} onChange={set('name')} maxLength={255} />
          </Field>
          <Field label="Identificador" hint="No se puede cambiar.">
            <Input value={project.slug} readOnly disabled className="font-mono text-xs" />
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <Textarea value={form.description} onChange={set('description')} maxLength={2000} className="min-h-20" />
          </Field>

          <h4 className="pt-2 text-sm font-semibold text-ink sm:col-span-2">Datos de facturación</h4>
          <Field label="Razón social">
            <Input value={form.legalName} onChange={set('legalName')} maxLength={255} placeholder="Distribuidora El Quetzal, S.A." />
          </Field>
          <Field label="NIT">
            <Input value={form.taxId} onChange={set('taxId')} maxLength={32} placeholder="1234567-8" />
          </Field>
          <Field label="Dirección fiscal" className="sm:col-span-2">
            <Input value={form.address} onChange={set('address')} maxLength={500} placeholder="6a. Avenida 10-25, zona 1, Guatemala" />
          </Field>
          <Field label="Teléfono">
            <Input type="tel" value={form.phone} onChange={set('phone')} maxLength={32} placeholder="+502 2222 3333" />
          </Field>
          <Field label="Correo de facturación" error={errors.email}>
            <Input type="email" value={form.email} onChange={set('email')} maxLength={255} placeholder="facturacion@empresa.com" />
          </Field>
        </fieldset>
        {editable ? (
          <div className="mt-6 flex gap-2">
            <Button type="submit" loading={update.isPending} disabled={!dirty}>
              Guardar cambios
            </Button>
            <Button type="button" variant="secondary" disabled={!dirty} onClick={() => setForm(toForm(project))}>
              Descartar
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
