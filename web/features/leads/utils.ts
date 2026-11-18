import type { FollowUpStatus, FollowUpType } from '@flowcommerce/types';

export const FOLLOW_UP_TYPES: { value: FollowUpType; label: string }[] = [
  { value: 'CALL', label: 'Llamada' },
  { value: 'MEETING', label: 'Reunión' },
  { value: 'EMAIL', label: 'Correo' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TASK', label: 'Tarea' },
];

export function followUpTypeLabel(type: string) {
  return FOLLOW_UP_TYPES.find((item) => item.value === type)?.label ?? type;
}

export const FOLLOW_UP_STATUS: Record<FollowUpStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  DONE: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600' },
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function time(date: Date) {
  return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "Hoy, 09:12" · "Ayer, 16:40" · "10 sep" (columna Último contacto). */
export function formatContactDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return `Hoy, ${time(date)}`;
  if (sameDay(date, yesterday)) return `Ayer, ${time(date)}`;
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
}

/** "12 sep · 15:00" (columna Próximo seguimiento). */
export function formatDueDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })} · ${time(date)}`;
}

/** ISO → valor de <input type="datetime-local"> en hora local. */
export function toDateTimeLocal(value: string | Date) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO → "YYYY-MM-DD" local (para <input type="date">). */
export function toDateInput(value: string | Date) {
  return toDateTimeLocal(value).slice(0, 10);
}

/** "YYYY-MM-DD" local → ISO del inicio de ese día (o del siguiente con nextDay). */
export function dateInputToIso(value: string, nextDay = false) {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + (nextDay ? 1 : 0));
  return date.toISOString();
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
