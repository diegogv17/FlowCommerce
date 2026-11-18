import type { MessageDirection, QuoteStatus } from '@flowcommerce/types';

// Eventos que el backend empuja al navegador por el canal en vivo (SSE).
// Son AVISOS, no datos: llevan solo ids y el estado mínimo para que el
// frontend sepa qué consultas refrescar. Así el canal nunca expone más de lo
// que la API REST ya entrega con sus propios permisos, y si un evento se
// pierde (reconexión) basta con volver a pedir los datos.
export interface RealtimeEventMap {
  'message.created': {
    leadId: string;
    messageId: string;
    direction: MessageDirection;
  };
  'message.status': {
    leadId: string;
    messageId: string;
    status: string;
  };
  // createMany de notificaciones devuelve solo cuántas se insertaron, no sus
  // ids, así que notificationId puede llegar null. userIds = destinatarios:
  // el controlador solo reenvía el evento a esos usuarios.
  'notification.created': {
    notificationId: string | null;
    userIds?: string[];
  };
  'quote.status': {
    quoteId: string;
    status: QuoteStatus;
    leadId?: string | null;
  };
  'lead.updated': {
    leadId: string;
  };
}

export type RealtimeEventType = keyof RealtimeEventMap;

// Unión discriminada por `type`: { type: 'message.created', data: {...} } | …
export type RealtimeEvent = {
  [K in RealtimeEventType]: { type: K; data: RealtimeEventMap[K] };
}[RealtimeEventType];

// Evento ya publicado: se le añade el proyecto (para filtrar por tenant) y un
// id incremental que viaja como `id:` del SSE.
export type PublishedRealtimeEvent = RealtimeEvent & {
  id: number;
  projectId: string;
  at: string;
};
