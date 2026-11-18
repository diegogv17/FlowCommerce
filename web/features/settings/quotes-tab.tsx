'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, ErrorState, Field, Input, Select, Skeleton, Textarea } from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useProjectDetail, useUpdateProject } from './hooks';
import { emptyToNull } from './shared';
import type { QuoteSettings } from './types';

const CURRENCIES = [
  { value: 'GTQ', label: 'GTQ — Quetzal guatemalteco' },
  { value: 'USD', label: 'USD — Dólar estadounidense' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'MXN', label: 'MXN — Peso mexicano' },
  { value: 'HNL', label: 'HNL — Lempira hondureño' },
  { value: 'CRC', label: 'CRC — Colón costarricense' },
];

interface FormState {
  taxPercent: string;
  folioPrefix: string;
  validityDays: string;
  defaultTerms: string;
  currency: string;
}

function toForm(settings: QuoteSettings): FormState {
  return {
    taxPercent: String(settings.taxPercent),
    folioPrefix: settings.folioPrefix,
    validityDays: String(settings.validityDays),
    defaultTerms: settings.defaultTerms ?? '',
    currency: settings.currency,
  };
}

/** Ajustes de cotización: IVA, folio, vigencia, condiciones y moneda. */
export function QuotesTab() {
  const detail = useProjectDetail();
  if (detail.isLoading) return <Skeleton className="h-96 max-w-3xl rounded-2xl" />;
  if (detail.isError || !detail.data) {
    return <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />;
  }
  return <QuoteSettingsForm settings={detail.data.quoteSettings} />;
}

function QuoteSettingsForm({ settings }: { settings: QuoteSettings }) {
  const { can } = useProject();
  const editable = can('PROJECT_UPDATE');
  const update = useUpdateProject('Ajustes de cotización guardados');
  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => setForm(toForm(settings)), [settings]);

  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(settings));
  const set = (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Partial<Record<keyof FormState, string>> = {};
    const tax = Number(form.taxPercent);
    const days = Number(form.validityDays);
    if (form.taxPercent.trim() === '' || Number.isNaN(tax) || tax < 0 || tax > 100) {
      found.taxPercent = 'Entre 0 y 100.';
    } else if (!/^\d{1,3}(\.\d{1,2})?$/.test(form.taxPercent.trim())) {
      found.taxPercent = 'Máximo 2 decimales.';
    }
    if (!/^[A-Z0-9][A-Z0-9-]{0,15}$/.test(form.folioPrefix)) {
      found.folioPrefix = 'De 1 a 16 caracteres: A-Z, 0-9 o guion.';
    }
    if (!Number.isInteger(days) || days < 1 || days > 3650) found.validityDays = 'Entre 1 y 3650 días.';
    setErrors(found);
    if (Object.keys(found).length) return;
    update.mutate({
      quoteSettings: {
        taxPercent: tax,
        folioPrefix: form.folioPrefix,
        validityDays: days,
        defaultTerms: emptyToNull(form.defaultTerms),
        currency: form.currency,
      },
    });
  }

  const tax = Number(form.taxPercent) || 0;

  return (
    <Card className="max-w-3xl p-6">
      <CardHeader
        title="Cotizaciones"
        subtitle={
          editable
            ? 'Valores por defecto de cada cotización nueva. Las ya creadas no cambian.'
            : 'Solo los administradores pueden editar estos ajustes.'
        }
      />
      <form onSubmit={onSubmit}>
        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
          <Field label="IVA (%)" error={errors.taxPercent} hint="En Guatemala el IVA general es 12 %.">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              value={form.taxPercent}
              onChange={set('taxPercent')}
            />
          </Field>
          <Field label="Moneda">
            <Select value={form.currency} onChange={set('currency')}>
              {CURRENCIES.some((item) => item.value === form.currency) ? null : (
                <option value={form.currency}>{form.currency}</option>
              )}
              {CURRENCIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Prefijo del folio"
            error={errors.folioPrefix}
            hint={`Así se verán: ${form.folioPrefix || 'COT'}-000123`}
          >
            <Input
              value={form.folioPrefix}
              maxLength={16}
              className="font-mono uppercase"
              onChange={(event) =>
                setForm((current) => ({ ...current, folioPrefix: event.target.value.toUpperCase() }))
              }
            />
          </Field>
          <Field label="Vigencia (días)" error={errors.validityDays}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              step={1}
              value={form.validityDays}
              onChange={set('validityDays')}
            />
          </Field>
          <Field
            label="Condiciones por defecto"
            className="sm:col-span-2"
            hint="Formas de pago, tiempos de entrega, garantía…"
          >
            <Textarea value={form.defaultTerms} onChange={set('defaultTerms')} maxLength={10000} className="min-h-32" />
          </Field>
        </fieldset>

        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-muted">
          Ejemplo: un subtotal de {formatMoney(1000, form.currency)} queda en{' '}
          <b className="text-ink">{formatMoney(1000 * (1 + tax / 100), form.currency)}</b> con IVA del {tax}%.
        </p>

        {editable ? (
          <div className="mt-6 flex gap-2">
            <Button type="submit" loading={update.isPending} disabled={!dirty}>
              Guardar cambios
            </Button>
            <Button type="button" variant="secondary" disabled={!dirty} onClick={() => setForm(toForm(settings))}>
              Descartar
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
