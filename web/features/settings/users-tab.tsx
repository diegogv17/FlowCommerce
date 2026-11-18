'use client';

import { useState } from 'react';
import { Check, Link2, Mail, Trash2, UserPlus, X } from 'lucide-react';
import type { Role } from '@flowcommerce/types';
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
  Select,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { useMe } from '@/hooks/use-session';
import { errorMessage } from '@/lib/api';
import { formatDate, formatRelative } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/labels';
import { siteUrl } from '@/features/auth/utils';
import {
  useAccessRequests,
  useChangeMemberRole,
  useCreateInvitation,
  useInvitations,
  useMembers,
  useRemoveMember,
  useResolveAccessRequest,
  useRevokeInvitation,
} from './hooks';
import { CopyButton, UserAvatar } from './shared';
import type { AccessRequestItem, InvitableRole, Member } from './types';

const ROLE_ORDER: Role[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-emerald-100 text-emerald-700',
  VIEWER: 'bg-slate-100 text-slate-700',
};

/**
 * Roles que el usuario actual puede asignar: nadie da un rol por encima del
 * suyo (el backend aplica la jerarquía exacta; esto solo evita opciones
 * inútiles en el menú).
 */
function assignableRoles(myRole: Role | undefined): Role[] {
  const index = myRole ? ROLE_ORDER.indexOf(myRole) : ROLE_ORDER.length;
  return ROLE_ORDER.filter((_, i) => i >= index);
}

export function UsersTab() {
  const { can, project } = useProject();
  const canInvite = can('MEMBER_INVITE');

  return (
    <div className="space-y-4">
      <MembersCard />
      {canInvite ? <InvitationsCard /> : null}
      {canInvite ? <AccessRequestsCard /> : null}
      {canInvite && project ? <AccessLinkCard projectId={project.id} /> : null}
    </div>
  );
}

/* ------------------------------ Miembros ------------------------------ */

