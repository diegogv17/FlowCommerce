'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QuoteStatus } from '@flowcommerce/types';
import { api, type Paginated } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type {
  CreateQuoteInput,
  LeadSummary,
  PaginatedQuotes,
  ProjectDetail,
  QuoteDetail,
  QuoteFilters,
  SendQuoteInput,
  UpdateQuoteInput,
} from './types';

export function useQuotes(filters: QuoteFilters = {}, enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['quotes', projectId, filters],
    queryFn: () =>
      api.get<PaginatedQuotes>(path('/quotes'), {
        status: filters.status,
        clientId: filters.clientId,
        leadId: filters.leadId,
        createdByUserId: filters.createdByUserId,
        origin: filters.origin,
        search: filters.search,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        sortBy: filters.sortBy,
        order: filters.order,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      }),
    enabled: !!projectId && enabled,
  });
}

export function useQuote(quoteId: string | null | undefined) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['quotes', projectId, 'detail', quoteId],
    queryFn: () => api.get<QuoteDetail>(path(`/quotes/${quoteId}`)),
    enabled: !!projectId && !!quoteId,
  });
}

/** Proyecto con datos de facturación (PDF) y ajustes de cotización (IVA, moneda). */
export function useProjectDetail() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: () => api.get<ProjectDetail>(path()),
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

/** Lead para el selector del formulario y los datos de contacto del documento. */
export function useLeadSummary(leadId: string | null | undefined) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['leads', projectId, 'summary', leadId],
    queryFn: () => api.get<LeadSummary>(path(`/leads/${leadId}`)),
    enabled: !!projectId && !!leadId,
  });
}

/** Leads del selector: de un cliente concreto o por búsqueda de texto. */
export function useLeadOptions(params: { clientId?: string; search?: string }) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['leads', projectId, 'options', params],
    queryFn: () =>
      api.get<Paginated<LeadSummary>>(path('/leads'), {
        clientId: params.clientId,
        search: params.search,
        sortBy: 'updatedAt',
        order: 'desc',
        limit: 50,
      }),
    enabled: !!projectId,
    select: (result) => result.data,
  });
}

function useInvalidateQuotes() {
  const { projectId } = useProject();
  const queryClient = useQueryClient();
  return (quote?: QuoteDetail) => {
    if (quote) queryClient.setQueryData(['quotes', projectId, 'detail', quote.id], quote);
    queryClient.invalidateQueries({ queryKey: ['quotes', projectId] });
    queryClient.invalidateQueries({ queryKey: ['clients', projectId] });
    queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', projectId] });
  };
}

export function useCreateQuote() {
  const { path } = useProject();
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: (input: CreateQuoteInput) => api.post<QuoteDetail>(path('/quotes'), input),
    onSuccess: (quote) => invalidate(quote),
  });
}

export function useUpdateQuote() {
  const { path } = useProject();
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuoteInput }) =>
      api.patch<QuoteDetail>(path(`/quotes/${id}`), input),
    onSuccess: (quote) => invalidate(quote),
  });
}

export function useQuoteStatus() {
  const { path } = useProject();
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      api.patch<QuoteDetail>(path(`/quotes/${id}/status`), { status }),
    onSuccess: (quote) => invalidate(quote),
  });
}

export function useSendQuote() {
  const { path } = useProject();
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SendQuoteInput }) =>
      api.post<QuoteDetail>(path(`/quotes/${id}/send`), input),
    onSuccess: (quote) => invalidate(quote),
  });
}

export function usePaymentLink() {
  const { path } = useProject();
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: (id: string) => api.post<QuoteDetail>(path(`/quotes/${id}/payment-link`)),
    onSuccess: (quote) => invalidate(quote),
  });
}

export function useDeleteQuote() {
  const { path } = useProject();
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: (id: string) => api.delete(path(`/quotes/${id}`)),
    onSuccess: () => invalidate(),
  });
}

/** Descarga (o abre) el PDF generado por el servidor. */
export function useDownloadQuotePdf() {
  const { path } = useProject();
  return useMutation({
    mutationFn: ({ id, folio, open }: { id: string; folio: string; open?: boolean }) =>
      api.download(path(`/quotes/${id}/pdf${open ? '' : '?download=true'}`), `${folio}.pdf`, open),
  });
}
