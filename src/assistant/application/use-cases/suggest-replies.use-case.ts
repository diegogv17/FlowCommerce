import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import { BadGatewayException } from '../../../common/exceptions/domain.exceptions';
import {
  GetLeadContextForAiUseCase,
  ListCatalogForAiUseCase,
} from '../../../integrations/application/ai-context.use-case';
import { assertAiConfigured } from '../assert-ai-configured';
import {
  catalogForPrompt,
  json,
  leadForPrompt,
  messagesForPrompt,
  todayInGuatemala,
} from '../assistant-context';
import {
  AI_MODEL_PROVIDER,
  type AiModelProvider,
} from '../ports/ai-model.provider';
import { replySuggestionsSystemPrompt } from '../prompts';
import {
  replySuggestionsSchema,
  type ReplySuggestionsOutput,
} from '../schemas';

const CONTEXT_MESSAGES = 15;
const CATALOG_IN_PROMPT = 40;
const MAX_SUGGESTIONS = 3;
// WhatsApp admite 4096 caracteres; una sugerencia «corta» no debería pasar de esto.
const MAX_SUGGESTION_CHARS = 1000;

// «✦ Sugerir respuesta» en Conversaciones. Solo devuelve textos: el asesor
// elige uno, lo edita si quiere y lo envía él mismo (la IA no envía nada).
@Injectable()
export class SuggestRepliesUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(AI_MODEL_PROVIDER)
    private readonly ai: AiModelProvider,
    private readonly getLeadContext: GetLeadContextForAiUseCase,
    private readonly listCatalog: ListCatalogForAiUseCase,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
    leadId: string;
  }): Promise<{ suggestions: string[] }> {
    // Sugerir respuestas tiene sentido solo para quien puede enviar mensajes.
    await this.authorizationService.assertCan(
      input.actorUserId,
      Permission.WHATSAPP_SEND_MESSAGE,
      input.projectId,
    );
    assertAiConfigured(this.ai);

    const context = await this.getLeadContext.execute(input);
    const products = await this.listCatalog.execute(input);

    const output = await this.ai.generateStructured<ReplySuggestionsOutput>({
      system: replySuggestionsSystemPrompt(todayInGuatemala()),
      schema: replySuggestionsSchema,
      schemaName: 'SugerenciasRespuesta',
      prompt: [
        `Lead:\n${json(leadForPrompt(context.lead))}`,
        `Últimos mensajes (del más antiguo al más reciente):\n${messagesForPrompt(context.messages, CONTEXT_MESSAGES)}`,
        context.messages.length === 0
          ? 'No hay conversación todavía: sugiere mensajes de primer contacto.'
          : 'Sugiere respuestas al último mensaje, considerando toda la conversación.',
        `Catálogo activo:\n${json(catalogForPrompt(products.slice(0, CATALOG_IN_PROMPT)))}`,
      ].join('\n\n'),
    });

    const suggestions = normalizeSuggestions(output.suggestions);
    if (suggestions.length === 0) {
      throw new BadGatewayException(
        'La IA no devolvió sugerencias. Intenta de nuevo.',
      );
    }
    return { suggestions };
  }
}

// Limpia, quita duplicados y vacíos, y recorta a 3 sugerencias.
export function normalizeSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const text = value.trim().slice(0, MAX_SUGGESTION_CHARS);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length === MAX_SUGGESTIONS) break;
  }
  return result;
}
