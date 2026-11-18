'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type { Me, RoleCatalog } from '@/hooks/use-session';
import type {
  AccessRequestItem,
  ApiKey,
  ApiKeyScope,
  CreatedApiKey,
  CreatedWebhook,
  InvitableRole,
  Invitation,
  Member,
  ProjectDetail,
  QuickReply,
  QuickReplyInput,
  SaveWhatsAppConfigInput,
  UpdateProjectInput,
  Webhook,
  WebhookDelivery,
  WebhookInput,
  WebhookTestResult,
  WhatsAppConfig,
} from './types';

const onError = (error: unknown) => toast.error(errorMessage(error));

/* ----------------------------- Perfil ----------------------------- */

export interface ProfileInput {
  name?: string;
  phone?: string | null;
  position?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => api.patch<Me>('/users/me', input),
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Perfil actualizado');
    },
    onError,
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.upload<Me>('/users/me/avatar', form, 'PUT');
    },
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Foto actualizada');
    },
    onError,
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/users/me/avatar'),
    onSuccess: () => {
      queryClient.setQueryData<Me | undefined>(['me'], (me) => (me ? { ...me, avatarUrl: null } : me));
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Foto eliminada');
    },
    onError,
  });
}

/* ---------------------------- Proyecto ---------------------------- */

export function useProjectDetail() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<ProjectDetail>(path()),
    enabled: !!projectId,
  });
}

export function useUpdateProject(successMessage = 'Cambios guardados') {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => api.patch<ProjectDetail>(path(), input),
    onSuccess: (project) => {
      queryClient.setQueryData(['project', projectId], project);
      queryClient.invalidateQueries({ queryKey: ['projects', 'my'] });
      toast.success(successMessage);
    },
    onError,
  });
}

export function useRoleCatalog() {
  const { projectId, path } = useProject();
  // Misma queryKey que usa ProjectProvider para can(): comparte la caché.
  return useQuery({
    queryKey: ['roles', projectId],
    queryFn: () => api.get<RoleCatalog>(path('/roles')),
    enabled: !!projectId,
    staleTime: Infinity,
  });
}

/* ---------------------- Miembros e invitaciones ---------------------- */

export function useMembers() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: () => api.get<Member[]>(path('/members')),
    enabled: !!projectId,
  });
}

export function useChangeMemberRole() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: string }) =>
      api.patch<Member>(path(`/members/${membershipId}`), { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      toast.success('Rol actualizado');
    },
    onError,
  });
}

export function useRemoveMember() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => api.delete(path(`/members/${membershipId}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      toast.success('Miembro quitado del proyecto');
    },
    onError,
  });
}

export function useInvitations(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['invitations', projectId],
    queryFn: () => api.get<Invitation[]>(path('/invitations')),
    enabled: !!projectId && enabled,
  });
}

export function useCreateInvitation() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: InvitableRole }) =>
      api.post<Invitation>(path('/invitations'), input),
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      toast.success(`Invitación enviada a ${invitation.email}`);
    },
    onError,
  });
}

export function useRevokeInvitation() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => api.delete(path(`/invitations/${invitationId}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      toast.success('Invitación revocada');
    },
    onError,
  });
}

export function useAccessRequests(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['access-requests', projectId],
    queryFn: () => api.get<AccessRequestItem[]>(path('/access-requests')),
    enabled: !!projectId && enabled,
  });
}

export function useResolveAccessRequest() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      api.post<AccessRequestItem>(path(`/access-requests/${requestId}/${action}`)),
    onSuccess: (_result, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', projectId] });
      if (action === 'approve') {
        queryClient.invalidateQueries({ queryKey: ['members', projectId] });
        toast.success('Solicitud aprobada: le enviamos un correo para crear su contraseña');
      } else {
        toast.success('Solicitud rechazada');
      }
    },
    onError,
  });
}

/* ----------------------------- WhatsApp ----------------------------- */

export function useWhatsAppConfig(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['whatsapp-config', projectId],
    queryFn: () => api.get<WhatsAppConfig>(path('/whatsapp/config')),
    enabled: !!projectId && enabled,
  });
}

