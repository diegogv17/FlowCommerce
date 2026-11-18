'use client';

import { Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { Button } from './button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-muted">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p>{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600', 'bg-slate-700'];

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string | null | undefined;
  /** URL ya resuelta de la foto (p. ej. un object URL de useAvatarUrl). */
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-base' };
  const color = AVATAR_COLORS[(name ?? '').length % AVATAR_COLORS.length];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ''} className={cn('shrink-0 rounded-full object-cover', sizes[size], className)} />;
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        color,
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back ? <div className="mb-2 text-sm text-muted">{back}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  iconClass,
  delta,
  deltaPositive,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  iconClass?: string;
  delta?: string | null;
  deltaPositive?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line/60 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        {icon ? (
          <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg text-white', iconClass ?? 'bg-brand-500')}>
            {icon}
          </span>
        ) : null}
        {label}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-ink">{value}</div>
      {delta ? (
        <p className="mt-1 text-xs text-muted">
          <span className={cn('font-semibold', deltaPositive === false ? 'text-amber-600' : 'text-emerald-600')}>{delta}</span>{' '}
          vs período anterior
        </p>
      ) : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
  label = 'registros',
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) {
    return <p className="px-1 py-3 text-xs text-muted">{total} {label}</p>;
  }
  return (
    <div className="flex items-center justify-between px-1 py-3 text-xs text-muted">
      <span>
        Página {page} de {totalPages} · {total} {label}
      </span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
