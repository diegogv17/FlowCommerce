'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LeadStage, QuoteStatus } from '@flowcommerce/types';
import { api } from '@/lib/api';
import { useProject } from '@/hooks/use-project';

// Respuesta de GET /projects/:id/search (SearchResultsDto).
export interface SearchResults {
  leads: { id: string; name: string; company: string | null; stage: LeadStage }[];
  clients: { id: string; name: string; company: string | null; taxId: string | null }[];
  quotes: { id: string; folio: string; status: QuoteStatus; total: number; customerName: string }[];
}

/** El backend exige q de 2 a 64 caracteres. */
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 64;

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useGlobalSearch(term: string, limit = 5) {
  const { projectId, path } = useProject();
  const q = useDebouncedValue(term.trim().slice(0, SEARCH_MAX), 250);
  const query = useQuery({
    queryKey: ['search', projectId, q, limit],
    queryFn: ({ signal }) => api.get<SearchResults>(path('/search'), { q, limit }, signal),
    enabled: !!projectId && q.length >= SEARCH_MIN,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
  return { ...query, q, pending: term.trim() !== q };
}
