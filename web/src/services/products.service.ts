import type { Product, ProductInput, ProductKind } from '@/types/domain'
import { http, pp, type ApiPaginated } from './http'

/** Producto tal como lo devuelve GET /projects/:id/products */
export interface ApiProduct {
  id: string
  projectId: string
  name: string
  description: string | null
  category: string | null
  unit: string | null
  /** Precio unitario antes de IVA */
  price: number
  maxDiscountPercent: number
  active: boolean
  creadoEn: string
  actualizadoEn: string
}

/**
 * La API no distingue producto/servicio ni tiene SKU. El tipo se deriva de la
 * unidad de venta: unidades de tiempo o «servicio» → servicio; el resto → producto.
 * El formulario fija la unidad por defecto de cada tipo ('servicio' / 'unidad').
 */
const SERVICE_UNIT = /^(servicios?|horas?|d[ií]as?|semanas?|mes(es)?|mensual(idad)?|a[nñ]os?|anual(idad)?|sesi[oó]n(es)?|proyectos?|suscripci[oó]n(es)?|visitas?|eventos?)$/i

export const DEFAULT_UNIT: Record<ProductKind, string> = { producto: 'unidad', servicio: 'servicio' }

export function kindOfUnit(unit: string | null | undefined): ProductKind {
  return unit && SERVICE_UNIT.test(unit.trim()) ? 'servicio' : 'producto'
}

export function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: '',
    name: p.name,
    kind: kindOfUnit(p.unit),
    category: p.category ?? '',
    description: p.description ?? '',
    unitPrice: Number(p.price),
    active: p.active,
    unit: p.unit ?? '',
    maxDiscountPercent: Number(p.maxDiscountPercent ?? 0),
  }
}

const orNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null)

function toApiBody(input: Partial<ProductInput>) {
  const body: Record<string, unknown> = {}
  if (input.name !== undefined) body.name = input.name.trim()
  if (input.description !== undefined) body.description = orNull(input.description)
  if (input.category !== undefined) body.category = orNull(input.category)
  if (input.unit !== undefined || input.kind !== undefined) {
    body.unit = orNull(input.unit) ?? DEFAULT_UNIT[input.kind ?? 'producto']
  }
  if (input.unitPrice !== undefined) body.price = Math.round(Number(input.unitPrice) * 100) / 100
  if (input.maxDiscountPercent !== undefined) body.maxDiscountPercent = Number(input.maxDiscountPercent) || 0
  return body
}

/** Trae todo el catálogo (la API pagina con limit ≤ 100). */
async function fetchAll(params: { search?: string; active?: boolean }): Promise<ApiProduct[]> {
  const out: ApiProduct[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await http.get<ApiPaginated<ApiProduct>>(pp('/products'), {
      params: { search: params.search?.trim(), active: params.active, page, limit: 100 },
    })
    out.push(...res.data)
    if (page >= res.meta.totalPages) break
  }
  return out
}

export const productsService = {
  /** search y active se filtran en la API; kind (producto/servicio) en el cliente. */
  list: async (params: { search?: string; kind?: string; active?: boolean } = {}) => {
    const items = (await fetchAll(params)).map(toProduct)
    return params.kind ? items.filter((p) => p.kind === params.kind) : items
  },
  get: async (id: string) => toProduct(await http.get<ApiProduct>(pp(`/products/${id}`))),
  /** Un producto nace activo en la API; si se pide inactivo se desactiva después. */
  create: async (input: ProductInput) => {
    const created = await http.post<ApiProduct>(pp('/products'), toApiBody(input))
    if (input.active === false) {
      return toProduct(await http.patch<ApiProduct>(pp(`/products/${created.id}`), { active: false }))
    }
    return toProduct(created)
  },
  update: async (id: string, input: Partial<ProductInput>) => {
    const body = toApiBody(input)
    if (input.active !== undefined) body.active = input.active
    return toProduct(await http.patch<ApiProduct>(pp(`/products/${id}`), body))
  },
  /** No existe DELETE: un producto se desactiva para no romper cotizaciones. */
  remove: async (id: string) => {
    await http.patch<ApiProduct>(pp(`/products/${id}`), { active: false })
    return { ok: true }
  },
}