export function useSaveWhatsAppConfig() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWhatsAppConfigInput) => api.put<WhatsAppConfig>(path('/whatsapp/config'), input),
    onSuccess: (config) => {
      queryClient.setQueryData(['whatsapp-config', projectId], config);
      toast.success('WhatsApp conectado');
    },
    onError,
  });
}

export function useDeleteWhatsAppConfig() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(path('/whatsapp/config')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config', projectId] });
      toast.success('WhatsApp desconectado');
    },
    onError,
  });
}

/* ------------------------- Respuestas rápidas ------------------------- */

export function useQuickReplies(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['quick-replies', projectId],
    queryFn: () => api.get<QuickReply[]>(path('/quick-replies')),
    enabled: !!projectId && enabled,
  });
}

export function useSaveQuickReply() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: QuickReplyInput }) =>
      id
        ? api.patch<QuickReply>(path(`/quick-replies/${id}`), input)
        : api.post<QuickReply>(path('/quick-replies'), input),
    onSuccess: (_reply, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies', projectId] });
      toast.success(id ? 'Respuesta actualizada' : 'Respuesta creada');
    },
    onError,
  });
}

export function useDeleteQuickReply() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/quick-replies/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies', projectId] });
      toast.success('Respuesta eliminada');
    },
    onError,
  });
}

/* ------------------------------ API keys ------------------------------ */

export function useApiKeys(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['api-keys', projectId],
    queryFn: () => api.get<ApiKey[]>(path('/api-keys')),
    enabled: !!projectId && enabled,
  });
}

export function useCreateApiKey() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; scopes?: ApiKeyScope[] }) =>
      api.post<CreatedApiKey>(path('/api-keys'), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys', projectId] }),
    onError,
  });
}

export function useRevokeApiKey() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => api.delete(path(`/api-keys/${keyId}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', projectId] });
      toast.success('API key revocada');
    },
    onError,
  });
}

/* ------------------------------ Webhooks ------------------------------ */

export function useWebhooks(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['webhooks', projectId],
    queryFn: () => api.get<Webhook[]>(path('/webhooks')),
    enabled: !!projectId && enabled,
  });
}

export function useWebhookEvents(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['webhooks', projectId, 'events'],
    queryFn: () => api.get<{ events: string[] }>(path('/webhooks/events')),
    enabled: !!projectId && enabled,
    staleTime: Infinity,
  });
}

export function useSaveWebhook() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WebhookInput }): Promise<Webhook | CreatedWebhook> =>
      id
        ? api.patch<Webhook>(path(`/webhooks/${id}`), input)
        : api.post<CreatedWebhook>(path('/webhooks'), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] }),
    onError,
  });
}

export function useToggleWebhook() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch<Webhook>(path(`/webhooks/${id}`), { active }),
    onSuccess: (webhook) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] });
      toast.success(webhook.active ? 'Webhook reactivado' : 'Webhook pausado');
    },
    onError,
  });
}

export function useRotateWebhookSecret() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<CreatedWebhook>(path(`/webhooks/${id}/rotate-secret`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] }),
    onError,
  });
}

export function useTestWebhook() {
  const { path } = useProject();
  return useMutation({
    mutationFn: (id: string) => api.post<WebhookTestResult>(path(`/webhooks/${id}/test`)),
    onSuccess: (result) => {
      if (result.status === 'SUCCESS') {
        toast.success(`Ping entregado (HTTP ${result.responseStatus ?? '—'})`);
      } else {
        toast.error(
          `El ping falló${result.responseStatus ? ` (HTTP ${result.responseStatus})` : ''}${
            result.error ? `: ${result.error}` : ''
          }`,
        );
      }
    },
    onError,
  });
}

export function useWebhookDeliveries(webhookId: string | null) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['webhooks', projectId, 'deliveries', webhookId],
    queryFn: () => api.get<WebhookDelivery[]>(path(`/webhooks/${webhookId}/deliveries`)),
    enabled: !!projectId && !!webhookId,
  });
}

export function useDeleteWebhook() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/webhooks/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] });
      toast.success('Webhook eliminado');
    },
    onError,
  });
}
