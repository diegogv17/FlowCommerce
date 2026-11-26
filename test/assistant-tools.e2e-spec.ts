import type { ToolExecutionOptions, ToolSet } from 'ai';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AssistantChatTools } from '../src/assistant/application/chat-tools';
import { followUps, leads, products } from '../src/db/schema';
import {
  createE2eApp,
  type E2eContext,
  type SeededTenants,
} from './support/e2e-app';

// Integración REAL de las herramientas del asistente contra PostgreSQL: sin
// mocks de repositorios ni de Drizzle. Se invocan tal como las invoca el
// modelo (execute con la entrada que generaría Gemini), así se prueba que las
// consultas de contexto filtran por proyecto y que la herramienta de escritura
// guarda el registro con las reglas del caso de uso.
describe('Asistente · herramientas contra PostgreSQL (integración)', () => {
  let ctx: E2eContext;
  let seed: SeededTenants;
  const leadA = randomUUID();
  const leadB = randomUUID();
  const options = {
    toolCallId: 'call-e2e',
    messages: [],
  } as ToolExecutionOptions;

  const toolsFor = (projectKey: string, role: 'MEMBER' | 'VIEWER'): ToolSet =>
    ctx.app.get(AssistantChatTools).build({
      projectId: seed.project(projectKey),
      actorUserId: seed.user(projectKey, role),
    });

  const run = async <T>(
    tools: ToolSet,
    name: string,
    input: Record<string, unknown>,
  ): Promise<T> => (await tools[name].execute?.(input, options)) as T;

  beforeAll(async () => {
    ctx = await createE2eApp();
    seed = await ctx.seedTenants([
      { key: 'a', members: { MEMBER: 1, VIEWER: 1 } },
      { key: 'b', members: { MEMBER: 1 } },
    ]);
    await ctx.db.insert(leads).values([
      {
        id: leadA,
        projectId: seed.project('a'),
        name: 'Ana Morales Asistente',
      },
      { id: leadB, projectId: seed.project('b'), name: 'Bruno Otro Tenant' },
    ]);
    await ctx.db.insert(products).values([
      {
        projectId: seed.project('a'),
        name: 'Licencia CRM Pro',
        price: 450,
        maxDiscountPercent: 10,
        active: true,
      },
      {
        projectId: seed.project('a'),
        name: 'Plan descontinuado',
        price: 100,
        active: false,
      },
    ]);
  });

  afterAll(async () => {
    await seed?.cleanup();
    await ctx?.close();
  });

  it('buscar_leads lee leads reales del proyecto y nunca los de otro tenant', async () => {
    // Actuar
    const result = await run<{ total: number; leads: { id: string }[] }>(
      toolsFor('a', 'MEMBER'),
      'buscar_leads',
      {},
    );

    // Comprobar
    const ids = result.leads.map((lead) => lead.id);
    expect(ids).toContain(leadA);
    expect(ids).not.toContain(leadB);
  });

  it('catalogo_productos devuelve solo productos ACTIVOS con precio de la base', async () => {
    // Actuar
    const result = await run<{
      productos: {
        nombre: string;
        precioQ: number;
        descuentoMaximoPct: number;
      }[];
    }>(toolsFor('a', 'MEMBER'), 'catalogo_productos', {});

    // Comprobar
    expect(result.productos).toEqual([
      expect.objectContaining({
        nombre: 'Licencia CRM Pro',
        precioQ: 450,
        descuentoMaximoPct: 10,
      }),
    ]);
  });

  it('crear_seguimiento (aprobado) escribe el seguimiento en la base con hora de Guatemala', async () => {
    // Preparar
    const input = {
      leadId: leadA,
      tipo: 'CALL',
      titulo: 'Llamar para confirmar licencias',
      fecha: '2099-03-15',
      hora: '10:30',
      notas: 'Pidió precio por volumen',
    };

    // Actuar
    const result = await run<{ creado?: boolean }>(
      toolsFor('a', 'MEMBER'),
      'crear_seguimiento',
      input,
    );

    // Comprobar
    expect(result.creado).toBe(true);
    const rows = await ctx.db
      .select()
      .from(followUps)
      .where(eq(followUps.leadId, leadA));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      projectId: seed.project('a'),
      type: 'CALL',
      title: 'Llamar para confirmar licencias',
      notes: 'Pidió precio por volumen',
      status: 'PENDING',
      assignedUserId: seed.user('a', 'MEMBER'),
      dueAt: new Date('2099-03-15T16:30:00.000Z'),
    });
  });

  it('crear_seguimiento respeta los permisos: un VIEWER no puede escribir', async () => {
    // Actuar
    const result = await run<{ error?: string }>(
      toolsFor('a', 'VIEWER'),
      'crear_seguimiento',
      {
        leadId: leadA,
        tipo: 'TASK',
        titulo: 'No debe guardarse',
        fecha: '2099-03-16',
        hora: null,
        notas: null,
      },
    );

    // Comprobar
    expect(result.error).toContain('permiso');
    const rows = await ctx.db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.leadId, leadA),
          eq(followUps.title, 'No debe guardarse'),
        ),
      );
    expect(rows).toHaveLength(0);
  });

  it('crear_seguimiento no escribe sobre un lead de otro proyecto', async () => {
    // Actuar: el id existe, pero pertenece al tenant "b".
    const result = await run<{ error?: string }>(
      toolsFor('a', 'MEMBER'),
      'crear_seguimiento',
      {
        leadId: leadB,
        tipo: 'CALL',
        titulo: 'Cruce de tenant',
        fecha: '2099-03-16',
        hora: null,
        notas: null,
      },
    );

    // Comprobar
    expect(result.error).toContain('No se encontró');
    const rows = await ctx.db
      .select()
      .from(followUps)
      .where(eq(followUps.leadId, leadB));
    expect(rows).toHaveLength(0);
  });
});
