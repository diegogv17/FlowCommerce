'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Paginated } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type {
  ActivityEvent,
  Attachment,
  Client,
  ClientFilters,
  ClientInput,
  ClientStats,
  Member,
  PaginatedClients,
  UpdateClientInput,
} from './types';

export function useClients(filters: ClientFilters = {}) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['clients', projectId, filters],
    queryFn: () =>
      api.get<PaginatedClients>(path('/clients'), {
        search: filters.search,
        assignedUserId: filters.assignedUserId,
        active: filters.active,
        sortBy: filters.sortBy,
        order: filters.order,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      }),
    enabled: !!projectId,
  });
}

/** Clientes activos para selectores (máx. 100, el tope del backend). */
export function useClientOptions(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['clients', projectId, 'options'],
    queryFn: () =>
      api.get<PaginatedClients>(path('/clients'), { active: true, sortBy: 'name', order: 'asc', limit: 100 }),
    enabled: !!projectId && enabled,
    select: (result) => result.data,
    staleTime: 60_000,
  });
}

export function useClient(clientId: string | null | undefined) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['clients', projectId, 'detail', clientId],
    queryFn: () => api.get<Client>(path(`/clients/${clientId}`)),
    enabled: !!projectId && !!clientId,
  });
}

export function useClientStats(clientId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['clients', projectId, 'stats', clientId],
    queryFn: () => api.get<ClientStats>(path(`/clients/${clientId}/stats`)),
    enabled: !!projectId && !!clientId,
  });
}

export function useCreateClient() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientInput) => api.post<Client>(path('/clients'), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', projectId] }),
  });
}

export function useUpdateClient() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
      api.patch<Client>(path(`/clients/${id}`), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', projectId] }),
  });
}

export function useDeleteClient() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/clients/${id}`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', projectId] }),
  });
}

/** Miembros del proyecto (filtros "Responsable" y selector de asesor). */
export function useMembers() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: () => api.get<Member[]>(path('/members')),
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

/** Historial del cliente (incluye la actividad de sus leads). Más recientes primero. */
export function useClientActivity(clientId: string, options: { types?: string[]; page?: number; limit?: number } = {}) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['activity', projectId, { clientId, ...options }],
    queryFn: () =>
      api.get<Paginated<ActivityEvent>>(path('/activity'), {
        clientId,
        types: options.types,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
      }),
    enabled: !!projectId && !!clientId,
  });
}

export function useClientAttachments(clientId: string, page = 1) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['attachments', projectId, { clientId, page }],
    queryFn: () => api.get<Paginated<Attachment>>(path('/attachments'), { clientId, page, limit: 20 }),
    enabled: !!projectId && !!clientId,
  });
}

export function useUploadClientAttachment(clientId: string) {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('clientId', clientId);
      return api.upload<Attachment>(path('/attachments'), form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    },
  });
}

export function useDeleteAttachment() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/attachments/${id}`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', projectId] }),
  });
}
