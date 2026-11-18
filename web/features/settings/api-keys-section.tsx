'use client';

import { useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
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
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { formatDate, formatRelative } from '@/lib/format';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from './hooks';
import { SecretDialog } from './shared';
import { API_KEY_SCOPES, type ApiKey, type ApiKeyScope } from './types';

function scopeLabel(scope: string) {
  return API_KEY_SCOPES.find((item) => item.value === scope)?.label ?? scope;
}

/** API keys para el servicio de IA u otras integraciones. */
export function ApiKeysSection() {
  const keys = useApiKeys();
  const revoke = useRevokeApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [toRevoke, setToRevoke] = useState<ApiKey | null>(null);

  return (
    <Card className="p-0">
      <div className="p-5 pb-0">
        <CardHeader
          title="API keys"
          subtitle="Para que el servicio de IA (u otro sistema) lea el catálogo y registre leads y cotizaciones. Actúa con tus permisos."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Nueva clave
            </Button>
          }
        />
      </div>

      {keys.isLoading ? (
        <div className="p-5">
          <Skeleton className="h-20" />
        </div>
      ) : keys.isError ? (
        <div className="p-5">
          <ErrorState message={errorMessage(keys.error)} onRetry={() => keys.refetch()} />
        </div>
      ) : !keys.data?.length ? (
        <EmptyState icon={<KeyRound className="h-6 w-6" />} title="Sin API keys" description="Crea una para conectar el servicio de IA." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Permisos</Th>
              <Th className="hidden md:table-cell">Último uso</Th>
              <Th className="hidden md:table-cell">Creada</Th>
              <Th className="w-24">
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {keys.data.map((key) => (
              <Tr key={key.id} className={key.revokedAt ? 'opacity-60' : undefined}>
                <Td>
                  <p className="font-semibold text-ink">{key.name}</p>
                  <p className="font-mono text-xs text-muted">{key.prefix}…</p>
                </Td>
                <Td>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {key.scopes.map((scope) => (
                      <Badge key={scope} className="bg-slate-100 text-[10px]">
                        {scopeLabel(scope)}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="hidden whitespace-nowrap text-muted md:table-cell">
                  {key.lastUsedAt ? formatRelative(key.lastUsedAt) : 'Nunca'}
                </Td>
                <Td className="hidden whitespace-nowrap text-muted md:table-cell">{formatDate(key.creadoEn)}</Td>
                <Td>
                  {key.revokedAt ? (
                    <Badge className="bg-rose-100 text-rose-700">Revocada</Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setToRevoke(key)}>
                      Revocar
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {createOpen ? (
        <CreateApiKeyDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(key) => {
            setCreateOpen(false);
            setNewKey(key);
          }}
        />
      ) : null}
      <SecretDialog
        secret={newKey}
        onClose={() => setNewKey(null)}
        title="Tu nueva API key"
        description="Úsala en el encabezado Authorization: Bearer <clave> del servicio que conectes."
      />
      <ConfirmDialog
        open={toRevoke !== null}
        onClose={() => setToRevoke(null)}
        onConfirm={() => toRevoke && revoke.mutate(toRevoke.id, { onSuccess: () => setToRevoke(null) })}
        title={`¿Revocar «${toRevoke?.name ?? ''}»?`}
        description="Dejará de funcionar al instante. Los servicios que la usen recibirán 401."
        confirmLabel="Revocar"
        danger
        loading={revoke.isPending}
      />
    </Card>
  );
}

function CreateApiKeyDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const create = useCreateApiKey();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiKeyScope[]>(API_KEY_SCOPES.map((item) => item.value));
  const [error, setError] = useState<string>();

  function toggle(scope: ApiKeyScope) {
    setScopes((current) => (current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope]));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return setError('Ponle un nombre para reconocerla.');
    if (!scopes.length) return setError('Elige al menos un permiso.');
    setError(undefined);
    create.mutate({ name: name.trim(), scopes }, { onSuccess: (created) => onCreated(created.key) });
  }

  return (
    <Dialog open onClose={onClose} title="Nueva API key" description="Da a cada servicio solo los permisos que necesita.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nombre" error={error}>
          <Input autoFocus placeholder="Servicio de IA" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Permisos</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {API_KEY_SCOPES.map((scope) => (
              <label
                key={scope.value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={scopes.includes(scope.value)}
                  onChange={() => toggle(scope.value)}
                />
                <span>
                  {scope.label} <span className="font-mono text-[10px] text-muted">{scope.value}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending}>
            Crear clave
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
