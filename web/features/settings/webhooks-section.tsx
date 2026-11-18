'use client';

import { useState } from 'react';
import { History, Pencil, Plus, RotateCw, Send, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  Spinner,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import {
  useDeleteWebhook,
  useRotateWebhookSecret,
  useSaveWebhook,
  useTestWebhook,
  useToggleWebhook,
  useWebhookDeliveries,
  useWebhookEvents,
  useWebhooks,
} from './hooks';
import { SecretDialog, Switch, emptyToNull } from './shared';
import { ALL_WEBHOOK_EVENTS, type Webhook } from './types';

function eventsLabel(events: string[]) {
  if (events.includes(ALL_WEBHOOK_EVENTS)) return 'Todos los eventos';
  if (events.length <= 2) return events.join(', ');
  return `${events.slice(0, 2).join(', ')} +${events.length - 2}`;
}

/** Webhooks salientes firmados con X-Flowcommerce-Signature. */
export function WebhooksSection() {
  const webhooks = useWebhooks();
  const toggle = useToggleWebhook();
  const test = useTestWebhook();
  const rotate = useRotateWebhookSecret();
  const remove = useDeleteWebhook();

  const [editing, setEditing] = useState<Webhook | 'new' | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [deliveriesOf, setDeliveriesOf] = useState<Webhook | null>(null);
  const [toRotate, setToRotate] = useState<Webhook | null>(null);
  const [toDelete, setToDelete] = useState<Webhook | null>(null);

  return (
    <Card className="p-0">
      <div className="p-5 pb-0">
        <CardHeader
          title="Webhooks salientes"
          subtitle="Avisamos a tus sistemas (ERP, automatizaciones) cuando pasa algo en el CRM. Cada envío va firmado."
          action={
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Nuevo webhook
            </Button>
          }
        />
      </div>

      {webhooks.isLoading ? (
        <div className="p-5">
          <Skeleton className="h-20" />
        </div>
      ) : webhooks.isError ? (
        <div className="p-5">
          <ErrorState message={errorMessage(webhooks.error)} onRetry={() => webhooks.refetch()} />
        </div>
      ) : !webhooks.data?.length ? (
        <EmptyState
          icon={<WebhookIcon className="h-6 w-6" />}
          title="Sin webhooks"
          description="Registra una URL https para recibir eventos como lead.created o quote.status_changed."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>URL</Th>
              <Th className="hidden md:table-cell">Eventos</Th>
              <Th>Activo</Th>
              <Th className="w-48">
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {webhooks.data.map((webhook) => (
              <Tr key={webhook.id}>
                <Td className="max-w-[16rem]">
                  <p className="truncate font-mono text-xs font-semibold text-ink" title={webhook.url}>
                    {webhook.url}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {webhook.description ?? 'Sin descripción'} · secreto {webhook.secretPrefix}…
                  </p>
                </Td>
                <Td className="hidden text-xs text-muted md:table-cell">{eventsLabel(webhook.events)}</Td>
                <Td>
                  <Switch
                    checked={webhook.active}
                    label={webhook.active ? 'Pausar webhook' : 'Reactivar webhook'}
                    disabled={toggle.isPending && toggle.variables?.id === webhook.id}
                    onChange={(active) => toggle.mutate({ id: webhook.id, active })}
                  />
                </Td>
                <Td>
                  <div className="flex justify-end gap-0.5">
                    <IconAction
                      icon={Send}
                      label="Enviar ping de prueba"
                      loading={test.isPending && test.variables === webhook.id}
                      onClick={() => test.mutate(webhook.id)}
                    />
                    <IconAction icon={History} label="Ver entregas" onClick={() => setDeliveriesOf(webhook)} />
                    <IconAction icon={Pencil} label="Editar webhook" onClick={() => setEditing(webhook)} />
                    <IconAction icon={RotateCw} label="Rotar secreto" onClick={() => setToRotate(webhook)} />
                    <IconAction icon={Trash2} label="Eliminar webhook" danger onClick={() => setToDelete(webhook)} />
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {editing !== null ? (
        <WebhookDialog
          webhook={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSecret={setSecret}
        />
      ) : null}
      <SecretDialog
        secret={secret}
        onClose={() => setSecret(null)}
        title="Secreto de firma"
        description="Configúralo en tu servicio para verificar la cabecera X-Flowcommerce-Signature de cada envío."
      />
      <DeliveriesDialog webhook={deliveriesOf} onClose={() => setDeliveriesOf(null)} />
      <ConfirmDialog
        open={toRotate !== null}
        onClose={() => setToRotate(null)}
        onConfirm={() =>
          toRotate &&
          rotate.mutate(toRotate.id, {
            onSuccess: (result) => {
              setToRotate(null);
              setSecret(result.secret);
            },
          })
        }
        title="¿Generar un secreto nuevo?"
        description="El secreto actual deja de valer al instante: actualízalo enseguida en tu servicio."
        confirmLabel="Rotar secreto"
        loading={rotate.isPending}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        title="¿Eliminar este webhook?"
        description="Se borra junto con su historial de entregas."
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
      />
    </Card>
  );
}

function IconAction({
  icon: Icon,
  label,
  onClick,
  danger,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={onClick} disabled={loading}>
      {loading ? <Spinner className="h-4 w-4" /> : <Icon className={danger ? 'h-4 w-4 text-rose-500' : 'h-4 w-4'} />}
    </Button>
  );
}

function WebhookDialog({
  webhook,
  onClose,
  onSecret,
}: {
  webhook: Webhook | null;
  onClose: () => void;
  onSecret: (secret: string) => void;
}) {
  const save = useSaveWebhook();
  const catalog = useWebhookEvents();
  const [url, setUrl] = useState(webhook?.url ?? '');
  const [description, setDescription] = useState(webhook?.description ?? '');
  const [events, setEvents] = useState<string[]>(webhook?.events ?? [ALL_WEBHOOK_EVENTS]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const all = events.includes(ALL_WEBHOOK_EVENTS);
  const specific = (catalog.data?.events ?? []).filter((event) => event !== ALL_WEBHOOK_EVENTS);

  function toggle(event: string) {
    setEvents((current) => {
      const base = current.filter((item) => item !== ALL_WEBHOOK_EVENTS);
      return base.includes(event) ? base.filter((item) => item !== event) : [...base, event];
    });
  }

  function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const found: Record<string, string> = {};
    if (!/^https?:\/\/\S+$/i.test(url.trim())) found.url = 'Escribe una URL completa (https://…).';
    if (!events.length) found.events = 'Elige al menos un evento.';
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(
      {
        id: webhook?.id,
        input: {
          url: url.trim(),
          description: webhook ? emptyToNull(description) : description.trim() || undefined,
          events,
        },
      },
      {
        onSuccess: (result) => {
          onClose();
          if ('secret' in result && result.secret) onSecret(result.secret);
        },
      },
    );
  }

  return (
    <Dialog open onClose={onClose} title={webhook ? 'Editar webhook' : 'Nuevo webhook'} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="URL de destino" error={errors.url} hint="Debe ser https y pública.">
          <Input
            autoFocus
            type="url"
            className="font-mono text-xs"
            placeholder="https://mi-servicio.com/hooks/flowcommerce"
            maxLength={2048}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>
        <Field label="Descripción (opcional)">
          <Input
            placeholder="Sincroniza leads con mi ERP"
            maxLength={200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Eventos</legend>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-500"
              checked={all}
              onChange={() => setEvents(all ? [] : [ALL_WEBHOOK_EVENTS])}
            />
            Todos los eventos (incluye los que se agreguen después)
          </label>
          {catalog.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2">
              {specific.map((event) => (
                <label key={event} className="flex cursor-pointer items-center gap-2 font-mono text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={all || events.includes(event)}
                    disabled={all}
                    onChange={() => toggle(event)}
                  />
                  {event}
                </label>
              ))}
            </div>
          )}
          {errors.events ? <p className="mt-1 text-xs text-rose-600">{errors.events}</p> : null}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={save.isPending}>
            {webhook ? 'Guardar' : 'Crear webhook'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DeliveriesDialog({ webhook, onClose }: { webhook: Webhook | null; onClose: () => void }) {
  const deliveries = useWebhookDeliveries(webhook?.id ?? null);
  return (
    <Dialog
      open={webhook !== null}
      onClose={onClose}
      title="Últimas entregas"
      description={webhook?.url}
      size="xl"
    >
      {deliveries.isLoading ? (
        <Skeleton className="h-40" />
      ) : deliveries.isError ? (
        <ErrorState message={errorMessage(deliveries.error)} onRetry={() => deliveries.refetch()} />
      ) : !deliveries.data?.length ? (
        <EmptyState title="Sin entregas todavía" description="Envía un ping de prueba para verificar la conexión." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Evento</Th>
              <Th>Resultado</Th>
              <Th className="hidden sm:table-cell">Intentos</Th>
              <Th className="hidden sm:table-cell">Duración</Th>
            </tr>
          </thead>
          <tbody>
            {deliveries.data.map((delivery) => (
              <Tr key={delivery.id}>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(delivery.createdAt)}</Td>
                <Td className="font-mono text-xs">{delivery.event}</Td>
                <Td>
                  <Badge
                    className={
                      delivery.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }
                  >
                    {delivery.status === 'SUCCESS' ? 'Entregado' : 'Falló'}
                    {delivery.responseStatus ? ` · ${delivery.responseStatus}` : ''}
                  </Badge>
                  {delivery.error ? (
                    <p className="mt-1 max-w-xs truncate text-[11px] text-rose-600" title={delivery.error}>
                      {delivery.error}
                    </p>
                  ) : null}
                </Td>
                <Td className="hidden sm:table-cell">{delivery.attempts}</Td>
                <Td className="hidden whitespace-nowrap text-xs text-muted sm:table-cell">
                  {delivery.durationMs !== null ? `${delivery.durationMs} ms` : '—'}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Dialog>
  );
}
