import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { ListClientsUseCase } from '../../clients/application/use-cases/list-clients.use-case';
import { GetDashboardUseCase } from '../../dashboard/application/use-cases/get-dashboard.use-case';
import {
  CreateFollowUpUseCase,
  ListFollowUpsUseCase,
} from '../../follow-ups/application/use-cases/follow-ups.use-cases';
import { GetLeadContextForAiUseCase } from '../../integrations/application/ai-context.use-case';
import { ListLeadsUseCase } from '../../leads/application/use-cases/list-leads.use-case';
import { ListProductsUseCase } from '../../products/application/use-cases/list-products.use-case';
import { ListQuotesUseCase } from '../../quotes/application/use-cases/list-quotes.use-case';
import {
  catalogForPrompt,
  clientForPrompt,
  followUpForPrompt,
  leadForPrompt,
  messagesForPrompt,
  quoteForPrompt,
} from './assistant-context';

const LEAD_STAGES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;
const QUOTE_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT',
  'ACCEPTED',
  'PAID',
  'REJECTED',
] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

interface Actor {
  actorUserId: string;
  projectId: string;
}

type ToolError = { error: string };

const parseDay = (value: string | undefined): Date | null => {
  if (!value || !DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const FOLLOW_UP_TYPES = [
  'CALL',
  'MEETING',
  'EMAIL',
  'WHATSAPP',
  'TASK',
] as const;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Guatemala no usa horario de verano: siempre UTC-6.
const GUATEMALA_UTC_OFFSET_HOURS = 6;

// Convierte la fecha (AAAA-MM-DD) y la hora (HH:mm, 09:00 si no viene) que
// propone el modelo, en hora de Guatemala, a un instante UTC. Rechaza fechas
// imposibles (2026-02-30) y fechas en el pasado: el modelo no conoce la hora
// del servidor y a veces propone "ayer".
export function parseDueAtGuatemala(
  fecha: string,
  hora: string | null | undefined,
  now: Date = new Date(),
): Date | ToolError {
  const day = parseDay(fecha);
  if (!day || day.toISOString().slice(0, 10) !== fecha) {
    return { error: 'Fecha inválida: usa el formato AAAA-MM-DD.' };
  }
  const time = TIME_RE.exec(hora?.trim() || '09:00');
  if (!time) {
    return { error: 'Hora inválida: usa el formato HH:mm (24 horas).' };
  }
  const dueAt = new Date(
    day.getTime() +
      (Number(time[1]) + GUATEMALA_UTC_OFFSET_HOURS) * 3_600_000 +
      Number(time[2]) * 60_000,
  );
  if (dueAt.getTime() < now.getTime()) {
    return { error: 'La fecha del seguimiento ya pasó: propone una futura.' };
  }
  return dueAt;
}

// Herramientas (tool calling) del chat. Cada una llama a un CASO DE USO
// existente con el usuario de la sesión: assertCan y el filtro por projectId se
// aplican igual que en las pantallas, así que el asistente nunca ve más de lo
// que el usuario podría ver. El projectId sale de la ruta, nunca del modelo.
@Injectable()
export class AssistantChatTools {
  private readonly logger = new Logger(AssistantChatTools.name);

  constructor(
    private readonly listLeads: ListLeadsUseCase,
    private readonly getLeadContext: GetLeadContextForAiUseCase,
    private readonly listClients: ListClientsUseCase,
    private readonly listQuotes: ListQuotesUseCase,
    private readonly getDashboard: GetDashboardUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly listFollowUps: ListFollowUpsUseCase,
    private readonly createFollowUp: CreateFollowUpUseCase,
  ) {}

  build(actor: Actor): ToolSet {
    return {
      buscar_leads: tool({
        description:
          'Busca leads del proyecto por texto (nombre, empresa, correo o teléfono) y/o etapa. Sin texto devuelve los más recientes.',
        inputSchema: z.object({
          texto: z.string().optional().describe('Texto a buscar'),
          etapa: z.enum(LEAD_STAGES).optional().describe('Etapa del lead'),
          soloMios: z
            .boolean()
            .optional()
            .describe('true = solo los leads asignados al usuario actual'),
        }),
        execute: ({ texto, etapa, soloMios }) =>
          this.safe('buscar_leads', async () => {
            const page = await this.listLeads.execute({
              ...actor,
              search: texto?.trim() || undefined,
              stage: etapa,
              assignedUserId: soloMios ? actor.actorUserId : undefined,
              sortBy: 'updatedAt',
              order: 'desc',
              limit: 15,
            });
            return {
              total: page.total,
              leads: page.leads.map(leadForPrompt),
            };
          }),
      }),

      ver_lead: tool({
        description:
          'Detalle de un lead: datos, cotizaciones, seguimientos pendientes y últimos mensajes de WhatsApp. Requiere el id (obtenlo con buscar_leads).',
        inputSchema: z.object({
          leadId: z.string().describe('id (uuid) del lead'),
        }),
        execute: ({ leadId }) =>
          this.safe('ver_lead', async () => {
            if (!UUID_RE.test(leadId)) {
              return {
                error: 'Id de lead inválido: búscalo primero con buscar_leads.',
              };
            }
            const context = await this.getLeadContext.execute({
              ...actor,
              leadId,
            });
            const followUps = await this.listFollowUps.execute({
              ...actor,
              leadId,
              status: 'PENDING',
              limit: 10,
            });
            return {
              lead: leadForPrompt(context.lead),
              cotizaciones: context.quotes.slice(0, 10).map(quoteForPrompt),
              seguimientosPendientes:
                followUps.followUps.map(followUpForPrompt),
              ultimosMensajes: messagesForPrompt(context.messages, 10),
            };
          }),
      }),

      buscar_clientes: tool({
        description:
          'Busca clientes (cuentas) por nombre, empresa o NIT, con su número de cotizaciones y ventas.',
        inputSchema: z.object({
          texto: z.string().optional().describe('Texto a buscar'),
        }),
        execute: ({ texto }) =>
          this.safe('buscar_clientes', async () => {
            const page = await this.listClients.execute({
              ...actor,
              search: texto?.trim() || undefined,
              limit: 15,
            });
            return {
              total: page.total,
              clientes: page.clients.map((client) => {
                const stats = page.statsById.get(client.id);
                return {
                  ...clientForPrompt(client),
                  cotizaciones: stats?.quotesCount ?? 0,
                  ventasQ: stats?.salesTotal ?? 0,
                };
              }),
              facturadoEsteAnioQ: page.summary.billedThisYear,
            };
          }),
      }),

      buscar_cotizaciones: tool({
        description:
          'Lista cotizaciones por estado y/o texto (folio, lead o cliente). Con porVencerEnDias devuelve las que vencen en los próximos N días (por defecto entre las enviadas).',
        inputSchema: z.object({
          estado: z.enum(QUOTE_STATUSES).optional().describe('Estado'),
          texto: z.string().optional().describe('Folio, lead o cliente'),
          porVencerEnDias: z
            .number()
            .optional()
            .describe('Solo las que vencen dentro de estos días (1 a 60)'),
        }),
        execute: ({ estado, texto, porVencerEnDias }) =>
          this.safe('buscar_cotizaciones', async () => {
            const days =
              typeof porVencerEnDias === 'number' && porVencerEnDias > 0
                ? Math.min(60, Math.round(porVencerEnDias))
                : 0;
            const expiring = days > 0;
            const page = await this.listQuotes.execute({
              ...actor,
              status: estado ?? (expiring ? 'SENT' : undefined),
              search: texto?.trim() || undefined,
              sortBy: 'createdAt',
              order: 'desc',
              limit: expiring ? 100 : 20,
            });
            let quotes = page.quotes;
            if (expiring) {
              const now = Date.now();
              const limit = now + days * DAY_MS;
              quotes = quotes
                .filter(
                  (quote) =>
                    quote.validUntil !== null &&
                    quote.validUntil.getTime() >= now &&
                    quote.validUntil.getTime() <= limit,
                )
                .sort(
                  (a, b) =>
                    (a.validUntil?.getTime() ?? 0) -
                    (b.validUntil?.getTime() ?? 0),
                );
            }
            return {
              total: expiring ? quotes.length : page.total,
              sumaTotalQ: expiring
                ? quotes.reduce((sum, quote) => sum + quote.total, 0)
                : page.sumTotal,
              cotizaciones: quotes.slice(0, 20).map(quoteForPrompt),
            };
          }),
      }),

      resumen_dashboard: tool({
        description:
          'Métricas del dashboard: leads activos, pipeline, cotizaciones por estado, ventas (cotizaciones pagadas) por mes y comparación con el período anterior. Fechas en formato AAAA-MM-DD; "hasta" es inclusivo.',
        inputSchema: z.object({
          desde: z.string().optional().describe('Fecha inicial AAAA-MM-DD'),
          hasta: z.string().optional().describe('Fecha final AAAA-MM-DD'),
        }),
        execute: ({ desde, hasta }) =>
          this.safe('resumen_dashboard', async () => {
            const range = this.toRange(desde, hasta);
            if ('error' in range) {
              return range;
            }
            const dashboard = await this.getDashboard.execute({
              ...actor,
              from: range.from,
              to: range.to,
            });
            return {
              resumen: dashboard.summary,
              periodo: dashboard.periodo,
              leadsPorEtapa: dashboard.leads.porEstado,
              cotizacionesPorEstado: dashboard.quotes.porEstado,
              ventasPorMes: dashboard.sales.porPeriodo.slice(-6),
              conversionPorMes: dashboard.conversion.porPeriodo.slice(-6),
            };
          }),
      }),

      catalogo_productos: tool({
        description:
          'Productos y servicios ACTIVOS del catálogo con precio y descuento máximo.',
        inputSchema: z.object({
          texto: z.string().optional().describe('Nombre o descripción'),
        }),
        execute: ({ texto }) =>
          this.safe('catalogo_productos', async () => {
            const page = await this.listProducts.execute({
              ...actor,
              active: true,
              search: texto?.trim() || undefined,
              limit: 30,
            });
            return {
              total: page.total,
              productos: catalogForPrompt(page.products),
            };
          }),
      }),

      seguimientos_pendientes: tool({
        description:
          'Seguimientos pendientes (llamadas, reuniones, tareas) con su fecha y si están vencidos. Útil para "¿qué debo atender hoy?".',
        inputSchema: z.object({
          soloMios: z
            .boolean()
            .optional()
            .describe('true (por defecto) = solo los asignados al usuario'),
          soloVencidos: z
            .boolean()
            .optional()
            .describe('true = solo los que ya pasaron su fecha'),
        }),
        execute: ({ soloMios, soloVencidos }) =>
          this.safe('seguimientos_pendientes', async () => {
            const page = await this.listFollowUps.execute({
              ...actor,
              status: 'PENDING',
              assignedUserId:
                soloMios === false ? undefined : actor.actorUserId,
              overdue: soloVencidos ? true : undefined,
              limit: 25,
            });
            return {
              total: page.total,
              seguimientos: page.followUps.map(followUpForPrompt),
            };
          }),
      }),

      // ÚNICA herramienta que ESCRIBE en la base. needsApproval: el SDK no
      // ejecuta "execute" hasta que el usuario aprueba en el chat; la
      // solicitud va firmada (HMAC) y se verifica al volver del navegador.
      crear_seguimiento: tool({
        description:
          'Programa un seguimiento (llamada, reunión, correo, WhatsApp o tarea) para un lead. Requiere el id del lead (obtenlo con buscar_leads) y SIEMPRE la aprobación del usuario antes de guardarse. Úsala solo si el usuario pidió agendar o programar algo.',
        inputSchema: z.object({
          leadId: z.string().describe('id (uuid) del lead, de buscar_leads'),
          tipo: z.enum(FOLLOW_UP_TYPES).describe('Tipo de seguimiento'),
          titulo: z
            .string()
            .describe(
              'Título corto y concreto, p. ej. "Llamar para confirmar pedido"',
            ),
          fecha: z
            .string()
            .describe('Fecha AAAA-MM-DD en hora de Guatemala, hoy o futura'),
          hora: z
            .string()
            .nullable()
            .describe(
              'Hora HH:mm (24 h) en hora de Guatemala; null si el usuario no dio hora',
            ),
          notas: z
            .string()
            .nullable()
            .describe(
              'Detalle adicional que dio el usuario; null si no dio ninguno',
            ),
        }),
        needsApproval: true,
        execute: ({ leadId, tipo, titulo, fecha, hora, notas }) =>
          this.safe('crear_seguimiento', async () => {
            if (!UUID_RE.test(leadId)) {
              return {
                error: 'Id de lead inválido: búscalo primero con buscar_leads.',
              };
            }
            const title = titulo.trim().slice(0, 200);
            if (!title) {
              return { error: 'El seguimiento necesita un título.' };
            }
            const dueAt = parseDueAtGuatemala(fecha, hora);
            if ('error' in dueAt) {
              return dueAt;
            }
            const created = await this.createFollowUp.execute({
              ...actor,
              leadId,
              type: tipo,
              title,
              notes: notas?.trim().slice(0, 2000) || null,
              dueAt,
            });
            return { creado: true, seguimiento: followUpForPrompt(created) };
          }),
      }),
    };
  }

  // [from, to) para GetDashboardUseCase. Sin fechas: últimos 30 días.
  private toRange(
    desde: string | undefined,
    hasta: string | undefined,
  ): { from: Date; to: Date } | ToolError {
    const from = parseDay(desde);
    const until = parseDay(hasta);
    if ((desde && !from) || (hasta && !until)) {
      return { error: 'Fechas inválidas: usa el formato AAAA-MM-DD.' };
    }
    const to = until
      ? new Date(until.getTime() + DAY_MS)
      : new Date(Date.now() + DAY_MS);
    const start = from ?? new Date(to.getTime() - 31 * DAY_MS);
    if (start.getTime() >= to.getTime()) {
      return { error: '"desde" debe ser anterior a "hasta".' };
    }
    return { from: start, to };
  }

  // Un error de una herramienta no debe romper el chat: se devuelve al modelo
  // como dato para que lo explique al usuario.
  private async safe<T>(
    name: string,
    run: () => Promise<T>,
  ): Promise<T | ToolError> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof HttpException) {
        const status: number = error.getStatus();
        if (status === Number(HttpStatus.FORBIDDEN)) {
          return {
            error:
              'El usuario no tiene permiso para consultar esta información.',
          };
        }
        if (status === Number(HttpStatus.NOT_FOUND)) {
          return { error: 'No se encontró el registro en este proyecto.' };
        }
        if (status < 500) {
          return { error: error.message };
        }
      }
      this.logger.error(
        `Herramienta ${name} falló: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { error: 'No se pudo consultar el CRM en este momento.' };
    }
  }
}
