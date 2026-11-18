import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Permission } from '@flowcommerce/types';
import { CurrentUserId } from '../../auth/presentation/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../../auth/presentation/guards/authenticated.guard';
import { RequirePermission } from '../../authorization/presentation/decorators/require-permission.decorator';
import { ProjectPermissionGuard } from '../../authorization/presentation/guards/project-permission.guard';
import { THROTTLE } from '../../common/config/throttle';
import { AssistantChatUseCase } from '../application/use-cases/assistant-chat.use-case';
import { GenerateQuoteDraftUseCase } from '../application/use-cases/generate-quote-draft.use-case';
import { GetLeadInsightUseCase } from '../application/use-cases/lead-insight.use-case';
import { SuggestRepliesUseCase } from '../application/use-cases/suggest-replies.use-case';
import {
  LeadInsightResponseDto,
  QuoteDraftRequestDto,
  QuoteDraftResponseDto,
  ReplySuggestionsResponseDto,
} from './dto/assistant.dto';
import { AiThrottlerGuard } from './guards/ai-throttler.guard';

// Asistente de IA del CRM (Gemini vía Vercel AI SDK), con la sesión del
// usuario: a diferencia de /integrations/ai (API key de otro equipo), aquí
// todo se ejecuta con los permisos de quien está usando la pantalla.
// Orden de guards: sesión → permiso en el proyecto → límite por usuario.
@ApiTags('assistant')
@Controller({ path: 'projects/:projectId/assistant', version: '1' })
@UseGuards(AuthenticatedGuard, ProjectPermissionGuard, AiThrottlerGuard)
@Throttle(THROTTLE.ai)
@ApiUnauthorizedResponse({ description: 'Sin sesión activa' })
@ApiForbiddenResponse({
  description: 'Sin el permiso requerido en el proyecto (o proyecto ajeno)',
})
@ApiServiceUnavailableResponse({
  description: 'IA no configurada (falta GEMINI_API_KEY) o saturada',
})
@ApiTooManyRequestsResponse({
  description: 'Demasiadas peticiones de IA (THROTTLE_AI_*)',
})
export class AssistantController {
  constructor(
    private readonly chatUseCase: AssistantChatUseCase,
    private readonly quoteDraftUseCase: GenerateQuoteDraftUseCase,
    private readonly suggestRepliesUseCase: SuggestRepliesUseCase,
    private readonly leadInsightUseCase: GetLeadInsightUseCase,
  ) {}

  // El body es el de useChat ({ id, messages: UIMessage[], trigger… }). Se
  // recibe como `unknown` para que el ValidationPipe global no lo procese
  // (forbidNonWhitelisted rechazaría los campos del SDK) y se valida a mano en
  // parseChatMessages. Los errores previos al stream (400/403/503) salen con el
  // formato JSON de siempre; una vez empezado, los errores van dentro del
  // stream como parte "error".
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.LEAD_READ)
  @ApiOperation({
    summary: 'Chat del asistente (streaming, protocolo UI message stream)',
    description:
      'Respuesta en streaming (SSE del Vercel AI SDK v5). Usa herramientas que consultan leads, clientes, cotizaciones, dashboard, catálogo y seguimientos con los permisos del usuario.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['messages'],
      properties: {
        messages: {
          type: 'array',
          maxItems: 40,
          items: { type: 'object' },
          description: 'UIMessage[] de useChat (se usan los últimos 40)',
        },
      },
    },
  })
  @ApiProduces('text/event-stream')
  @ApiBadRequestResponse({ description: 'Historial inválido' })
  async chat(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    // Si el usuario pulsa "Detener" o cierra la pestaña, se corta la llamada
    // al modelo para no seguir gastando cuota.
    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableFinished) {
        abort.abort();
      }
    });

    const stream = await this.chatUseCase.execute({
      actorUserId: userId,
      projectId,
      body,
      abortSignal: abort.signal,
    });
    stream.pipeToResponse(res);
  }

  @Post('quote-draft')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Permission.QUOTE_CREATE)
  @ApiOperation({
    summary: 'Preparar una cotización con IA',
    description:
      'La IA propone partidas del catálogo activo a partir del lead, sus mensajes y las instrucciones. Se crea en DRAFT con origin = AI; los productos inexistentes se descartan y los descuentos se recortan al máximo (ver warnings).',
  })
  @ApiCreatedResponse({ type: QuoteDraftResponseDto })
  @ApiNotFoundResponse({
    description: 'Lead o cliente que no es de este proyecto',
  })
  generateQuoteDraft(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: QuoteDraftRequestDto,
  ): Promise<QuoteDraftResponseDto> {
    return this.quoteDraftUseCase.execute({
      actorUserId: userId,
      projectId,
      leadId: dto.leadId,
      clientId: dto.clientId,
      instructions: dto.instructions,
    });
  }

  @Post('leads/:leadId/reply-suggestions')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.WHATSAPP_SEND_MESSAGE)
  @ApiOperation({
    summary: 'Sugerir respuestas de WhatsApp para un lead',
    description:
      '2 o 3 respuestas cortas según los últimos 15 mensajes, el lead y el catálogo. No envía nada.',
  })
  @ApiOkResponse({ type: ReplySuggestionsResponseDto })
  @ApiNotFoundResponse({ description: 'El lead no es de este proyecto' })
  suggestReplies(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('leadId', ParseUUIDPipe) leadId: string,
  ): Promise<ReplySuggestionsResponseDto> {
    return this.suggestRepliesUseCase.execute({
      actorUserId: userId,
      projectId,
      leadId,
    });
  }

  @Get('leads/:leadId/insight')
  @RequirePermission(Permission.LEAD_READ)
  @ApiOperation({
    summary: 'Insight de IA de un lead',
    description:
      'Resumen, siguiente mejor acción, probabilidad de cierre, riesgos y en cuántos días dar seguimiento.',
  })
  @ApiOkResponse({ type: LeadInsightResponseDto })
  @ApiNotFoundResponse({ description: 'El lead no es de este proyecto' })
  leadInsight(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('leadId', ParseUUIDPipe) leadId: string,
  ): Promise<LeadInsightResponseDto> {
    return this.leadInsightUseCase.execute({
      actorUserId: userId,
      projectId,
      leadId,
    });
  }
}