function MembersCard() {
  const { can, project } = useProject();
  const { data: me } = useMe();
  const members = useMembers();
  const changeRole = useChangeMemberRole();
  const remove = useRemoveMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toRemove, setToRemove] = useState<Member | null>(null);

  const canChangeRole = can('MEMBER_UPDATE_ROLE');
  const canRemove = can('MEMBER_REMOVE');
  const roles = assignableRoles(project?.role);

  return (
    <Card className="p-0">
      <div className="p-5 pb-0">
        <CardHeader
          title="Equipo"
          subtitle="Personas con acceso a este proyecto y su rol."
          action={
            can('MEMBER_INVITE') ? (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" aria-hidden /> Invitar
              </Button>
            ) : null
          }
        />
      </div>

      {members.isLoading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : members.isError ? (
        <div className="p-5">
          <ErrorState message={errorMessage(members.error)} onRetry={() => members.refetch()} />
        </div>
      ) : !members.data?.length ? (
        <EmptyState title="Sin miembros" description="Invita a tu equipo para empezar a trabajar juntos." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th className="hidden md:table-cell">Teléfono</Th>
              <Th>Rol</Th>
              <Th className="w-12">
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {members.data.map((member) => {
              const isMe = member.userId === me?.id;
              // Solo se edita a quien tiene un rol igual o menor que el propio.
              const editable = !isMe && roles.includes(member.role);
              return (
                <Tr key={member.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={member.name} avatarUrl={member.avatarUrl} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {member.name} {isMe ? <span className="font-normal text-muted">(tú)</span> : null}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {member.email}
                          {member.position ? ` · ${member.position}` : ''}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted md:table-cell">{member.phone ?? '—'}</Td>
                  <Td>
                    {canChangeRole && editable ? (
                      <Select
                        aria-label={`Rol de ${member.name}`}
                        className="h-8 w-40 text-xs"
                        value={member.role}
                        disabled={changeRole.isPending}
                        onChange={(event) =>
                          changeRole.mutate({ membershipId: member.id, role: event.target.value })
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role] ?? role}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge className={ROLE_COLORS[member.role]}>{ROLE_LABELS[member.role] ?? member.role}</Badge>
                    )}
                  </Td>
                  <Td>
                    {canRemove && editable ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar a ${member.name}`}
                        onClick={() => setToRemove(member)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    ) : null}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={() => toRemove && remove.mutate(toRemove.id, { onSuccess: () => setToRemove(null) })}
        title={`¿Quitar a ${toRemove?.name ?? ''}?`}
        description="Perderá el acceso al proyecto. Sus leads y clientes quedarán sin responsable."
        confirmLabel="Quitar del proyecto"
        danger
        loading={remove.isPending}
      />
    </Card>
  );
}

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project } = useProject();
  const create = useCreateInvitation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('MEMBER');
  const [error, setError] = useState<string>();
  const roles = assignableRoles(project?.role).filter((r): r is InvitableRole => r !== 'OWNER');

  function close() {
    setEmail('');
    setRole('MEMBER');
    setError(undefined);
    onClose();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Escribe un correo válido.');
    setError(undefined);
    create.mutate({ email: email.trim(), role }, { onSuccess: close });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Invitar al equipo"
      description="Le enviaremos un enlace por correo (vence en 7 días). Si ya tenía una invitación, se reemplaza."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Correo electrónico" error={error}>
          <Input
            type="email"
            autoFocus
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Rol">
          <Select value={role} onChange={(event) => setRole(event.target.value as InvitableRole)}>
            {roles.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item] ?? item}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending}>
            <Mail className="h-4 w-4" aria-hidden /> Enviar invitación
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------------------------- Invitaciones ---------------------------- */

function InvitationsCard() {
  const invitations = useInvitations();
  const revoke = useRevokeInvitation();

  return (
    <Card>
      <CardHeader title="Invitaciones pendientes" subtitle="Enlaces enviados que aún no se aceptan." />
      {invitations.isLoading ? (
        <Skeleton className="h-16" />
      ) : invitations.isError ? (
        <ErrorState message={errorMessage(invitations.error)} onRetry={() => invitations.refetch()} />
      ) : !invitations.data?.length ? (
        <p className="text-sm text-muted">No hay invitaciones pendientes.</p>
      ) : (
        <ul className="divide-y divide-line/70">
          {invitations.data.map((invitation) => (
            <li key={invitation.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{invitation.email}</p>
                <p className="text-xs text-muted">
                  {ROLE_LABELS[invitation.role] ?? invitation.role} · enviada {formatRelative(invitation.creadoEn)} ·
                  vence {formatDate(invitation.expiresAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={revoke.isPending && revoke.variables === invitation.id}
                onClick={() => revoke.mutate(invitation.id)}
              >
                Revocar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------ Solicitudes de acceso ------------------------ */

const REQUEST_STATUS: Record<AccessRequestItem['status'], { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rechazada', color: 'bg-rose-100 text-rose-700' },
};

function AccessRequestsCard() {
  const requests = useAccessRequests();
  const resolve = useResolveAccessRequest();
  const [showHistory, setShowHistory] = useState(false);

  const all = requests.data ?? [];
  const pending = all.filter((item) => item.status === 'PENDING');
  const visible = showHistory ? all : pending;

  return (
    <Card>
      <CardHeader
        title="Solicitudes de acceso"
        subtitle="Personas que pidieron entrar desde la página de solicitud. Al aprobar, entran como Asesor."
        action={
          all.length > pending.length ? (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory((value) => !value)}>
              {showHistory ? 'Solo pendientes' : 'Ver historial'}
            </Button>
          ) : null
        }
      />
      {requests.isLoading ? (
        <Skeleton className="h-16" />
      ) : requests.isError ? (
        <ErrorState message={errorMessage(requests.error)} onRetry={() => requests.refetch()} />
      ) : !visible.length ? (
        <p className="text-sm text-muted">No hay solicitudes pendientes.</p>
      ) : (
        <ul className="divide-y divide-line/70">
          {visible.map((request) => {
            const status = REQUEST_STATUS[request.status];
            const busy = resolve.isPending && resolve.variables?.requestId === request.id;
            return (
              <li key={request.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{request.email}</p>
                  <p className="text-xs text-muted">Solicitada {formatRelative(request.creadoEn)}</p>
                </div>
                {request.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      disabled={busy}
                      onClick={() => resolve.mutate({ requestId: request.id, action: 'approve' })}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden /> Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => resolve.mutate({ requestId: request.id, action: 'reject' })}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden /> Rechazar
                    </Button>
                  </div>
                ) : (
                  <Badge className={status.color}>{status.label}</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Enlace público para que alguien sin cuenta pida entrar a este proyecto. */
function AccessLinkCard({ projectId }: { projectId: string }) {
  const link = `${siteUrl()}/solicitar-acceso?proyecto=${projectId}`;
  return (
    <Card>
      <CardHeader
        title="Enlace de solicitud de acceso"
        subtitle="Compártelo con quien necesite entrar; su solicitud aparecerá arriba para que la apruebes."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 text-xs text-muted">
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate font-mono">{link}</span>
        </div>
        <CopyButton value={link} label="Copiar enlace" />
      </div>
    </Card>
  );
}
