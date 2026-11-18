import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, filter, type Observable } from 'rxjs';
import { RealtimeEvents } from '../application/realtime-events';
import type {
  PublishedRealtimeEvent,
  RealtimeEvent,
} from '../domain/realtime-event';

// Implementación en memoria con un Subject de RxJS: un único bus por proceso
// y cada conexión filtra los eventos de su proyecto.
//
// LIMITACIÓN CONOCIDA: solo funciona con UNA instancia del backend. Si se
// escala horizontalmente (varias réplicas detrás de un balanceador), un
// mensaje recibido por la réplica A no llegaría a los navegadores conectados a
// la réplica B. En ese caso hay que cambiar esta clase por otra que publique
// en un bus compartido —Redis Pub/Sub o Postgres LISTEN/NOTIFY (ya usamos
// Postgres)— sin tocar a quienes publican, porque dependen del puerto
// RealtimeEvents y no de esta implementación.
@Injectable()
export class InMemoryRealtimeEvents
  extends RealtimeEvents
  implements OnModuleDestroy
{
  private readonly logger = new Logger(InMemoryRealtimeEvents.name);
  private readonly bus = new Subject<PublishedRealtimeEvent>();
  private sequence = 0;

  publish(projectId: string, event: RealtimeEvent): void {
    try {
      this.sequence += 1;
      this.bus.next({
        ...event,
        id: this.sequence,
        projectId,
        at: new Date().toISOString(),
      });
    } catch (error) {
      // Un suscriptor que falla no debe tumbar el envío de un mensaje ni el
      // webhook de WhatsApp.
      this.logger.error(
        `Could not publish realtime event ${event.type}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  stream(projectId: string): Observable<PublishedRealtimeEvent> {
    // Filtro por tenant: una conexión del proyecto A nunca ve eventos de B.
    return this.bus
      .asObservable()
      .pipe(filter((event) => event.projectId === projectId));
  }

  // Al apagar la app se completan los flujos para que las conexiones SSE
  // abiertas se cierren limpiamente.
  onModuleDestroy(): void {
    this.bus.complete();
  }
}
