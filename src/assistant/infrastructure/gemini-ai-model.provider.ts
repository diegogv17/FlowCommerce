import { randomBytes } from 'node:crypto';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  APICallError,
  InvalidToolApprovalSignatureError,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  Output,
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  type LanguageModel,
} from 'ai';
import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '../../common/exceptions/domain.exceptions';
import type {
  AiChatStream,
  AiModelProvider,
  GenerateStructuredInput,
  StreamChatInput,
} from '../application/ports/ai-model.provider';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Adaptador de Google Gemini con el Vercel AI SDK (v6). La clave se lee una vez
// al arrancar: sin GEMINI_API_KEY el adaptador queda "no configurado" y los
// casos de uso responden 503 en lugar de tumbar la app. La clave nunca sale
// del servidor: el navegador solo habla con esta API.
@Injectable()
export class GeminiAiModelProvider implements AiModelProvider {
  private readonly logger = new Logger(GeminiAiModelProvider.name);
  private readonly model: LanguageModel | null;
  // Firma HMAC de las solicitudes de aprobación (needsApproval): el servidor
  // firma cada solicitud y verifica la firma cuando el navegador la devuelve,
  // así un cliente no puede fabricar una aprobación que el modelo nunca pidió.
  private readonly toolApprovalSecret: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY')?.trim();
    const modelId =
      config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
    this.model = apiKey ? createGoogleGenerativeAI({ apiKey })(modelId) : null;

    const secret = config.get<string>('AI_TOOL_APPROVAL_SECRET')?.trim();
    if (secret) {
      this.toolApprovalSecret = secret;
    } else {
      // Sin secreto fijo funciona igual, pero las aprobaciones pendientes no
      // sobreviven a un reinicio ni se comparten entre réplicas.
      this.toolApprovalSecret = randomBytes(32).toString('hex');
      if (apiKey) {
        this.logger.warn(
          'AI_TOOL_APPROVAL_SECRET no está definido: se usa uno aleatorio por proceso.',
        );
      }
    }
  }

  isConfigured(): boolean {
    return this.model !== null;
  }

  async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
    const model = this.requireModel();
    try {
      // Output.object: el SDK convierte el esquema zod (con sus .describe())
      // a JSON Schema para Gemini y VALIDA la respuesta antes de devolverla.
      // Si no cumple el esquema lanza NoObjectGeneratedError (→ 502).
      const result = await generateText({
        model,
        system: input.system,
        prompt: input.prompt,
        output: Output.object({
          schema: input.schema,
          name: input.schemaName,
          description: input.schemaDescription,
        }),
        abortSignal: input.abortSignal,
        // Respuestas comerciales: algo de variedad, sin inventiva excesiva.
        temperature: 0.4,
        maxRetries: 1,
      });
      return result.output;
    } catch (error) {
      throw this.translate(error);
    }
  }

  async streamChat(input: StreamChatInput): Promise<AiChatStream> {
    const model = this.requireModel();
    // En v6 la conversión es asíncrona. Aquí también se convierten las
    // respuestas de aprobación (approval-responded) en mensajes de modelo.
    const messages = await convertToModelMessages(input.messages, {
      tools: input.tools,
      ignoreIncompleteToolCalls: true,
    });
    const result = streamText({
      model,
      system: input.system,
      messages,
      tools: input.tools,
      // Tool calling en varios pasos: el modelo consulta herramientas y con
      // sus resultados redacta la respuesta; se corta a los N pasos.
      stopWhen: stepCountIs(input.maxSteps),
      experimental_toolApprovalSecret: this.toolApprovalSecret,
      abortSignal: input.abortSignal,
      temperature: 0.3,
      maxRetries: 1,
      onError: ({ error }) => {
        this.logger.error(
          `Error en el chat del asistente: ${describeError(error)}`,
        );
      },
    });
    return {
      pipeToResponse: (response) => {
        void result.pipeUIMessageStreamToResponse(response, {
          // Se reenvía el historial original para que el SDK conserve los ids
          // de los mensajes y de las solicitudes de aprobación.
          originalMessages: input.messages,
          sendReasoning: false,
          // El detalle técnico se queda en el log; el usuario ve un mensaje
          // entendible dentro del chat.
          onError: (error) => this.translate(error).message,
        });
      },
    };
  }

  private requireModel(): LanguageModel {
    if (!this.model) {
      // Los casos de uso ya lo comprueban; esto es defensa en profundidad.
      throw new ServiceUnavailableException(
        'La IA no está configurada en el servidor (falta GEMINI_API_KEY).',
      );
    }
    return this.model;
  }

  // Convierte los errores del proveedor en respuestas HTTP con mensajes en
  // español. Nunca se reenvía el mensaje crudo de Google (puede incluir datos
  // de la petición).
  private translate(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(`Error de Gemini: ${describeError(error)}`);
    if (InvalidToolApprovalSignatureError.isInstance(error)) {
      return new BadRequestException(
        'La aprobación de la acción no es válida o expiró. Pide la acción de nuevo.',
      );
    }
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 429) {
        return new ServiceUnavailableException(
          'La IA está saturada en este momento. Intenta de nuevo en un minuto.',
        );
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        return new ServiceUnavailableException(
          'La clave de Gemini del servidor no es válida. Avisa al administrador.',
        );
      }
    }
    if (
      NoObjectGeneratedError.isInstance(error) ||
      NoOutputGeneratedError.isInstance(error)
    ) {
      return new BadGatewayException(
        'La IA devolvió una respuesta con formato inválido. Intenta de nuevo.',
      );
    }
    return new BadGatewayException(
      'No se pudo obtener respuesta de la IA. Intenta de nuevo.',
    );
  }
}

const describeError = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);
