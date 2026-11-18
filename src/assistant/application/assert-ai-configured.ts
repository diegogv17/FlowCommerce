import { ServiceUnavailableException } from '../../common/exceptions/domain.exceptions';
import type { AiModelProvider } from './ports/ai-model.provider';

export const AI_NOT_CONFIGURED_MESSAGE =
  'La IA no está configurada en el servidor (falta GEMINI_API_KEY). Pide al administrador que la configure.';

// Sin clave de Gemini el CRM sigue funcionando; solo las rutas del asistente
// responden 503 con un mensaje que el frontend muestra tal cual.
export function assertAiConfigured(provider: AiModelProvider): void {
  if (!provider.isConfigured()) {
    throw new ServiceUnavailableException(AI_NOT_CONFIGURED_MESSAGE);
  }
}
