'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Sparkles } from 'lucide-react';
import type { QuoteStatus } from '@flowcommerce/types';
import {
  AiBadge,
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
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { QUOTE_STATUSES } from '@/lib/labels';
import { GenerateQuoteDialog } from '@/features/ai/generate-quote-dialog';
import { useClientOptions, useMembers } from '@/features/clients/hooks';
import { useProjectDetail, useQuotes } from '@/features/quotes/hooks';
import { QuoteStatusBadge } from '@/features/quotes/quote-status-badge';
import { useDebounced } from '@/features/quotes/use-debounced';

type DateRange = '' | 'month' | '30d' | 'quarter' | 'year';

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '', label: 'Cualquier fecha' },
  { value: 'month', label: 'Este mes' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'quarter', label: 'Este trimestre' },
  { value: 'year', label: 'Este año' },
];

function startOfQuarter(now = new Date()) {
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
}

function rangeFrom(range: DateRange): string | undefined {
  const now = new Date();
  switch (range) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 86_400_000).toISOString();
    case 'quarter':
      return startOfQuarter(now).toISOString();
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return undefined;
  }
}

// Tarjetas de conteo por estado: cada una pide solo meta.total (limit=1).
const CARD_STATUSES: { status: QuoteStatus; label: string; dot: string }[] = [
  { status: 'DRAFT', label: 'Borradores', dot: 'bg-violet-500' },
  { status: 'PENDING_APPROVAL', label: 'Pendientes', dot: 'bg-amber-500' },
  { status: 'SENT', label: 'Enviadas', dot: 'bg-blue-500' },
  { status: 'APPROVED', label: 'Aprobadas', dot: 'bg-emerald-500' },
];

function StatusCount({ status, label, dot, active, onClick }: {
  status: QuoteStatus;
  label: string;
  dot: string;
  active: boolean;
  onClick: () => void;
}) {
  const query = useQuotes({ status, limit: 1 });
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors ${
        active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-line/60 hover:border-line'
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-ink">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="mt-2 block font-display text-2xl font-semibold text-ink">
        {query.isLoading ? <Skeleton className="h-7 w-10" /> : formatNumber(query.data?.meta.total ?? 0)}
      </span>
    </button>
  );
}

export default function QuotesPage() {
  const router = useRouter();
  const { can } = useProject();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatus | ''>('');
  const [clientId, setClientId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [range, setRange] = useState<DateRange>('');
  const [page, setPage] = useState(1);
  const [aiOpen, setAiOpen] = useState(false);
  const debouncedSearch = useDebounced(search);

  useEffect(() => setPage(1), [debouncedSearch, status, clientId, ownerId, range]);

  const createdFrom = useMemo(() => rangeFrom(range), [range]);
  const quarterFrom = useMemo(() => startOfQuarter().toISOString(), []);

  const project = useProjectDetail();
  const currency = project.data?.quoteSettings.currency ?? 'GTQ';
  const members = useMembers();
  const clients = useClientOptions();
  const quarter = useQuotes({ createdFrom: quarterFrom, limit: 1 });
  const quotes = useQuotes({
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
    clientId: clientId || undefined,
    createdByUserId: ownerId || undefined,
    createdFrom,
    sortBy: 'createdAt',
    order: 'desc',
    page,
  });

  const rows = quotes.data?.data ?? [];
  const hasFilters = !!(debouncedSearch || status || clientId || ownerId || range);
  const canCreate = can('QUOTE_CREATE');

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle={
          quarter.data
            ? `${formatNumber(quarter.data.meta.total)} cotizaciones este trimestre · ${formatMoney(
                quarter.data.meta.sumTotal,
                currency,
              )} en valor total`
            : ' '
        }
        actions={
          canCreate ? (
            <>
              <Button variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => setAiOpen(true)}>
                <Sparkles className="h-4 w-4" /> Generar con IA
              </Button>
              <Link
                href="/cotizaciones/nueva"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
              >
                <Plus className="h-4 w-4" /> Nueva cotización
              </Link>
            </>
          ) : null
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARD_STATUSES.map((card) => (
          <StatusCount
            key={card.status}
            {...card}
            active={status === card.status}
            onClick={() => setStatus(status === card.status ? '' : card.status)}
          />
        ))}
        <div className="col-span-2 rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:col-span-1">
          <span className="flex items-center gap-2 text-xs font-medium text-ink">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Valor total{hasFilters ? ' (filtro)' : ''}
          </span>
          <span className="mt-2 block font-display text-2xl font-semibold text-ink">
            {quotes.isLoading ? <Skeleton className="h-7 w-24" /> : formatMoney(quotes.data?.meta.sumTotal ?? 0, currency)}
          </span>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <Input
          aria-label="Buscar cotización"
          placeholder="Buscar por número o cliente…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="lg:max-w-xs"
        />
        <Select
          aria-label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value as QuoteStatus | '')}
          className="lg:w-44"
        >
          <option value="">Estado: todos</option>
          {QUOTE_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select aria-label="Responsable" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="lg:w-48">
          <option value="">Responsable: todos</option>
          {(members.data ?? []).map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Cliente" value={clientId} onChange={(event) => setClientId(event.target.value)} className="lg:w-52">
          <option value="">Cliente: todos</option>
          {(clients.data ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.company ?? client.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Fecha" value={range} onChange={(event) => setRange(event.target.value as DateRange)} className="lg:w-44">
          {DATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value ? option.label : 'Fecha: cualquiera'}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-0">
        {quotes.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : quotes.isError ? (
          <div className="p-5">
            <ErrorState message={errorMessage(quotes.error)} onRetry={() => quotes.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={hasFilters ? 'Sin resultados' : 'Aún no hay cotizaciones'}
            description={
              hasFilters ? 'Ninguna cotización coincide con los filtros.' : 'Crea la primera manualmente o con IA.'
            }
            action={
              !hasFilters && canCreate ? (
                <Link href="/cotizaciones/nueva" className="mt-2 text-sm font-semibold text-brand-600">
                  + Nueva cotización
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th className="pl-5">Número</Th>
                  <Th>Cliente</Th>
                  <Th>Fecha</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Responsable</Th>
                  <Th>Estado</Th>
                  <Th className="pr-5">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((quote) => (
                  <Tr
                    key={quote.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/cotizaciones/${quote.id}`)}
                  >
                    <Td className="pl-5">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono font-semibold">
                        {quote.folio}
                        {quote.origin === 'AI' ? <AiBadge className="bg-emerald-600 px-2 text-white" /> : null}
                      </span>
                    </Td>
                    <Td>
                      <p className="font-semibold text-ink">{quote.lead?.name ?? quote.client?.name ?? '—'}</p>
                      {quote.client && quote.client.name !== quote.lead?.name ? (
                        <p className="text-xs text-muted">{quote.client.name}</p>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatDate(quote.creadoEn)}</Td>
                    <Td className="whitespace-nowrap text-right font-mono font-semibold">
                      {formatMoney(quote.total, currency)}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{quote.createdBy?.name ?? '—'}</Td>
                    <Td>
                      <QuoteStatusBadge status={quote.status} />
                    </Td>
                    <Td className="pr-5 text-right">
                      <Link
                        href={`/cotizaciones/${quote.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-brand-600 hover:bg-slate-200"
                      >
                        Ver PDF
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4">
              <Pagination
                page={quotes.data?.meta.page ?? page}
                totalPages={quotes.data?.meta.totalPages ?? 1}
                total={quotes.data?.meta.total ?? 0}
                onPage={setPage}
                label="cotizaciones"
              />
            </div>
          </>
        )}
      </Card>

      <GenerateQuoteDialog open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
