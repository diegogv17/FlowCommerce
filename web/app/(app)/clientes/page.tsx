'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useProject } from '@/hooks/use-project';
import { errorMessage } from '@/lib/api';
import { formatMoney, formatNumber, formatRelative, initials } from '@/lib/format';
import { ClientFormDialog } from '@/features/clients/client-form-dialog';
import { useClients, useMembers } from '@/features/clients/hooks';
import type { ClientFilters } from '@/features/clients/types';
import { useProjectDetail } from '@/features/quotes/hooks';
import { useDebounced } from '@/features/quotes/use-debounced';

// El backend ordena por nombre o fecha de alta. "Última actividad" se ordena en
// el navegador sobre la página actual (lastActivityAt viene en cada fila).
type SortOption = 'activity' | 'name' | 'newest';
type ActiveFilter = 'all' | 'active' | 'inactive';

const SORT_LABELS: Record<SortOption, string> = {
  activity: 'Ordenar: Última actividad',
  name: 'Ordenar: Nombre',
  newest: 'Ordenar: Más recientes',
};

export default function ClientsPage() {
  const router = useRouter();
  const { can } = useProject();
  const [search, setSearch] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [sort, setSort] = useState<SortOption>('activity');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounced(search);

  useEffect(() => setPage(1), [debouncedSearch, ownerId, sort, activeFilter]);

  const filters: ClientFilters = {
    search: debouncedSearch.trim() || undefined,
    assignedUserId: ownerId || undefined,
    active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    sortBy: sort === 'newest' ? 'createdAt' : 'name',
    order: sort === 'newest' ? 'desc' : 'asc',
    page,
  };
  const clients = useClients(filters);
  const members = useMembers();
  const project = useProjectDetail();
  const currency = project.data?.quoteSettings.currency ?? 'GTQ';

  const rows = useMemo(() => {
    const list = clients.data?.data ?? [];
    if (sort !== 'activity') return list;
    const time = (value: string | null) => (value ? new Date(value).getTime() : 0);
    return [...list].sort((a, b) => time(b.lastActivityAt) - time(a.lastActivityAt));
  }, [clients.data, sort]);

  const summary = clients.data?.summary;
  const hasFilters = !!(debouncedSearch || ownerId || activeFilter !== 'all');

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={
          summary
            ? `${formatNumber(summary.activeClients)} clientes activos · ${formatMoney(summary.billedThisYear, currency)} facturados este año`
            : ' '
        }
        actions={
          can('CLIENT_CREATE') ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <Input
          aria-label="Buscar cliente"
          placeholder="Buscar cliente, empresa o NIT…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="lg:max-w-xs"
        />
        <Select aria-label="Responsable" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="lg:w-48">
          <option value="">Responsable: todos</option>
          {(members.data ?? []).map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Ordenar" value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="lg:w-60">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Estado"
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
          className="lg:w-40"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </Select>
      </div>

      <Card className="p-0">
        {clients.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : clients.isError ? (
          <div className="p-5">
            <ErrorState message={errorMessage(clients.error)} onRetry={() => clients.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title={hasFilters ? 'Sin resultados' : 'Aún no hay clientes'}
            description={
              hasFilters
                ? 'Ningún cliente coincide con los filtros.'
                : 'Convierte un lead en cliente desde su ficha o crea uno nuevo.'
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th className="pl-5">Cliente</Th>
                  <Th>Contacto</Th>
                  <Th className="text-center">Cotizaciones</Th>
                  <Th className="text-right">Ventas</Th>
                  <Th>Última actividad</Th>
                  <Th>Responsable</Th>
                  <Th className="pr-5">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((client) => (
                  <Tr key={client.id} className="cursor-pointer" onClick={() => router.push(`/clientes/${client.id}`)}>
                    <Td className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-semibold text-white">
                          {initials(client.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-ink">
                            {client.name}
                            {!client.active ? <Badge className="text-[10px]">Inactivo</Badge> : null}
                          </p>
                          {client.company ? <p className="text-xs text-muted">{client.company}</p> : null}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-ink">{client.email ?? '—'}</p>
                      {client.phone ? <p className="text-xs text-muted">{client.phone}</p> : null}
                    </Td>
                    <Td className="text-center font-semibold">{formatNumber(client.quotesCount)}</Td>
                    <Td className="whitespace-nowrap text-right font-mono font-semibold text-emerald-600">
                      {formatMoney(client.salesTotal, currency)}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatRelative(client.lastActivityAt)}</Td>
                    <Td className="whitespace-nowrap text-muted">{client.assignedUser?.name ?? '—'}</Td>
                    <Td className="pr-5 text-right">
                      <Link
                        href={`/clientes/${client.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center whitespace-nowrap rounded-full bg-slate-100 px-3 text-xs font-semibold text-brand-600 hover:bg-slate-200"
                      >
                        Ver ficha
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4">
              <Pagination
                page={clients.data?.meta.page ?? page}
                totalPages={clients.data?.meta.totalPages ?? 1}
                total={clients.data?.meta.total ?? 0}
                onPage={setPage}
                label="clientes"
              />
            </div>
          </>
        )}
      </Card>

      <ClientFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(client) => router.push(`/clientes/${client.id}`)}
      />
    </div>
  );
}
