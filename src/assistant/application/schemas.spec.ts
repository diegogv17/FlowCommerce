import { z } from 'zod';
import {
  leadInsightSchema,
  quoteDraftSchema,
  replySuggestionsSchema,
} from './schemas';

// Recorre un esquema y devuelve cada campo con su ruta, para comprobar que
// TODOS tengan .describe() (lo que el modelo lee para no alucinar).
type Field = { path: string; schema: z.ZodTypeAny };

function fieldsOf(schema: z.ZodTypeAny, prefix = ''): Field[] {
  if (schema instanceof z.ZodObject) {
    return Object.entries(schema.shape as Record<string, z.ZodTypeAny>).flatMap(
      ([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return [{ path, schema: value }, ...fieldsOf(value, path)];
      },
    );
  }
  if (schema instanceof z.ZodArray) {
    return fieldsOf(schema.element as z.ZodTypeAny, `${prefix}[]`);
  }
  if (schema instanceof z.ZodNullable) {
    return fieldsOf(schema.unwrap() as z.ZodTypeAny, prefix);
  }
  return [];
}

const ALL_SCHEMAS = {
  quoteDraftSchema,
  replySuggestionsSchema,
  leadInsightSchema,
};

describe('esquemas de salida estructurada', () => {
  it.each(Object.entries(ALL_SCHEMAS))(
    '%s: cada campo tiene .describe() con instrucciones',
    (_name, schema) => {
      // Preparar
      const fields = fieldsOf(schema);

      // Actuar
      const sinDescripcion = fields
        .filter((field) => (field.schema.description ?? '').trim().length < 20)
        .map((field) => field.path);

      // Comprobar
      expect(fields.length).toBeGreaterThan(0);
      expect(sinDescripcion).toEqual([]);
    },
  );

  it.each(Object.entries(ALL_SCHEMAS))(
    '%s: los campos anulables dicen cuándo devolver null y las listas cuándo []',
    (_name, schema) => {
      // Preparar
      const fields = fieldsOf(schema);

      // Actuar
      const nullableSinRegla = fields
        .filter((field) => field.schema instanceof z.ZodNullable)
        .filter((field) => !/\bnull\b/.test(field.schema.description ?? ''))
        .map((field) => field.path);
      const listasSinRegla = fields
        .filter((field) => field.schema instanceof z.ZodArray)
        .filter((field) => !(field.schema.description ?? '').includes('[]'))
        .map((field) => field.path);

      // Comprobar
      expect(nullableSinRegla).toEqual([]);
      expect(listasSinRegla).toEqual([]);
    },
  );

  it('el borrador acepta null explícito cuando el asesor no pidió condiciones ni ajuste', () => {
    // Preparar
    const salidaDelModelo = {
      items: [],
      notes: '',
      terms: null,
      adjustment: null,
      summary: 'No hay productos que correspondan a lo solicitado.',
    };

    // Actuar
    const result = quoteDraftSchema.safeParse(salidaDelModelo);

    // Comprobar
    expect(result.success).toBe(true);
  });

  it('el borrador rechaza que el modelo OMITA una clave anulable (debe responder null)', () => {
    // Preparar: sin "terms" ni "adjustment".
    const salidaIncompleta = {
      items: [],
      notes: '',
      summary: 'Resumen',
    };

    // Actuar
    const result = quoteDraftSchema.safeParse(salidaIncompleta);

    // Comprobar
    expect(result.success).toBe(false);
    const rutas = result.success
      ? []
      : result.error.issues.map((issue) => issue.path.join('.'));
    expect(rutas).toEqual(expect.arrayContaining(['terms', 'adjustment']));
  });

  it('el insight admite closeProbability null cuando no hay datos', () => {
    // Preparar
    const salidaDelModelo = {
      summary: 'Lead nuevo, sin conversación todavía.',
      nextBestAction: 'Hacer el primer contacto por WhatsApp.',
      closeProbability: null,
      risks: [],
      suggestedFollowUpDays: 0,
    };

    // Actuar
    const result = leadInsightSchema.safeParse(salidaDelModelo);

    // Comprobar
    expect(result.success).toBe(true);
  });

  it('el insight rechaza tipos incorrectos (probabilidad como texto)', () => {
    // Preparar
    const salidaInvalida = {
      summary: 'x',
      nextBestAction: 'y',
      closeProbability: '80%',
      risks: [],
      suggestedFollowUpDays: 2,
    };

    // Actuar
    const result = leadInsightSchema.safeParse(salidaInvalida);

    // Comprobar
    expect(result.success).toBe(false);
  });
});
