'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LeadStage } from '@flowcommerce/types';
import { api, type Paginated } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type {
  ActivityEvent,
  Attachment,
  ConvertLeadInput,
  ConvertLeadResponse,
  CreateFollowUpInput,
  FollowUp,
  Lead,
  LeadFilters,
  LeadInput,
  LeadQuote,
  LeadView,
  LeadViewFilters,
  Member,
  ProductOption,
  UpdateFollowUpInput,
} from './types';

// Etapas que cuentan como "activas" en el embudo (igual que el backend).
export const ACTIVE_STAGES: LeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
// Columnas del kanban: todo menos LOST.
export const PIPELINE_STAGES: LeadStage[] = [...ACTIVE_STAGES, 'WON'];

/** Quita claves vacías para que la queryKey sea estable. */
function clean<T extends object>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined || item === null || item === '') continue;
    if (Array.isArray(item) && item.length === 0) continue;
    out[key] = item;
  }
  return out as T;
}

/* ------------------------------ Leads ------------------------------ */

export function useLeads(filters: LeadFilters, page: number, limit = 10) {
  const { projectId, path } = useProject();
  const query = clean({ ...filters, page, limit });
  return useQuery({
    queryKey: ['leads', projectId, 'list', query],
    queryFn: ({ signal }) =>
      api.get<Paginated<Lead>>(path('/leads'), { ...query, stages: filters.stages ?? [] }, signal),
    enabled: !!projectId,
    placeholderData: (previous) => previous,
  });
}

/** Todos los leads del kanban (hasta 100, el máximo de la API). */
export function usePipelineLeads(filters: Omit<LeadFilters, 'stages'>) {
  const { projectId, path } = useProject();
  const query = clean({ ...filters, limit: 100, page: 1 });
  return useQuery({
    queryKey: ['leads', projectId, 'pipeline', query],
    queryFn: ({ signal }) =>
      api.get<Paginated<Lead>>(path('/leads'), { ...query, stages: PIPELINE_STAGES }, signal),
    enabled: !!projectId,
  });
}

/** Buscador de leads para los selectores (seguimiento, etc.). */
export function useLeadSearch(search: string, enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['leads', projectId, 'search', search],
    queryFn: ({ signal }) =>
      api.get<Paginated<Lead>>(path('/leads'), { search, limit: 8, sortBy: 'updatedAt', order: 'desc' }, signal),
    enabled: !!projectId && enabled,
    staleTime: 30_000,
  });
}

export function useLead(leadId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['leads', projectId, 'detail', leadId],
    queryFn: () => api.get<Lead>(path(`/leads/${leadId}`)),
    enabled: !!projectId && !!leadId,
  });
}

/** Invalida todo lo que depende de los leads (listas, detalle, dashboard, actividad). */
function useInvalidateLeads() {
  const queryClient = useQueryClient();
  const { projectId } = useProject();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['leads', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
  };
}

export function useCreateLead() {
  const { path } = useProject();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (input: LeadInput) => api.post<Lead>(path('/leads'), input),
    onSuccess: invalidate,
  });
}

export function useUpdateLead(leadId: string) {
  const { path, projectId } = useProject();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (input: LeadInput) => api.patch<Lead>(path(`/leads/${leadId}`), input),
    onSuccess: (lead) => {
      queryClient.setQueryData(['leads', projectId, 'detail', leadId], lead);
      invalidate();
    },
  });
}

export function useDeleteLead() {
  const { path } = useProject();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (leadId: string) => api.delete(path(`/leads/${leadId}`)),
    onSuccess: invalidate,
  });
}

/**
 * Cambia la etapa desde el kanban con actualización optimista: mueve la
 * tarjeta en la caché al instante y, si la API falla, la regresa.
 */
