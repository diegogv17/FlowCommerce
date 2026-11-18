// Formatos para Guatemala (es-GT). La moneda viene de quoteSettings.currency.

export function formatMoney(value: number | string | null | undefined, currency = 'GTQ') {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `Q${amount.toLocaleString('es-GT')}`;
  }
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  return Number(value ?? 0).toLocaleString('es-GT', {
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "hace 5 min", "ayer", "12 sep" */
export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 1) return 'ahora';
  if (minutes > 0 && minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (minutes > 0 && hours < 24) return `hace ${hours} h`;
  if (minutes > 0 && hours < 48) return 'ayer';
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
}

export function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}
