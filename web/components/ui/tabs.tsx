'use client';

import { cn } from '@/lib/cn';

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: React.ReactNode; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
            value === tab.value ? 'border-brand-500 text-brand-600' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs text-muted">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Píldoras de filtro (Todas · Seguimientos · Mensajes …). */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            value === option.value ? 'bg-brand-500 text-white' : 'bg-white text-muted ring-1 ring-line hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
