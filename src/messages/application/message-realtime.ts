import type { RealtimeEvents } from '../../realtime/application/realtime-events';
import type { MessageEntity } from '../domain/entities/message.entity';

// Aviso en vivo de un mensaje SALIENTE recién guardado (texto, archivo o
// plantilla): otros usuarios con el mismo chat o la bandeja abiertos lo ven
// aparecer sin recargar, y la ficha del lead refresca su "último contacto".
// `realtime` es opcional: sin RealtimeModule no se publica nada.
export function publishOutboundMessage(
  realtime: RealtimeEvents | undefined,
  message: MessageEntity,
): void {
  if (!realtime) {
    return;
  }
  realtime.publish(message.projectId, {
    type: 'message.created',
    data: {
      leadId: message.leadId,
      messageId: message.id,
      direction: message.direction,
    },
  });
  realtime.publish(message.projectId, {
    type: 'lead.updated',
    data: { leadId: message.leadId },
  });
}
