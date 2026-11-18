import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Límite de las rutas de IA POR USUARIO (cada llamada cuesta dinero en el
// proveedor). El ThrottlerGuard estándar cuenta por IP; aquí se usa el userId
// que fija AuthenticatedGuard, para que una oficina detrás de la misma IP no
// comparta el cupo. Sin usuario (no debería pasar) se cae a la IP.
// Debe ir DESPUÉS de AuthenticatedGuard en @UseGuards.
@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    const userId = typeof req.userId === 'string' ? req.userId : null;
    const ip = typeof req.ip === 'string' ? req.ip : 'unknown';
    return Promise.resolve(userId ? `user:${userId}` : `ip:${ip}`);
  }
}
