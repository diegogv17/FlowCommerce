'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { Avatar, Badge, EmptyState, ErrorState, Pagination, Pills, Skeleton } from '@/components/ui';
import { useConversations, useUnreadConversations } from './hooks';
import { inboxTime, previewText } from './utils';

type Filter = 'all' | 'unread';

const PAGE_SIZE = 20;

/** Bandeja de conversaciones (columna izquierda). */
export function ConversationList({
  selectedLeadId,
  onSelect,
  onFirstLoaded,
  className,
}: {
  selectedLeadId: string | null;
  onSelect: (leadId: string) => void;
  /** Se llama con el primer lead de la lista (para preseleccionarlo en escritorio). */
  onFirstLoaded?: (leadId: string) => void;
  className?: string;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);

  // Búsqueda con espera de 300 ms para no pedir en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch, isFetching } = useConversations(
    { search, unread: filter === 'unread' },
    page,
    PAGE_SIZE,
  );
  const { data: unread } = useUnreadConversations();
  const conversations = data?.data ?? [];

  const firstLeadId = conversations[0]?.lead.id;
  useEffect(() => {
    if (firstLeadId) onFirstLoaded?.(firstLeadId);
  }, [firstLeadId, onFirstLoaded]);

  return (
    <section
      className={cn('flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm', className)}
      aria-label="Bandeja de conversaciones"
    >
      <div className="space-y-3 border-b border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-ink">Conversaciones</h1>
          {unread && unread.conversations > 0 ? (
            <Badge className="bg-emerald-100 text-emerald-700">
              {unread.conversations} {unread.conversations === 1 ? 'nueva' : 'nuevas'}
            </Badge>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="conversation-search" className="sr-only">
            Buscar conversación
          </label>
          <input
            id="conversation-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            maxLength={64}
            placeholder="Buscar conversación…"
            className="h-10 w-full rounded-xl border border-line bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <Pills
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'unread', label: 'No leídas' },
          ]}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
      </div>

      <div className={cn('min-h-0 flex-1 overflow-y-auto', isFetching && !isLoading && 'opacity-80')}>
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : isError && !data ? (
          <div className="p-4">
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" />}
            title={search || filter === 'unread' ? 'Sin resultados' : 'Aún no hay conversaciones'}
            description={
              search || filter === 'unread'
                ? 'Prueba con otra búsqueda o quita el filtro.'
                : 'Los mensajes de WhatsApp de tus clientes aparecerán aquí.'
            }
          />
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const { lead, lastMessage, unreadCount } = conversation;
              const active = lead.id === selectedLeadId;
              const hasUnread = unreadCount > 0;
              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(lead.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full gap-3 border-b border-l-[3px] border-b-line/70 px-4 py-3 text-left transition-colors',
                      active ? 'border-l-brand-500 bg-brand-50/60' : 'border-l-transparent hover:bg-slate-50',
                    )}
                  >
                    <Avatar name={lead.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{lead.name}</p>
                        <time
                          dateTime={lastMessage.creadoEn}
                          className={cn('shrink-0 text-xs', hasUnread ? 'font-semibold text-emerald-600' : 'text-muted')}
                        >
                          {inboxTime(lastMessage.creadoEn)}
                        </time>
                      </div>
                      {lead.company ? <p className="truncate text-xs text-muted">{lead.company}</p> : null}
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={cn('truncate text-sm', hasUnread ? 'font-semibold text-ink' : 'text-muted')}>
                          {previewText(lastMessage)}
                        </p>
                        {hasUnread ? (
                          <span
                            className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-semibold text-white"
                            aria-label={`${unreadCount} sin leer`}
                          >
                            {unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {data && data.meta.totalPages > 1 ? (
        <div className="border-t border-line px-3">
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPage={setPage}
            label="conversaciones"
          />
        </div>
      ) : null}
    </section>
  );
}
