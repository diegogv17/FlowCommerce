'use client';

import { useState } from 'react';
import { CircleCheck, CircleAlert, Unplug } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  Field,
  Input,
  Skeleton,
} from '@/components/ui';
import { API_URL, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { PasswordInput } from '@/features/auth/password-input';
import { useDeleteWhatsAppConfig, useSaveWhatsAppConfig, useWhatsAppConfig } from './hooks';
import { CopyButton } from './shared';
import type { WhatsAppConfig } from './types';

const NUMERIC_ID = /^\d{5,30}$/;

/**
 * Conexión con WhatsApp Cloud API. El token se guarda cifrado en el backend y
 * NUNCA vuelve: aquí solo se muestran sus últimos 4 caracteres y, para
 * cambiarlo, hay que escribirlo completo otra vez.
 */
export function WhatsAppTab() {
  const config = useWhatsAppConfig();
  if (config.isLoading) return <Skeleton className="h-96 max-w-3xl rounded-2xl" />;
  if (config.isError || !config.data) {
    return <ErrorState message={errorMessage(config.error)} onRetry={() => config.refetch()} />;
  }
  return <WhatsAppForm config={config.data} />;
}

function WhatsAppForm({ config }: { config: WhatsAppConfig }) {
  const save = useSaveWhatsAppConfig();
  const disconnect = useDeleteWhatsAppConfig();
  const [phoneNumberId, setPhoneNumberId] = useState(config.phoneNumberId ?? '');
  const [businessAccountId, setBusinessAccountId] = useState(config.businessAccountId ?? '');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const webhookUrl = `${API_URL}/webhooks/whatsapp`;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!NUMERIC_ID.test(phoneNumberId.trim())) found.phoneNumberId = 'Solo dígitos (5 a 30).';
    if (businessAccountId.trim() && !NUMERIC_ID.test(businessAccountId.trim())) {
      found.businessAccountId = 'Solo dígitos (5 a 30).';
    }
    if (!token.trim()) found.token = 'Pega el token de acceso permanente.';
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(
      {
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim() || undefined,
        token: token.trim(),
      },
      { onSuccess: () => setToken('') },
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {config.connected ? (
              <CircleCheck className="mt-0.5 h-6 w-6 text-emerald-500" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 h-6 w-6 text-amber-500" aria-hidden />
            )}
            <div>
              <p className="font-semibold text-ink">
                {config.connected ? 'WhatsApp conectado' : 'WhatsApp sin conectar'}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {config.source === 'project'
                  ? `Cuenta propia del proyecto${config.updatedAt ? ` · actualizada ${formatDateTime(config.updatedAt)}` : ''}.`
                  : config.source === 'environment'
                    ? 'Usando la cuenta global del servidor. Guarda tu propia cuenta abajo para reemplazarla.'
                    : 'Conecta tu número de WhatsApp Business para recibir y enviar mensajes desde el CRM.'}
              </p>
              {config.tokenLast4 ? (
                <Badge className="mt-2 font-mono">Token ••••{config.tokenLast4}</Badge>
              ) : null}
            </div>
          </div>
          {config.source === 'project' ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
              <Unplug className="h-3.5 w-3.5" aria-hidden /> Desconectar
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-6">
        <CardHeader
          title={config.source === 'project' ? 'Reemplazar conexión' : 'Conectar cuenta'}
          subtitle="Datos de Meta for Developers → WhatsApp → Configuración de la API."
        />
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Phone number ID"
            error={errors.phoneNumberId}
            hint="Identificador del número en Meta (no es el número de teléfono)."
          >
            <Input
              inputMode="numeric"
              className="font-mono"
              placeholder="123456789012345"
              value={phoneNumberId}
              onChange={(event) => setPhoneNumberId(event.target.value)}
            />
          </Field>
          <Field
            label="WhatsApp Business Account ID (opcional)"
            error={errors.businessAccountId}
            hint="Necesario para gestionar plantillas."
          >
            <Input
              inputMode="numeric"
              className="font-mono"
              placeholder="109876543210987"
              value={businessAccountId}
              onChange={(event) => setBusinessAccountId(event.target.value)}
            />
          </Field>
          <Field
            label="Token de acceso permanente"
            className="sm:col-span-2"
            error={errors.token}
            hint={
              config.tokenLast4
                ? `Por seguridad no mostramos el token guardado (termina en ${config.tokenLast4}). Escríbelo de nuevo para guardar.`
                : 'Se guarda cifrado y nunca se vuelve a mostrar.'
            }
          >
            <PasswordInput
              className="h-10 font-mono"
              autoComplete="off"
              placeholder="EAAG…"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              maxLength={1000}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Guardar conexión
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <CardHeader
          title="Webhook para Meta"
          subtitle="Configúralo en Meta como URL de devolución de llamada (con el token de verificación del servidor) y suscríbete a «messages»."
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-ink">
            {webhookUrl}
          </code>
          <CopyButton value={webhookUrl} label="Copiar URL" />
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => disconnect.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })}
        title="¿Desconectar WhatsApp?"
        description="Se borra el token guardado. Dejarás de recibir y enviar mensajes con este número hasta que lo conectes otra vez."
        confirmLabel="Desconectar"
        danger
        loading={disconnect.isPending}
      />
    </div>
  );
}
