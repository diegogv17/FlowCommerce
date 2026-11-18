'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, CornerDownLeft, FileText, Search, Users, X } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { quoteStatusInfo, stageInfo } from '@/lib/labels';
import { SEARCH_MAX, SEARCH_MIN, useGlobalSearch, type SearchResults } from './hooks';

interface ResultItem {
  key: string;
  section: 'Leads' | 'Clientes' | 'Cotizaciones';
  href: string;
  title: string;
  subtitle: string | null;
  badge?: { label: string; className: string };
}

const SECTION_ICONS = { Leads: Users, Clientes: Building2, Cotizaciones: FileText } as const;

function flatten(results: SearchResults | undefined): ResultItem[] {
  if (!results) return [];
  const items: ResultItem[] = [];
  for (const lead of results.leads) {
    const stage = stageInfo(lead.stage);
    items.push({
      key: `lead-${lead.id}`,
      section: 'Leads',
      href: `/leads/${lead.id}`,
      title: lead.name,
      subtitle: lead.company,
      badge: { label: stage.label, className: stage.color },
    });
  }
  for (const client of results.clients) {
    items.push({
      key: `client-${client.id}`,
      section: 'Clientes',
      href: `/clientes/${client.id}`,
      title: client.name,
      subtitle: [client.company, client.taxId ? `NIT ${client.taxId}` : null].filter(Boolean).join(' · ') || null,
    });
  }
  for (const quote of results.quotes) {
    const status = quoteStatusInfo(quote.status);
    items.push({
      key: `quote-${quote.id}`,
      section: 'Cotizaciones',
      href: `/cotizaciones/${quote.id}`,
      title: quote.folio,
      subtitle: `${quote.customerName} · ${formatMoney(quote.total)}`,
      badge: { label: status.label, className: status.color },
    });
  }
  return items;
}

/** Paleta de búsqueda global (⌘K / Ctrl+K). */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const search = useGlobalSearch(open ? term : '');

  const items = useMemo(
    () => (search.q.length >= SEARCH_MIN ? flatten(search.data) : []),
    [search.data, search.q],
  );

  // Al abrir: limpiar y enfocar.
  useEffect(() => {
    if (!open) return;
    setTerm('');
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => setActive(0), [items]);

  // Mantener visible el resultado activo al navegar con el teclado.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function go(item: ResultItem | undefined) {
    if (!item) return;
    onClose();
    router.push(item.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (items.length ? (index + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (items.length ? (index - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(items[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  if (!open || typeof document === 'undefined') return null;

  const tooShort = term.trim().length < SEARCH_MIN;
  const loading = !tooShort && (search.pending || search.isFetching) && items.length === 0;

  let lastSection: string | null = null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 pt-[8vh] sm:p-4 sm:pt-[12vh]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en el CRM"
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={SEARCH_MAX}
            placeholder="Buscar leads, cotizaciones, clientes…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="global-search-results"
            aria-activedescendant={items[active] ? `search-item-${active}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
          />
          {search.isFetching && !tooShort ? <Spinner className="h-4 w-4" /> : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-slate-100"
            aria-label="Cerrar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={listRef} id="global-search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {tooShort ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Escribe al menos {SEARCH_MIN} letras: nombre, empresa, correo, teléfono, NIT o folio.
            </p>
          ) : search.isError ? (
            <p className="px-3 py-8 text-center text-sm text-rose-600">{errorMessage(search.error)}</p>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Sin resultados para «{search.q}».
            </p>
          ) : (
            items.map((item, index) => {
              const header = item.section !== lastSection ? item.section : null;
              lastSection = item.section;
              const Icon = SECTION_ICONS[item.section];
              return (
                <div key={item.key}>
                  {header ? (
                    <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted first:pt-1">
                      {header}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    id={`search-item-${index}`}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                      index === active ? 'bg-brand-50' : 'hover:bg-slate-50',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        index === active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-muted',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                      {item.subtitle ? <span className="block truncate text-xs text-muted">{item.subtitle}</span> : null}
                    </span>
                    {item.badge ? (
                      <span
                        className={cn(
                          'hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline',
                          item.badge.className,
                        )}
                      >
                        {item.badge.label}
                      </span>
                    ) : null}
                    {index === active ? (
                      <CornerDownLeft className="hidden h-4 w-4 shrink-0 text-brand-500 sm:block" aria-hidden />
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line bg-slate-50 px-4 py-2 text-[11px] text-muted sm:flex">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar
          </span>
          <span>
            <Kbd>↵</Kbd> abrir
          </span>
          <span>
            <Kbd>esc</Kbd> cerrar
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">
      {children}
    </kbd>
  );
}
