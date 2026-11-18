import type { Observable } from 'rxjs';
import type {
  PublishedRealtimeEvent,
  RealtimeEvent,
} from '../domain/realtime-event';

// Puerto del canal de eventos en vivo. Es una clase abstracta (y no una
// interface) para poder usarla directamente como token de inyección:
//   constructor(@Optional() private readonly realtime?: RealtimeEvents)
//
// Los casos de uso la reciben con @Optional(): si RealtimeModule no está
// cargado (tests unitarios, scripts) simplemente no se publica nada.
export abstract class RealtimeEvents {
  // Publica un evento a todos los suscriptores del proyecto. Es un efecto
  // SECUNDARIO como las notificaciones: nunca lanza ni bloquea la operación
  // principal.
  abstract publish(projectId: string, event: RealtimeEvent): void;

  // Flujo de eventos de UN proyecto. Cada suscripción es una conexión SSE;
  // hay que cancelarla (unsubscribe) cuando el navegador se desconecta.
  abstract stream(projectId: string): Observable<PublishedRealtimeEvent>;
}
