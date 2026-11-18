import type { ActivityView } from '../../activity/domain/activity';
import type { ClientEntity } from '../../clients/domain/entities/client.entity';
import type { FollowUp } from '../../follow-ups/domain/follow-up';
import type { LeadEntity } from '../../leads/domain/entities/lead.entity';
import type { MessageEntity } from '../../messages/domain/entities/message.entity';
import type { ProductEntity } from '../../products/domain/entities/product.entity';
import type { QuoteEntity } from '../../quotes/domain/entities/quote.entity';
import type { CatalogEntry } from '../domain/quote-draft';

// Convierte entidades del CRM en texto/JSON compacto para el prompt.
// Minimización de datos: al modelo NO se le envían correos, teléfonos ni NIT;
// no los necesita para redactar ni analizar, y así salen menos datos
// personales hacia el proveedor externo.

export const GT_TIME_ZONE = 'America/Guatemala';
const MAX_MESSAGE_CHARS = 500;

export function todayInGuatemala(now = new Date()): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: GT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const isoDate = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}…` : text;

export function leadForPrompt(lead: LeadEntity) {
  return {
    id: lead.id,
    nombre: lead.name,
    empresa: lead.company,
    cargo: lead.contactPosition,
    etapa: lead.stage,
    puntaje: lead.score,
    fuente: lead.source,
    valorEstimadoQ: lead.estimatedValue,
    notas: lead.notes ? truncate(lead.notes, 1500) : null,
    responsable: lead.assignedUser?.name ?? null,
    cliente: lead.client?.name ?? null,
    productoDeInteres: lead.interestProduct?.name ?? null,
    ultimoContacto: isoDate(lead.lastContactAt),
    proximoSeguimiento: isoDate(lead.nextFollowUpAt),
    creado: isoDate(lead.creadoEn),
  };
}

export function clientForPrompt(client: ClientEntity) {
  return {
    id: client.id,
    nombre: client.name,
    empresa: client.company,
    cargo: client.contactPosition,
    activo: client.active,
    notas: client.notes ? truncate(client.notes, 1000) : null,
    responsable: client.assignedUser?.name ?? null,
  };
}

// Conversación en orden cronológico, una línea por mensaje.
export function messagesForPrompt(
  messages: readonly MessageEntity[],
  limit: number,
): string {
  const recent = messages.slice(-limit);
  if (recent.length === 0) {
    return '(sin mensajes de WhatsApp)';
  }
  return recent
    .map((message) => {
      const who = message.direction === 'INBOUND' ? 'Cliente' : 'Asesor';
      const content =
        message.type === 'TEXT' || message.type === 'TEMPLATE'
          ? message.content
          : `[${message.type.toLowerCase()}] ${message.content}`;
      return `[${message.creadoEn.toISOString()}] ${who}: ${truncate(
        content.replace(/\s+/g, ' ').trim(),
        MAX_MESSAGE_CHARS,
      )}`;
    })
    .join('\n');
}

export function quoteForPrompt(quote: QuoteEntity) {
  return {
    id: quote.id,
    folio: quote.folio,
    estado: quote.status,
    totalQ: quote.total,
    venceEl: isoDate(quote.validUntil),
    lead: quote.lead?.name ?? null,
    cliente: quote.client?.name ?? null,
    origen: quote.origin,
    creada: isoDate(quote.creadoEn),
    enviada: isoDate(quote.sentAt),
  };
}

export function followUpForPrompt(followUp: FollowUp) {
  return {
    id: followUp.id,
    lead: followUp.lead.name,
    leadId: followUp.leadId,
    tipo: followUp.type,
    titulo: followUp.title,
    vence: isoDate(followUp.dueAt),
    estado: followUp.status,
    vencido: followUp.overdue,
    responsable: followUp.assignedUser?.name ?? null,
    resultado: followUp.outcome,
  };
}

export function activityForPrompt(event: ActivityView) {
  return {
    fecha: isoDate(event.creadoEn),
    tipo: event.type,
    titulo: event.title,
    autor: event.actor?.name ?? 'Sistema',
  };
}

export function catalogEntry(product: ProductEntity): CatalogEntry {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    maxDiscountPercent: product.maxDiscountPercent,
  };
}

export function catalogForPrompt(products: readonly ProductEntity[]) {
  return products.map((product) => ({
    id: product.id,
    nombre: product.name,
    descripcion: product.description
      ? truncate(product.description, 200)
      : null,
    categoria: product.category,
    unidad: product.unit,
    precioQ: product.price,
    descuentoMaximoPct: product.maxDiscountPercent,
  }));
}

export const json = (value: unknown): string => JSON.stringify(value);
