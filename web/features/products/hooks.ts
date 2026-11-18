'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Paginated } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type { CreateProductInput, Product, ProductFilters, UpdateProductInput } from './types';

export function useProducts(filters: ProductFilters = {}) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['products', projectId, filters],
    queryFn: () =>
      api.get<Paginated<Product>>(path('/products'), {
        active: filters.active,
        category: filters.category,
        search: filters.search,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      }),
    enabled: !!projectId,
  });
}

/**
 * Productos activos para el selector de partidas de una cotización. El backend
 * limita a 100 por página; un catálogo universitario cabe de sobra.
 */
export function useActiveProducts() {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['products', projectId, 'active-catalog'],
    queryFn: () => api.get<Paginated<Product>>(path('/products'), { active: true, limit: 100 }),
    enabled: !!projectId,
    select: (result) => result.data,
    staleTime: 60_000,
  });
}

export function useCreateProduct() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => api.post<Product>(path('/products'), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', projectId] }),
  });
}

export function useUpdateProduct() {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      api.patch<Product>(path(`/products/${id}`), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', projectId] }),
  });
}