export function useMoveLeadStage() {
  const { path, projectId } = useProject();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLeads();
  const pipelineKey = ['leads', projectId, 'pipeline'];

  return useMutation({
    mutationFn: ({ leadId, stage }: { leadId: string; stage: LeadStage }) =>
      api.patch<Lead>(path(`/leads/${leadId}`), { stage }),
    onMutate: async ({ leadId, stage }) => {
      await queryClient.cancelQueries({ queryKey: pipelineKey });
      const snapshot = queryClient.getQueriesData<Paginated<Lead>>({ queryKey: pipelineKey });
      queryClient.setQueriesData<Paginated<Lead>>({ queryKey: pipelineKey }, (old) =>
        old
          ? { ...old, data: old.data.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)) }
          : old,
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidate,
  });
}

export function useConvertLead(leadId: string) {
  const { path, projectId } = useProject();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (input: ConvertLeadInput) =>
      api.post<ConvertLeadResponse>(path(`/leads/${leadId}/convert`), input),
    onSuccess: (result) => {
      queryClient.setQueryData(['leads', projectId, 'detail', leadId], result.lead);
      void queryClient.invalidateQueries({ queryKey: ['clients', projectId] });
      invalidate();
    },
  });
}

/* --------------------------- Catálogos ----------------------------- */

export function useMembers() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: () => api.get<Member[]>(path('/members')),
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

export function useProductOptions() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['products', projectId, 'options'],
    queryFn: () => api.get<Paginated<ProductOption>>(path('/products'), { active: true, limit: 100 }),
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    select: (result) => result.data,
  });
}

/* ------------------------- Vistas guardadas ------------------------ */

export function useLeadViews() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['lead-views', projectId],
    queryFn: () => api.get<LeadView[]>(path('/lead-views')),
    enabled: !!projectId,
  });
}

export function useSaveLeadView() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, filters }: { id?: string; name?: string; filters?: LeadViewFilters }) =>
      id
        ? api.patch<LeadView>(path(`/lead-views/${id}`), clean({ name, filters }))
        : api.post<LeadView>(path('/lead-views'), { name, filters }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-views', projectId] }),
  });
}

export function useDeleteLeadView() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/lead-views/${id}`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-views', projectId] }),
  });
}

/* --------------------------- Seguimientos -------------------------- */

export function useLeadFollowUps(leadId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['follow-ups', projectId, { leadId }],
    queryFn: () => api.get<Paginated<FollowUp>>(path('/follow-ups'), { leadId, limit: 100 }),
    enabled: !!projectId && !!leadId,
  });
}

function useInvalidateFollowUps() {
  const queryClient = useQueryClient();
  const { projectId } = useProject();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['follow-ups', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['leads', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['notifications', projectId] });
  };
}

export function useCreateFollowUp() {
  const { path } = useProject();
  const invalidate = useInvalidateFollowUps();
  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: CreateFollowUpInput }) =>
      api.post<FollowUp>(path(`/leads/${leadId}/follow-ups`), input),
    onSuccess: invalidate,
  });
}

export function useUpdateFollowUp() {
  const { path } = useProject();
  const invalidate = useInvalidateFollowUps();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFollowUpInput }) =>
      api.patch<FollowUp>(path(`/follow-ups/${id}`), input),
    onSuccess: invalidate,
  });
}

export function useDeleteFollowUp() {
  const { path } = useProject();
  const invalidate = useInvalidateFollowUps();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/follow-ups/${id}`)),
    onSuccess: invalidate,
  });
}

/* ------------------- Pestañas del detalle del lead ------------------ */

export function useLeadQuotes(leadId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['quotes', projectId, { leadId }],
    queryFn: () => api.get<Paginated<LeadQuote>>(path('/quotes'), { leadId, limit: 100 }),
    enabled: !!projectId && !!leadId,
  });
}

export function useLeadActivity(leadId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['activity', projectId, { leadId }],
    queryFn: () => api.get<Paginated<ActivityEvent>>(path('/activity'), { leadId, limit: 100 }),
    enabled: !!projectId && !!leadId,
  });
}

export function useLeadAttachments(leadId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['attachments', projectId, { leadId }],
    queryFn: () => api.get<Paginated<Attachment>>(path('/attachments'), { leadId, limit: 100 }),
    enabled: !!projectId && !!leadId,
  });
}

export function useUploadAttachment(leadId: string) {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('leadId', leadId);
      return api.upload<Attachment>(path('/attachments'), form);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attachments', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
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
