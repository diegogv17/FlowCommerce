'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, errorMessage } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type {
  LeadInsight,
  QuoteDraftInput,
  QuoteDraftResult,
  ReplySuggestionsResponse,
} from './types';

/**
 * Insight de IA de un lead. Solo se pide cuando `requested` es true (botón
 * «Analizar»): cada llamada cuesta cuota del modelo. Una vez cargado queda en
 * caché (['ai', projectId, 'insight', leadId]) y se muestra aunque
 * `requested` vuelva a false al remontar el componente.
 */
export function useLeadInsight(leadId: string, requested: boolean) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['ai', projectId, 'insight', leadId],
    queryFn: () => api.get<LeadInsight>(path(`/assistant/leads/${leadId}/insight`)),
    enabled: requested && !!projectId && !!leadId,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    // 503 (IA sin configurar), 429 (límite) o 502: reintentar no ayuda.
    retry: false,
  });
}

export function useReplySuggestions(leadId: string) {
  const { path } = useProject();
  return useMutation({
    mutationFn: () =>
      api.post<ReplySuggestionsResponse>(path(`/assistant/leads/${leadId}/reply-suggestions`)),
  });
}

export function useGenerateQuoteDraft() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteDraftInput) =>
      api.post<QuoteDraftResult>(path('/assistant/quote-draft'), input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes', projectId] });
    },
  });
}

/** Mensaje amigable para los errores típicos de las rutas de IA. */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return error.message || 'La IA no está configurada o no está disponible en este momento.';
    }
    if (error.status === 429) {
      return 'Hiciste muchas solicitudes a la IA en poco tiempo. Espera un minuto e intenta de nuevo.';
    }
    if (error.status === 403) {
      return 'No tienes permiso para usar esta función de IA en el proyecto.';
    }
    if (error.status >= 500) {
      return error.message || 'La IA no respondió. Intenta de nuevo.';
    }
  }
  return errorMessage(error);
}

/** true si el error indica que la IA no está configurada en el servidor. */
export function isAiNotConfigured(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503 && /configurad/i.test(error.message);
}
