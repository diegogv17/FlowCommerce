import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  APICallError,
  NoObjectGeneratedError,
  convertToModelMessages,
  generateObject,
  stepCountIs,
  streamText,
  type LanguageModel,
} from 'ai';
import type { z } from 'zod';
import {
  BadGatewayException,
  ServiceUnavailableException,
} from '../../common/exceptions/domain.exceptions';
import type {
  AiChatStream,
  AiModelProvider,
  GenerateStructuredInput,
  StreamChatInput,
} from '../application/ports/ai-model.provider';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Adaptador de Google Gemini con el Vercel AI SDK. La clave se lee una vez al
// arrancar: sin GEMINI_API_KEY el adaptador queda "no configurado" y los casos
// de uso responden 503 en lugar de tumbar la app.
@Injectable()
export class GeminiAiModelProvider implements AiModelProvider {
  private readonly logger = new Logger(GeminiAiModelProvider.name);
  private readonly model: LanguageModel | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY')?.trim();
    const modelId =
      config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
    this.model = apiKey ? createGoogleGenerativeAI({ apiKey })(modelId) : null;
  }

  isConfigured(): boolean {
    return this.model !== null;
  }

  async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
    const model = this.requireModel();
    try {
      // El esquema se pasa con un tipo concreto para que la inferencia de
      // generateObject no dependa del genérico T; la validación en tiempo de
      // ejecución la hace igual el esquema real.
      const result = await generateObject({
        model,
        output: 'object',
        system: input.system,
        prompt: input.prompt,
        schema: input.schema as unknown as z.ZodType<Record<string, unknown>>,
        schemaName: input.schemaName,
        schemaDescription: input.schemaDescription,
        abortSignal: input.abortSignal,
        // Respuestas comerciales: algo de variedad, sin inventiva excesiva.
        temperature: 0.4,
        maxRetries: 1,
      });
      return result.object as unknown as T;
    } catch (error) {
      throw this.translate(error);
    }
  }

  streamChat(input: StreamChatInput): AiChatStream {
    const model = this.requireModel();
    const result = streamText({
      model,
      system: input.system,
      messages: convertToModelMessages(input.messages),
      tools: input.tools,
      // Tool calling en varios pasos: el modelo consulta herramientas y con
      // sus resultados redacta la respuesta; se corta a los N pasos.
      stopWhen: stepCountIs(input.maxSteps),
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
    if (NoObjectGeneratedError.isInstance(error)) {
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
