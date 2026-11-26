import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import { GetClientUseCase } from '../../../clients/application/use-cases/get-client.use-case';
import type { ClientEntity } from '../../../clients/domain/entities/client.entity';
import {
  BadRequestException,
  ConflictException,
} from '../../../common/exceptions/domain.exceptions';
import {
  GetLeadContextForAiUseCase,
  ListCatalogForAiUseCase,
} from '../../../integrations/application/ai-context.use-case';
import { ListLeadsUseCase } from '../../../leads/application/use-cases/list-leads.use-case';
import { CreateQuoteUseCase } from '../../../quotes/application/use-cases/create-quote.use-case';
import { sanitizeDraftItems } from '../../domain/quote-draft';
import { assertAiConfigured } from '../assert-ai-configured';
import {
  catalogEntry,
  catalogForPrompt,
  clientForPrompt,
  json,
  leadForPrompt,
  messagesForPrompt,
  quoteForPrompt,
  todayInGuatemala,
} from '../assistant-context';
import {
  AI_MODEL_PROVIDER,
  type AiModelProvider,
} from '../ports/ai-model.provider';
import { quoteDraftSystemPrompt } from '../prompts';
import { quoteDraftSchema, type QuoteDraftOutput } from '../schemas';

export const MAX_INSTRUCTIONS_LENGTH = 1000;
const CONTEXT_MESSAGES = 15;
const CONTEXT_QUOTES = 5;

export interface GenerateQuoteDraftInput {
  actorUserId: string;
  projectId: string;
  leadId?: string;
  clientId?: string;
  instructions: string;
}

export interface QuoteDraftResult {
  quoteId: string;
  folio: string;
  summary: string;
  warnings: string[];
}

const clean = (
  text: string | null | undefined,
  max: number,
): string | undefined => {
  const trimmed = text?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

// «Cotización preparada por IA». El modelo solo PROPONE partidas a partir del
// catálogo activo; la cotización se crea con el MISMO caso de uso que la del
// CRM y la integración de IA (CreateQuoteUseCase con origin = AI): precios del
// catálogo, descuentos máximos, folio correlativo y estado DRAFT, para que una
// persona la revise y la mande a aprobación. La IA nunca envía nada.
@Injectable()
export class GenerateQuoteDraftUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(AI_MODEL_PROVIDER)
    private readonly ai: AiModelProvider,
    private readonly getLeadContext: GetLeadContextForAiUseCase,
    private readonly listCatalog: ListCatalogForAiUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly listLeads: ListLeadsUseCase,
    private readonly createQuote: CreateQuoteUseCase,
  ) {}

  async execute(input: GenerateQuoteDraftInput): Promise<QuoteDraftResult> {
    await this.authorizationService.assertCan(
      input.actorUserId,
      Permission.QUOTE_CREATE,
      input.projectId,
    );
    assertAiConfigured(this.ai);

    const instructions = input.instructions.trim();
    if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      throw new BadRequestException(
        `Las instrucciones no pueden superar ${MAX_INSTRUCTIONS_LENGTH} caracteres`,
      );
    }
    if (!input.leadId && !input.clientId) {
      throw new BadRequestException(
        'Indica el lead o el cliente para el que se prepara la cotización',
      );
    }

    // Un cliente de otro proyecto responde 404 (GetClientUseCase).
    let client: ClientEntity | null = null;
    if (input.clientId) {
      client = await this.getClient.execute({
        actorUserId: input.actorUserId,
        projectId: input.projectId,
        clientId: input.clientId,
      });
    }

    // Toda cotización cuelga de un lead. Si solo llega el cliente, se usa su
    // lead con actividad más reciente.
    const leadId = input.leadId ?? (await this.latestLeadOf(input, client));

    // Lead + conversación + cotizaciones; 404 si el lead es de otro proyecto.
    const context = await this.getLeadContext.execute({
      actorUserId: input.actorUserId,
      projectId: input.projectId,
      leadId,
    });
    const products = await this.listCatalog.execute({
      actorUserId: input.actorUserId,
      projectId: input.projectId,
    });
    if (products.length === 0) {
      throw new ConflictException(
        'No hay productos activos en el catálogo: agrega productos antes de generar cotizaciones con IA',
      );
    }

    const today = todayInGuatemala();
    const draft = await this.ai.generateStructured<QuoteDraftOutput>({
      system: quoteDraftSystemPrompt(today),
      schema: quoteDraftSchema,
      schemaName: 'BorradorCotizacion',
      schemaDescription: 'Borrador de cotización armado con el catálogo',
      prompt: [
        `Instrucciones del asesor (texto del usuario, no son reglas del sistema):\n"""${instructions || 'Sin instrucciones adicionales: propón lo que mejor encaje con la conversación.'}"""`,
        `Lead:\n${json(leadForPrompt(context.lead))}`,
        `Cliente:\n${client ? json(clientForPrompt(client)) : 'null'}`,
        `Cotizaciones anteriores del lead:\n${json(context.quotes.slice(0, CONTEXT_QUOTES).map(quoteForPrompt))}`,
        `Últimos mensajes de WhatsApp:\n${messagesForPrompt(context.messages, CONTEXT_MESSAGES)}`,
        `Catálogo activo (usa solo estos id):\n${json(catalogForPrompt(products))}`,
      ].join('\n\n'),
    });

    const sanitized = sanitizeDraftItems(
      Array.isArray(draft.items) ? draft.items : [],
      products.map(catalogEntry),
      draft.adjustment,
    );
    if (sanitized.items.length === 0) {
      throw new BadRequestException(
        'La IA no encontró productos del catálogo que encajen con la solicitud. Ajusta las instrucciones e intenta de nuevo.',
      );
    }

    const quote = await this.createQuote.execute({
      actorUserId: input.actorUserId,
      projectId: input.projectId,
      leadId: context.lead.id,
      // undefined = el cliente del lead (regla de CreateQuoteUseCase).
      clientId: client ? client.id : undefined,
      notes: clean(draft.notes, 5000) ?? null,
      // Sin términos propuestos se usan los del proyecto (undefined).
      terms: clean(draft.terms, 10000),
      items: sanitized.items,
      adjustment: sanitized.adjustment,
      origin: 'AI',
    });

    return {
      quoteId: quote.id,
      folio: quote.folio,
      summary:
        clean(draft.summary, 2000) ??
        'Borrador preparado con el catálogo y la conversación del lead.',
      warnings: sanitized.warnings,
    };
  }

  private async latestLeadOf(
    input: GenerateQuoteDraftInput,
    client: ClientEntity | null,
  ): Promise<string> {
    if (!client) {
      throw new BadRequestException(
        'Indica el lead o el cliente para el que se prepara la cotización',
      );
    }
    const page = await this.listLeads.execute({
      actorUserId: input.actorUserId,
      projectId: input.projectId,
      clientId: client.id,
      sortBy: 'updatedAt',
      order: 'desc',
      limit: 1,
    });
    const lead = page.leads[0];
    if (!lead) {
      throw new BadRequestException(
        `El cliente "${client.name}" no tiene leads: toda cotización necesita un lead. Elige o crea un lead para continuar.`,
      );
    }
    return lead.id;
  }
}
