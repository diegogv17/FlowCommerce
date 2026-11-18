'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Kbd, SearchDialog } from '@/features/search/search-dialog';

/**
 * Buscador global del encabezado. En escritorio parece un campo de texto; en
 * móvil es un icono. Ambos abren la paleta de búsqueda, que también se abre
 * con ⌘K (Mac) o Ctrl+K.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    // Se detecta tras montar para no desajustar la hidratación.
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 w-full max-w-md items-center gap-2 rounded-xl bg-white px-3 text-left text-sm text-slate-400 shadow-sm transition-colors hover:text-muted md:flex"
        aria-label="Buscar leads, cotizaciones y clientes"
      >
        <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span className="flex-1 truncate">Buscar leads, cotizaciones, clientes…</span>
        <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm hover:bg-slate-100 md:hidden"
        aria-label="Buscar"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>
      <SearchDialog open={open} onClose={close} />
    </>
  );
}
