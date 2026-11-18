'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Botón-píldora con menú desplegable (filtros de la lista de leads). */
export function FilterMenu({
  label,
  active,
  children,
  align = 'left',
  className,
  ariaLabel,
}: {
  label: React.ReactNode;
  /** Para botones de solo icono. */
  ariaLabel?: string;
  active?: boolean;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors',
          active ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/40' : 'bg-slate-200/60 text-ink hover:bg-slate-200',
        )}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open ? (
        <div
          className={cn(
            'absolute z-30 mt-2 min-w-56 rounded-xl border border-line bg-white p-2 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuOption({
  selected,
  onClick,
  children,
  checkbox,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  checkbox?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={checkbox ? 'menuitemcheckbox' : 'menuitemradio'}
      aria-checked={!!selected}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100',
        selected && !checkbox && 'font-semibold text-brand-700',
      )}
    >
      {checkbox ? (
        <span
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] text-white',
            selected ? 'border-brand-500 bg-brand-500' : 'border-line bg-white',
          )}
        >
          {selected ? '✓' : ''}
        </span>
      ) : null}
      {children}
    </button>
  );
}
