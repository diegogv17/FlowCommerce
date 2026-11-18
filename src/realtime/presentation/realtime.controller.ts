import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@flowcommerce/types';
import type { Request, Response } from 'express';
import type { Subscription } from 'rxjs';
import { AuthenticatedGuard } from '../../auth/presentation/guards/authenticated.guard';
import { CurrentUserId } from '../../auth/presentation/decorators/current-user.decorator';
import { ProjectPermissionGuard } from '../../authorization/presentation/guards/project-permission.guard';
import { RequirePermission } from '../../authorization/presentation/decorators/require-permission.decorator';
import { RealtimeEvents } from '../application/realtime-events';
import type { PublishedRealtimeEvent } from '../domain/realtime-event';

// Cada 25 s se manda un comentario SSE (": ping"). Los proxies (Render,
// Nginx, Cloudflare) cortan conexiones HTTP inactivas a los 30–100 s; el
// latido las mantiene vivas y además permite detectar clientes caídos (la
// escritura falla y se dispara 'close').
export const REALTIME_HEARTBEAT_MS = 25_000;

// Formato de un evento en el protocolo Server-Sent Events:
//   id: 12
//   event: message.created
//   data: {"leadId":"…","messageId":"…","direction":"INBOUND"}
//   (línea en blanco)
export function formatSseEvent(event: PublishedRealtimeEvent): string {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(
    event.data,
  )}\n\n`;
}

// ¿Este usuario debe recibir el evento? Las notificaciones son personales:
// si el evento trae destinatarios, solo se reenvía a ellos. El resto de
// eventos los ve cualquier miembro con LEAD_READ del proyecto.
export function isVisibleTo(
  event: PublishedRealtimeEvent,
  userId: string | undefined,
): boolean {
  if (event.type === 'notification.created' && event.data.userIds) {
    return !!userId && event.data.userIds.includes(userId);
  }
  return true;
}

// Canal de eventos en vivo del proyecto (semana 9: "canal de eventos en
// vivo"). Se usa SSE y no WebSockets porque el flujo es de un solo sentido
// (servidor → navegador), viaja sobre HTTP normal y reutiliza los mismos
// guards de autenticación y permisos que el resto de la API.
//
// Se escribe directamente en la Response (en vez de @Sse()) para poder enviar
// latidos como comentarios SSE, que el navegador ignora, y controlar las
// cabeceras anti-buffering.
@ApiTags('realtime')
@Controller({ path: 'projects/:projectId/events', version: '1' })
@UseGuards(AuthenticatedGuard, ProjectPermissionGuard)
export class RealtimeController {
  constructor(private readonly realtime: RealtimeEvents) {}

  @Get()
  @RequirePermission(Permission.LEAD_READ)
  @ApiOperation({
    summary: 'Eventos en vivo del proyecto (Server-Sent Events)',
    description:
      'Conexión abierta text/event-stream. Eventos: message.created, message.status, notification.created, quote.status, lead.updated. Cada evento trae solo ids: el frontend refresca sus consultas. Latido ": ping" cada 25 s.',
  })
  @ApiProduces('text/event-stream')
  @ApiOkResponse({ description: 'Flujo de eventos SSE' })
  stream(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Req() request: Request,
    @Res() response: Response,
  ): void {
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    // Nginx (y algunos PaaS) almacenan la respuesta en búfer si no se les
    // pide lo contrario, y los eventos llegarían en bloque.
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    // retry: cuánto espera el navegador antes de reconectar (si usara
    // EventSource). El primer comentario confirma la conexión.
    response.write('retry: 5000\n: connected\n\n');

    let closed = false;
    // Se guardan en un objeto porque cleanup() puede correr antes de que
    // existan (si el bus ya estaba completado durante subscribe()).
    const handles: {
      subscription?: Subscription;
      heartbeat?: ReturnType<typeof setInterval>;
    } = {};
    // Limpieza única: al cerrar el navegador la pestaña, al cortar la red o
    // al apagar el servidor. Sin esto cada conexión dejaría un intervalo y
    // una suscripción vivos para siempre (fuga de memoria).
    const cleanup = (): void => {
      if (closed) {
        return;
      }
      closed = true;
      if (handles.heartbeat) {
        clearInterval(handles.heartbeat);
      }
      handles.subscription?.unsubscribe();
      if (!response.writableEnded) {
        response.end();
      }
    };

    const subscription = this.realtime.stream(projectId).subscribe({
      next: (event) => {
        if (isVisibleTo(event, userId)) {
          response.write(formatSseEvent(event));
        }
      },
      // El bus se completó (apagado de la app): se cierra la conexión.
      complete: () => cleanup(),
    });
    handles.subscription = subscription;
    if (response.writableEnded) {
      // El bus ya estaba completado y cleanup corrió durante subscribe().
      subscription.unsubscribe();
      return;
    }

    handles.heartbeat = setInterval(() => {
      response.write(': ping\n\n');
    }, REALTIME_HEARTBEAT_MS);

    request.on('close', cleanup);
  }
}
