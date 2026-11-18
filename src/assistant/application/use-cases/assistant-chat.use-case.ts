import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import { assertAiConfigured } from '../assert-ai-configured';
import { todayInGuatemala } from '../assistant-context';
import { parseChatMessages } from '../chat-messages';
import { AssistantChatTools } from '../chat-tools';
import {
  AI_MODEL_PROVIDER,
  type AiChatStream,
  type AiModelProvider,
} from '../ports/ai-model.provider';
import { chatSystemPrompt } from '../prompts';

// Pasos máximos modelo → herramienta → modelo por cada mensaje del usuario.
export const CHAT_MAX_STEPS = 5;

// Chat del asistente (/asistente). Valida el historial, prepara las
// herramientas con el usuario de la sesión y devuelve el stream listo para
// escribirse en la respuesta HTTP.
@Injectable()
export class AssistantChatUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(AI_MODEL_PROVIDER)
    private readonly ai: AiModelProvider,
    private readonly tools: AssistantChatTools,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
    body: unknown;
    abortSignal?: AbortSignal;
  }): Promise<AiChatStream> {
    await this.authorizationService.assertCan(
      input.actorUserId,
      Permission.LEAD_READ,
      input.projectId,
    );
    assertAiConfigured(this.ai);
    const messages = parseChatMessages(input.body);

    return this.ai.streamChat({
      system: chatSystemPrompt(todayInGuatemala()),
      messages,
      tools: this.tools.build({
        actorUserId: input.actorUserId,
        projectId: input.projectId,
      }),
      maxSteps: CHAT_MAX_STEPS,
      abortSignal: input.abortSignal,
    });
  }
}
