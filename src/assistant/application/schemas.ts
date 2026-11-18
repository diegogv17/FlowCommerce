import { z } from 'zod';

// Esquemas de salida estructurada (generateObject). Se mantienen sencillos a
// propósito: Gemini acepta un subconjunto de JSON Schema, así que los rangos
// (descuento máximo, 0-100…) se piden en la descripción y se HACEN CUMPLIR en
// código después (domain/quote-draft.ts), nunca se confía en el modelo.

export const quoteDraftSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z
          .string()
          .describe('id EXACTO de un producto del catálogo proporcionado'),
        quantity: z.number().describe('Cantidad, mayor que 0'),
        discountPercent: z
          .number()
          .describe(
            'Descuento en % para la línea; 0 si no aplica. Nunca mayor que el descuento máximo del producto',
          ),
        reason: z
          .string()
          .describe('Por qué se incluye esta partida, en una frase'),
      }),
    )
    .describe('Partidas de la cotización'),
  notes: z
    .string()
    .describe('Notas para el cliente, en español, breves y profesionales'),
  terms: z
    .string()
    .optional()
    .describe(
      'Condiciones especiales SOLO si el asesor las pidió; si no, omitir',
    ),
  adjustment: z
    .number()
    .optional()
    .describe(
      'Ajuste comercial en quetzales (descuento global) SOLO si el asesor lo pidió; si no, omitir',
    ),
  summary: z
    .string()
    .describe('Resumen para el asesor (no para el cliente) de lo que se armó'),
});
export type QuoteDraftOutput = z.infer<typeof quoteDraftSchema>;

export const replySuggestionsSchema = z.object({
  suggestions: z
    .array(z.string().describe('Mensaje de WhatsApp listo para enviar'))
    .describe('Entre 2 y 3 respuestas alternativas, cortas'),
});
export type ReplySuggestionsOutput = z.infer<typeof replySuggestionsSchema>;

export const leadInsightSchema = z.object({
  summary: z
    .string()
    .describe('Resumen del estado del lead en 2-3 frases, en español'),
  nextBestAction: z
    .string()
    .describe('Siguiente mejor acción concreta para el asesor'),
  closeProbability: z
    .number()
    .describe('Probabilidad estimada de cierre, entero de 0 a 100'),
  risks: z
    .array(z.string())
    .describe('Riesgos u objeciones detectadas (0 a 4), frases cortas'),
  suggestedFollowUpDays: z
    .number()
    .describe('En cuántos días hacer el próximo seguimiento (0 = hoy)'),
});
export type LeadInsightOutput = z.infer<typeof leadInsightSchema>;
