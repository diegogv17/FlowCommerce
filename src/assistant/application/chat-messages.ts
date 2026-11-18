import type { UIMessage } from 'ai';
import { BadRequestException } from '../../common/exceptions/domain.exceptions';

export const MAX_CHAT_MESSAGES = 40;
const MAX_TEXT_PART_CHARS = 4000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Partes que el asistente entiende: texto, pasos y llamadas a herramientas que
// el propio servidor generó en turnos anteriores. Archivos, razonamiento u
// otras partes se descartan (el chat no admite adjuntos).
// Las llamadas a herramientas solo se conservan si quedaron COMPLETAS: si el
// usuario detuvo la respuesta a mitad de una, la llamada sin resultado haría
// fallar al modelo en el siguiente turno.
const isAllowedPart = (part: Record<string, unknown>): boolean => {
  const type = part.type;
  if (typeof type !== 'string') return false;
  if (type === 'text' || type === 'step-start') return true;
  return (
    type.startsWith('tool-') &&
    (part.state === 'output-available' || part.state === 'output-error')
  );
};

// Valida A MANO el body de useChat ({ id, messages, trigger, messageId… }).
// No se usa un DTO de class-validator porque el ValidationPipe global tiene
// forbidNonWhitelisted y rechazaría los campos que agrega el SDK; además la
// forma de UIMessage la define el SDK, no esta API.
//   - "messages" debe ser un arreglo de mensajes user/assistant con "parts".
//   - Los mensajes "system" del cliente se descartan: el único prompt de
//     sistema es el del servidor (evita que alguien lo reemplace).
//   - Se conservan los últimos 40 mensajes para acotar el costo del modelo.
export function parseChatMessages(body: unknown): UIMessage[] {
  const rawMessages: unknown = isRecord(body) ? body.messages : undefined;
  if (!Array.isArray(rawMessages)) {
    throw new BadRequestException(
      'El cuerpo debe incluir "messages" (arreglo de mensajes del chat)',
    );
  }

  const messages: UIMessage[] = [];
  for (const [index, raw] of (rawMessages as unknown[]).entries()) {
    const rawParts: unknown = isRecord(raw) ? raw.parts : undefined;
    if (!isRecord(raw) || !Array.isArray(rawParts)) {
      throw new BadRequestException(
        `El mensaje ${index + 1} no tiene el formato esperado`,
      );
    }
    if (raw.role === 'system') {
      continue;
    }
    if (raw.role !== 'user' && raw.role !== 'assistant') {
      throw new BadRequestException(
        `El mensaje ${index + 1} tiene un rol inválido`,
      );
    }
    const parts = (rawParts as unknown[])
      .filter(isRecord)
      .filter(isAllowedPart)
      .map((part) => {
        const text = part.text;
        return part.type === 'text' && typeof text === 'string'
          ? { ...part, text: text.slice(0, MAX_TEXT_PART_CHARS) }
          : part;
      });
    if (parts.length === 0) {
      continue;
    }
    const role: 'user' | 'assistant' =
      raw.role === 'user' ? 'user' : 'assistant';
    const id = raw.id;
    messages.push({
      id: typeof id === 'string' ? id : `msg-${index}`,
      role,
      parts,
    } as unknown as UIMessage);
  }

  const recent = messages.slice(-MAX_CHAT_MESSAGES);
  // Gemini exige que la conversación empiece por el usuario.
  while (recent.length > 0 && recent[0].role !== 'user') {
    recent.shift();
  }
  if (recent.length === 0 || recent[recent.length - 1].role !== 'user') {
    throw new BadRequestException(
      'La conversación debe terminar con un mensaje del usuario',
    );
  }
  return recent;
}
