import type { LeadEntity } from '../../leads/domain/entities/lead.entity';
import type { MessageEntity } from '../../messages/domain/entities/message.entity';
import {
  leadForPrompt,
  messagesForPrompt,
  todayInGuatemala,
} from './assistant-context';

const message = (
  overrides: Partial<MessageEntity> & Pick<MessageEntity, 'content'>,
): MessageEntity =>
  ({
    direction: 'INBOUND',
    type: 'TEXT',
    creadoEn: new Date('2026-11-20T15:00:00.000Z'),
    ...overrides,
  }) as MessageEntity;

describe('formateo de contexto para el prompt', () => {
  it('todayInGuatemala usa la zona de Guatemala y no la UTC del servidor', () => {
    // Preparar: 21/11 a las 03:00 UTC sigue siendo 20/11 en Guatemala.
    const now = new Date('2026-11-21T03:00:00.000Z');

    // Actuar
    const today = todayInGuatemala(now);

    // Comprobar
    expect(today).toBe('2026-11-20');
  });

  it('messagesForPrompt marca quién habla, colapsa espacios y recorta mensajes largos', () => {
    // Preparar
    const messages = [
      message({ content: 'Hola,\n\n  ¿tienen   stock?' }),
      message({ direction: 'OUTBOUND', content: 'x'.repeat(800) }),
      message({ type: 'IMAGE', content: 'foto.jpg' } as never),
    ];

    // Actuar
    const lines = messagesForPrompt(messages, 10).split('\n');

    // Comprobar
    expect(lines[0]).toBe(
      '[2026-11-20T15:00:00.000Z] Cliente: Hola, ¿tienen stock?',
    );
    expect(lines[1].startsWith('[2026-11-20T15:00:00.000Z] Asesor: xxx')).toBe(
      true,
    );
    expect(lines[1].endsWith('…')).toBe(true);
    expect(lines[2]).toContain('Cliente: [image] foto.jpg');
  });

  it('messagesForPrompt indica explícitamente cuando no hay conversación', () => {
    // Actuar y comprobar: el modelo no debe suponer que hubo mensajes.
    expect(messagesForPrompt([], 20)).toBe('(sin mensajes de WhatsApp)');
  });

  it('leadForPrompt no envía correo ni teléfono del lead al proveedor externo', () => {
    // Preparar
    const lead = {
      id: 'lead-1',
      name: 'Ana López',
      email: 'ana@example.com',
      phone: '+50255555555',
      company: 'Distribuidora Ana',
      stage: 'QUALIFIED',
      notes: 'n'.repeat(2000),
      lastContactAt: null,
      nextFollowUpAt: null,
      creadoEn: new Date('2026-11-01T00:00:00.000Z'),
    } as unknown as LeadEntity;

    // Actuar
    const prompt = JSON.stringify(leadForPrompt(lead));

    // Comprobar
    expect(prompt).not.toContain('ana@example.com');
    expect(prompt).not.toContain('+50255555555');
    expect(leadForPrompt(lead).notas).toHaveLength(1501);
  });
});
