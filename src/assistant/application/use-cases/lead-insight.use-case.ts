import { Inject, Injectable } from '@nestjs/common';
import { ListActivityUseCase } from '../../../activity/application/use-cases/list-activity.use-case';
import { ListFollowUpsUseCase } from '../../../follow-ups/application/use-cases/follow-ups.use-cases';
import { GetLeadContextForAiUseCase } from '../../../integrations/application/ai-context.use-case';
import { clampInt } from '../../domain/quote-draft';
import { assertAiConfigured } from '../assert-ai-configured';
import {
  activityForPrompt,
  followUpForPrompt,
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
import { leadInsightSystemPrompt } from '../prompts';
import { leadInsightSchema, type LeadInsightOutput } from '../schemas';

const CONTEXT_MESSAGES = 20;
const CONTEXT_QUOTES = 5;
const CONTEXT_FOLLOW_UPS = 10;
const CONTEXT_ACTIVITY = 15;
const MAX_RISKS = 4;

export interface LeadInsight {
  summary: string;
  nextBestAction: string;
  // null = el modelo no tuvo datos suficientes para estimarla (no se adivina).
  closeProbability: number | null;
  risks: string[];
  suggestedFollowUpDays: number;
  generatedAt: string;
}

// Tarjeta «Insight de IA» del detalle del lead. Lee con los permisos del
// usuario (LEAD_READ) y un lead de otro proyecto responde 404, igual que en el
// resto del CRM. Los números que devuelve el modelo se acotan en código.
@Injectable()
export class GetLeadInsightUseCase {
  constructor(
    @Inject(AI_MODEL_PROVIDER)
    private readonly ai: AiModelProvider,
    private readonly getLeadContext: GetLeadContextForAiUseCase,
    private readonly listFollowUps: ListFollowUpsUseCase,
    private readonly listActivity: ListActivityUseCase,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
    leadId: string;
  }): Promise<LeadInsight> {
    assertAiConfigured(this.ai);

    // assertCan(LEAD_READ) + 404 si el lead no es del proyecto.
    const context = await this.getLeadContext.execute(input);
    const [followUps, activity] = await Promise.all([
      this.listFollowUps.execute({
        actorUserId: input.actorUserId,
        projectId: input.projectId,
        leadId: context.lead.id,
        limit: CONTEXT_FOLLOW_UPS,
      }),
      this.listActivity.execute({
        actorUserId: input.actorUserId,
        projectId: input.projectId,
        leadId: context.lead.id,
        page: 1,
        limit: CONTEXT_ACTIVITY,
      }),
    ]);

    const output = await this.ai.generateStructured<LeadInsightOutput>({
      system: leadInsightSystemPrompt(todayInGuatemala()),
      schema: leadInsightSchema,
      schemaName: 'InsightLead',
      prompt: [
        `Lead:\n${json(leadForPrompt(context.lead))}`,
        `Seguimientos:\n${json(followUps.followUps.map(followUpForPrompt))}`,
        `Cotizaciones (más recientes primero):\n${json(context.quotes.slice(0, CONTEXT_QUOTES).map(quoteForPrompt))}`,
        `Actividad reciente:\n${json(activity.events.map(activityForPrompt))}`,
        `Últimos mensajes de WhatsApp:\n${messagesForPrompt(context.messages, CONTEXT_MESSAGES)}`,
      ].join('\n\n'),
    });

    return {
      summary: String(output.summary ?? '').trim() || 'Sin resumen disponible.',
      nextBestAction:
        String(output.nextBestAction ?? '').trim() ||
        'Revisa la conversación y agenda un seguimiento.',
      closeProbability:
        output.closeProbability === null
          ? null
          : clampInt(output.closeProbability, 0, 100),
      risks: (Array.isArray(output.risks) ? output.risks : [])
        .filter((risk): risk is string => typeof risk === 'string')
        .map((risk) => risk.trim())
        .filter(Boolean)
        .slice(0, MAX_RISKS),
      suggestedFollowUpDays: clampInt(output.suggestedFollowUpDays, 0, 60),
      generatedAt: new Date().toISOString(),
    };
  }
}
