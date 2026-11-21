import type { Product, ProductInput } from '@/types/domain'
import { http } from './http'

export const productsService = {
  list: (params: { search?: string; kind?: string; active?: boolean } = {}) =>
    http.get<Product[]>('/products', { params }),
  create: (input: ProductInput) => http.post<Product>('/products', input),
  update: (id: string, input: Partial<ProductInput>) => http.patch<Product>(`/products/${id}`, input),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/products/${id}`),
}
