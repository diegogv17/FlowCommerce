'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type { Dashboard, DateRange, PeriodKey } from './types';

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'this-month', label: 'Este mes' },
  { value: 'last-month', label: 'Mes anterior' },
  { value: 'last-3-months', label: 'Últimos 3 meses' },
  { value: 'this-year', label: 'Este año' },
];

/**
 * Rango [from, to) en hora local del navegador (Guatemala). El backend acepta
 * hasta 366 días, así que "este año" cabe siempre.
 */
export function periodRange(key: PeriodKey, now = new Date()): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  let from: Date;
  let to: Date;
  switch (key) {
    case 'last-month':
      from = new Date(y, m - 1, 1);
      to = new Date(y, m, 1);
      break;
    case 'last-3-months':
      from = new Date(y, m - 2, 1);
      to = new Date(y, m + 1, 1);
      break;
    case 'this-year':
      from = new Date(y, 0, 1);
      to = new Date(y + 1, 0, 1);
      break;
    case 'this-month':
    default:
      from = new Date(y, m, 1);
      to = new Date(y, m + 1, 1);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Meses YYYY-MM que cubre un rango [from, to) (para rellenar huecos con 0). */
export function monthsInRange(range: DateRange): string[] {
  const out: string[] = [];
  const from = new Date(range.from);
  const to = new Date(range.to);
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor < to && out.length < 24) {
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

/** "2026-09" → "Sep" */
export function monthLabel(periodo: string) {
  const [y, m] = periodo.split('-').map(Number);
  const text = new Date(y ?? 2000, (m ?? 1) - 1, 1).toLocaleDateString('es-GT', { month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1).replace('.', '');
}

/** range null = histórico (sin from/to). */
export function useDashboard(range: DateRange | null, options: { enabled?: boolean } = {}) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['dashboard', projectId, range ?? 'all'],
    queryFn: ({ signal }) => api.get<Dashboard>(path('/dashboard'), range ? { from: range.from, to: range.to } : undefined, signal),
    enabled: !!projectId && (options.enabled ?? true),
    placeholderData: (previous) => previous,
  });
}
