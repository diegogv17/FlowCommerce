import type { ServerResponse } from 'node:http';
import type { ToolSet, UIMessage } from 'ai';
import type { z } from 'zod';

// Puerto hacia el modelo de lenguaje. Los casos de uso del asistente solo
// conocen esta interfaz: el adaptador real (Gemini, en infrastructure/) se
// cambia sin tocar la lógica y los tests lo sustituyen por un mock.
export const AI_MODEL_PROVIDER = Symbol('AI_MODEL_PROVIDER');

export interface GenerateStructuredInput<T> {
  system: string;
  prompt: string;
  // Esquema zod de la salida: el SDK lo convierte a JSON Schema y valida la
  // respuesta del modelo antes de devolverla.
  schema: z.ZodType<T>;
  schemaName: string;
  schemaDescription?: string;
  abortSignal?: AbortSignal;
}

export interface StreamChatInput {
  system: string;
  // Historial en formato UIMessage (lo que envía useChat del frontend).
  messages: UIMessage[];
  tools: ToolSet;
  // Máximo de pasos modelo → herramienta → modelo antes de cortar.
  maxSteps: number;
  abortSignal?: AbortSignal;
}

// Respuesta en streaming ya preparada: el controller decide dónde escribirla.
export interface AiChatStream {
  pipeToResponse(response: ServerResponse): void;
}

export interface AiModelProvider {
  // false cuando falta GEMINI_API_KEY: las rutas responden 503.
  isConfigured(): boolean;
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
  streamChat(input: StreamChatInput): AiChatStream;
}
