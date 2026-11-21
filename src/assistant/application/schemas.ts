import { z } from 'zod';

// Esquemas de salida estructurada (Output.object). Se mantienen sencillos a
// propósito: Gemini acepta un subconjunto de JSON Schema, así que los rangos
// (descuento máximo, 0-100…) se piden en la descripción y se HACEN CUMPLIR en
// código después (domain/quote-draft.ts), nunca se confía en el modelo.
//
// Regla para cada .describe(): decir QUÉ devolver y QUÉ devolver cuando la
// entrada no trae el dato (null, [] o 0). Sin esa instrucción el modelo
// rellena los huecos inventando (condiciones, descuentos o probabilidades que
// nadie pidió). Los campos opcionales son .nullable() y no .optional(): así el
// modelo siempre responde la clave y "no hay dato" es un null explícito.

export const quoteDraftSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z
          .string()
          .describe(
            'id EXACTO copiado de un producto del catálogo proporcionado. Nunca inventes ni modifiques un id; si ningún producto encaja, no agregues la partida.',
          ),
        quantity: z
          .number()
          .describe(
            'Cantidad entera mayor que 0. Usa la cantidad que pidió el cliente o el asesor; si nadie mencionó cantidad, devuelve 1.',
          ),
        discountPercent: z
          .number()
          .describe(
            'Descuento en % para la línea, nunca mayor que el descuento máximo del producto. Devuelve 0 si nadie pidió descuento.',
          ),
        reason: z
          .string()
          .describe(
            'Por qué se incluye esta partida, en una frase, citando lo que dijo el cliente o el asesor. Nunca vacío.',
          ),
      }),
    )
    .describe(
      'Partidas de la cotización. Devuelve [] (lista vacía) si el catálogo no tiene productos que correspondan a lo que se pide; no rellenes con productos al azar.',
    ),
  notes: z
    .string()
    .describe(
      'Notas para el cliente, en español, breves y profesionales. Devuelve "" (texto vacío) si no hay nada relevante que comunicar.',
    ),
  terms: z
    .string()
    .nullable()
    .describe(
      'Condiciones especiales SOLO si el asesor las escribió en sus indicaciones. Devuelve null si el asesor no mencionó condiciones; no inventes plazos, anticipos ni garantías.',
    ),
  adjustment: z
    .number()
    .nullable()
    .describe(
      'Ajuste comercial (descuento global) en quetzales SOLO si el asesor pidió un monto o porcentaje global. Devuelve null si no lo pidió.',
    ),
  summary: z
    .string()
    .describe(
      'Resumen para el asesor (no para el cliente) de lo que se armó y de lo que NO se pudo armar por falta de datos o de productos.',
    ),
});
export type QuoteDraftOutput = z.infer<typeof quoteDraftSchema>;

export const replySuggestionsSchema = z.object({
  suggestions: z
    .array(
      z
        .string()
        .describe(
          'Mensaje de WhatsApp listo para enviar, en español, máximo 3 frases. Solo menciona precios, fechas o productos que aparezcan en el contexto; si no aparecen, no los incluyas.',
        ),
    )
    .describe(
      'Entre 2 y 3 respuestas alternativas, cortas. Devuelve [] (lista vacía) si el último mensaje del cliente no requiere respuesta.',
    ),
});
export type ReplySuggestionsOutput = z.infer<typeof replySuggestionsSchema>;

export const leadInsightSchema = z.object({
  summary: z
    .string()
    .describe(
      'Resumen del estado del lead en 2-3 frases, en español, basado SOLO en los datos dados. Si casi no hay historial, dilo explícitamente.',
    ),
  nextBestAction: z
    .string()
    .describe(
      'Siguiente acción concreta para el asesor (qué hacer y por qué). Si no hay historial, devuelve una acción de primer contacto.',
    ),
  closeProbability: z
    .number()
    .nullable()
    .describe(
      'Probabilidad estimada de cierre, entero de 0 a 100. Devuelve null si no hay mensajes, cotizaciones ni actividad suficientes para estimarla; no adivines.',
    ),
  risks: z
    .array(z.string())
    .describe(
      'Riesgos u objeciones que el cliente expresó o que se ven en los datos (0 a 4), frases cortas. Devuelve [] si no hay ninguno; no inventes objeciones.',
    ),
  suggestedFollowUpDays: z
    .number()
    .describe(
      'En cuántos días hacer el próximo seguimiento, entero de 0 a 60 (0 = hoy). Si ya hay un seguimiento pendiente, usa los días que faltan para ese.',
    ),
});
export type LeadInsightOutput = z.infer<typeof leadInsightSchema>;
