'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Pills,
  Select,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { formatMoney, formatPercent } from '@/lib/format';
import { useProducts, useUpdateProduct } from '@/features/products/hooks';
import { ProductFormDialog } from '@/features/products/product-form-dialog';
import type { Product } from '@/features/products/types';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

/** Retrasa el valor para no pedir a la API en cada tecla. */
function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export default function ProductsPage() {
  const { can } = useProject();
  const canManage = can('PRODUCT_MANAGE');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounced(search);

  useEffect(() => setPage(1), [debouncedSearch, status, category]);

  const products = useProducts({
    search: debouncedSearch.trim() || undefined,
    active: status === 'all' ? undefined : status === 'active',
    category: category || undefined,
    page,
  });
  // Todo el catálogo (sin filtros) solo para listar las categorías existentes.
  const catalog = useProducts({ limit: 100 });
  const categories = useMemo(
    () =>
      [...new Set((catalog.data?.data ?? []).map((item) => item.category).filter((c): c is string => !!c))].sort(),
    [catalog.data],
  );

  const update = useUpdateProduct();

  async function toggleActive(product: Product) {
    try {
      await update.mutateAsync({ id: product.id, input: { active: !product.active } });
      toast.success(product.active ? 'Producto desactivado' : 'Producto activado');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDialogOpen(true);
  }

  const rows = products.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Productos y Servicios"
        subtitle="Catálogo oficial de precios. La IA solo cotiza con esta información."
        actions={
          canManage ? (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-muted">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        <p>
          Los precios de este catálogo alimentan las cotizaciones automáticas. La IA nunca inventa precios ni
          descuentos fuera de los definidos aquí.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Buscar producto"
          placeholder="Buscar por nombre o descripción…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          aria-label="Categoría"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="sm:w-48"
        >
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Pills options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </div>

      <Card className="p-0">
        {products.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : products.isError ? (
          <div className="p-5">
            <ErrorState message={errorMessage(products.error)} onRetry={() => products.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No hay productos"
            description={
              debouncedSearch || status !== 'all' || category
                ? 'Ningún producto coincide con los filtros.'
                : 'Agrega tu primer producto o servicio para poder cotizar.'
            }
            action={
              canManage && !debouncedSearch && status === 'all' && !category ? (
                <Button size="sm" className="mt-2" onClick={openNew}>
                  <Plus className="h-4 w-4" /> Nuevo producto
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th className="pl-5">Nombre</Th>
                  <Th>Categoría</Th>
                  <Th className="text-right">Precio</Th>
                  <Th className="text-right">Desc. máx.</Th>
                  <Th>Estado</Th>
                  <Th className="pr-5 text-right">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((product) => (
                  <Tr key={product.id}>
                    <Td className="pl-5">
                      <p className="font-semibold text-ink">{product.name}</p>
                      {product.description ? (
                        <p className="line-clamp-1 max-w-md text-xs text-muted">{product.description}</p>
                      ) : null}
                    </Td>
                    <Td>{product.category ? <Badge>{product.category}</Badge> : <span className="text-muted">—</span>}</Td>
                    <Td className="whitespace-nowrap text-right font-mono font-semibold">
                      {formatMoney(product.price)}
                      {product.unit ? <span className="ml-1 text-xs font-normal text-muted">/ {product.unit}</span> : null}
                    </Td>
                    <Td className="text-right text-muted">
                      {product.maxDiscountPercent > 0 ? formatPercent(product.maxDiscountPercent, 0) : '—'}
                    </Td>
                    <Td>
                      {product.active ? (
                        <Badge className="bg-emerald-600 text-white">Activo</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-muted">Inactivo</Badge>
                      )}
                    </Td>
                    <Td className="pr-5">
                      {canManage ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" className="text-brand-600" onClick={() => openEdit(product)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleActive(product)}
                            disabled={update.isPending && update.variables?.id === product.id}
                          >
                            {product.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      ) : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4">
              <Pagination
                page={products.data?.meta.page ?? page}
                totalPages={products.data?.meta.totalPages ?? 1}
                total={products.data?.meta.total ?? 0}
                onPage={setPage}
                label="productos"
              />
            </div>
          </>
        )}
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={editing}
        categories={categories}
      />
    </div>
  );
}
