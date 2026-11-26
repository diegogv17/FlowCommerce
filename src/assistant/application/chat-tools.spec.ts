import type { ToolExecutionOptions } from 'ai';
import { AssistantChatTools, parseDueAtGuatemala } from './chat-tools';

const LEAD_ID = '6f1c2d3e-4a5b-4c6d-8e7f-90a1b2c3d4e5';
const actor = { actorUserId: 'user-1', projectId: 'project-1' };
const options = { toolCallId: 'call-1', messages: [] } as ToolExecutionOptions;

// Viernes 20/11/2026 10:00 en Guatemala (16:00 UTC).
const NOW = new Date('2026-11-20T16:00:00.000Z');

describe('parseDueAtGuatemala', () => {
  it('convierte fecha y hora de Guatemala (UTC-6) a UTC', () => {
    // Actuar
    const dueAt = parseDueAtGuatemala('2026-11-23', '14:30', NOW);

    // Comprobar
    expect(dueAt).toEqual(new Date('2026-11-23T20:30:00.000Z'));
  });

  it('usa las 09:00 cuando el modelo devuelve hora null', () => {
    // Actuar
    const dueAt = parseDueAtGuatemala('2026-11-23', null, NOW);

    // Comprobar
    expect(dueAt).toEqual(new Date('2026-11-23T15:00:00.000Z'));
  });

  it.each([
    ['fecha imposible', '2026-02-30', '10:00', 'Fecha inválida'],
    ['formato de fecha libre', '23/11/2026', '10:00', 'Fecha inválida'],
    ['hora fuera de rango', '2026-11-23', '25:00', 'Hora inválida'],
    ['fecha en el pasado', '2026-11-19', '10:00', 'ya pasó'],
  ])('rechaza %s', (_caso, fecha, hora, mensaje) => {
    // Actuar
    const result = parseDueAtGuatemala(fecha, hora, NOW);

    // Comprobar
    expect(result).not.toBeInstanceOf(Date);
    expect((result as { error: string }).error).toContain(mensaje);
  });
});

describe('AssistantChatTools', () => {
  const createFollowUp = { execute: jest.fn() };
  const build = () => {
    const noop = { execute: jest.fn() };
    const tools = new AssistantChatTools(
      noop as never,
      noop as never,
      noop as never,
      noop as never,
      noop as never,
      noop as never,
      noop as never,
      createFollowUp as never,
    );
    return tools.build(actor);
  };

  beforeEach(() => createFollowUp.execute.mockReset());

  it('solo la herramienta que escribe pide aprobación del usuario', () => {
    // Actuar
    const toolSet = build();

    // Comprobar
    const conAprobacion = Object.entries(toolSet)
      .filter(([, definition]) => definition.needsApproval === true)
      .map(([name]) => name);
    expect(conAprobacion).toEqual(['crear_seguimiento']);
  });

  it('crear_seguimiento no toca la base si el modelo inventa un id de lead', async () => {
    // Preparar
    const crear = build().crear_seguimiento;
    const input = {
      leadId: 'lead-de-ana',
      tipo: 'CALL',
      titulo: 'Llamar',
      fecha: '2099-01-10',
      hora: null,
      notas: null,
    };

    // Actuar
    const result: unknown = await crear.execute?.(input, options);

    // Comprobar
    expect((result as { error: string }).error).toContain('buscar_leads');
    expect(createFollowUp.execute).not.toHaveBeenCalled();
  });

  it('crear_seguimiento llama al caso de uso con el actor de la sesión, no con datos del modelo', async () => {
    // Preparar
    createFollowUp.execute.mockResolvedValue({
      id: 'fu-1',
      type: 'CALL',
      title: 'Llamar para confirmar',
      status: 'PENDING',
      dueAt: new Date('2099-01-10T15:00:00.000Z'),
      leadId: LEAD_ID,
      lead: { name: 'Ana López' },
    });
    const crear = build().crear_seguimiento;

    // Actuar
    const result = (await crear.execute?.(
      {
        leadId: LEAD_ID,
        tipo: 'CALL',
        titulo: '  Llamar para confirmar  ',
        fecha: '2099-01-10',
        hora: null,
        notas: '   ',
      },
      options,
    )) as { creado?: boolean };

    // Comprobar
    expect(result.creado).toBe(true);
    expect(createFollowUp.execute).toHaveBeenCalledWith({
      ...actor,
      leadId: LEAD_ID,
      type: 'CALL',
      title: 'Llamar para confirmar',
      notes: null,
      dueAt: new Date('2099-01-10T15:00:00.000Z'),
    });
  });
});
