// Tipos de respuesta del asistente de IA, copiados de los DTO del backend
// (src/assistant/presentation/dto/assistant.dto.ts).

/** GET /assistant/leads/:leadId/insight (LeadInsightResponseDto) */
export interface LeadInsight {
  summary: string;
  nextBestAction: string;
  /** 0-100 */
  closeProbability: number;
  risks: string[];
  suggestedFollowUpDays: number;
  generatedAt: string;
}

/** POST /assistant/leads/:leadId/reply-suggestions */
export interface ReplySuggestionsResponse {
  suggestions: string[];
}

/** Body de POST /assistant/quote-draft (QuoteDraftRequestDto) */
export interface QuoteDraftInput {
  leadId?: string;
  clientId?: string;
  /** Máximo 1000 caracteres. */
  instructions: string;
}

/** QuoteDraftResponseDto */
export interface QuoteDraftResult {
  quoteId: string;
  folio: string;
  summary: string;
  warnings: string[];
}

export const MAX_INSTRUCTIONS_LENGTH = 1000;
