import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { RealtimeEvents } from '../../realtime/application/realtime-events';
import type { NotifyInput } from '../domain/notification';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepository,
} from '../domain/notifications.repository';

// Punto único para generar notificaciones desde otros módulos (cotizaciones,
// leads, mensajes, solicitudes de acceso, recordatorios).
//
// Una notificación es un efecto SECUNDARIO: si falla, se registra en el log y
// la operación principal (aprobar, recibir un mensaje…) sigue su curso. Por eso
// notify() nunca lanza.
@Injectable()
export class NotificationPublisher {
  private readonly logger = new Logger(NotificationPublisher.name);

  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepository,
    // Canal en vivo (SSE): la campana se actualiza sin esperar al polling.
    @Optional()
    private readonly realtime?: RealtimeEvents,
  ) {}

  async notify(input: NotifyInput): Promise<number> {
    try {
      const recipients = await this.resolveRecipients(input);
      if (recipients.length === 0) {
        return 0;
      }
      const created = await this.repository.createMany(
        recipients.map((userId) => ({
          projectId: input.projectId,
          userId,
          type: input.type,
          title: input.title.slice(0, 255),
          body: input.body ?? null,
          entityType: input.entity?.type ?? null,
          entityId: input.entity?.id ?? null,
          dedupeKey: input.dedupeKey ?? null,
        })),
      );
      // Solo si se insertó alguna (las repetidas por dedupeKey se ignoran).
      // createMany devuelve cuántas, no sus ids: notificationId va null y el
      // frontend simplemente refresca la lista. userIds limita a quién le
      // llega el evento (ver RealtimeController).
      if (created > 0) {
        this.realtime?.publish(input.projectId, {
          type: 'notification.created',
          data: { notificationId: null, userIds: recipients },
        });
      }
      return created;
    } catch (error) {
      this.logger.error(
        `Could not create ${input.type} notifications: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 0;
    }
  }

  // Destinatarios = usuarios indicados (si siguen siendo miembros) + miembros
  // con los roles indicados, sin repetir y sin quien provocó el evento.
  private async resolveRecipients(input: NotifyInput): Promise<string[]> {
    const direct = [
      ...new Set(
        (input.recipients.userIds ?? []).filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        ),
      ),
    ];
    const [members, byRole] = await Promise.all([
      direct.length > 0
        ? this.repository.filterMembers(input.projectId, direct)
        : Promise.resolve([]),
      input.recipients.roles && input.recipients.roles.length > 0
        ? this.repository.findMemberIdsByRoles(
            input.projectId,
            input.recipients.roles,
          )
        : Promise.resolve([]),
    ]);
    return [...new Set([...members, ...byRole])].filter(
      (id) => id !== input.excludeUserId,
    );
  }
}
