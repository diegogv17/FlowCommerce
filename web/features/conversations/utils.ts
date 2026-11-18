import type { Message } from './types';

const TIME = new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

/** "08:52" */
export function formatTime(value: string | Date): string {
  return TIME.format(new Date(value));
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Clave del día local (para agrupar mensajes). */
export function dayKey(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Separador del chat: "Hoy", "Ayer" o "12 sep 2026". */
export function dayLabel(value: string | Date): string {
  const date = new Date(value);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return date.toLocaleDateString('es-GT', {
    weekday: days < 7 ? 'long' : undefined,
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

/** Hora de la bandeja: "08:52" hoy, "Ayer", o "10 sep". */
export function inboxTime(value: string | Date): string {
  const date = new Date(value);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days === 0) return formatTime(date);
  if (days === 1) return 'Ayer';
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
}

/** ¿Se puede enviar texto libre? Fuera de la ventana de 24 h solo plantillas. */
export function isWindowOpen(windowOpenUntil: string | null | undefined, now = Date.now()): boolean {
  return !!windowOpenUntil && new Date(windowOpenUntil).getTime() > now;
}

export type MessageStatusKind = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export function messageStatus(status: string): { kind: MessageStatusKind; label: string } {
  switch (status.toUpperCase()) {
    case 'SENT':
      return { kind: 'sent', label: 'Enviado' };
    case 'DELIVERED':
      return { kind: 'delivered', label: 'Entregado' };
    case 'READ':
      return { kind: 'read', label: 'Leído' };
    case 'FAILED':
      return { kind: 'failed', label: 'Falló' };
    default:
      return { kind: 'pending', label: 'Enviando' };
  }
}

const PLACEHOLDER = /^\[(Imagen|Sticker|Documento|Audio|Video)\]\s*/;

/** true si el contenido es solo la etiqueta del archivo ("[Imagen]", "[Documento] x.pdf"). */
export function isMediaPlaceholder(content: string): boolean {
  return PLACEHOLDER.test(content);
}

/** Nombre del archivo a partir de "[Documento] propuesta.pdf". */
export function attachmentName(message: Message): string {
  const name = message.content.replace(PLACEHOLDER, '').trim();
  if (isMediaPlaceholder(message.content) && name) return name;
  const ext: Record<string, string> = { IMAGE: 'imagen', AUDIO: 'audio', VIDEO: 'video' };
  return `whatsapp-${ext[message.type] ?? 'documento'}`;
}

/** Vista previa de la plantilla con {{1}}, {{2}}… reemplazados. */
export function renderTemplate(body: string | null, parameters: string[]): string {
  if (!body) return '';
  return body.replace(/\{\{(\d+)\}\}/g, (match, index: string) => {
    const value = parameters[Number(index) - 1];
    return value && value.trim() ? value : match;
  });
}

/** Vista previa del último mensaje en la bandeja. */
export function previewText(message: Message): string {
  const prefix = message.direction === 'OUTBOUND' ? 'Tú: ' : '';
  return `${prefix}${message.content}`;
}
