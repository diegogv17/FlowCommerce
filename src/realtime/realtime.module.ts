import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RealtimeEvents } from './application/realtime-events';
import { InMemoryRealtimeEvents } from './infrastructure/in-memory-realtime-events';
import { RealtimeController } from './presentation/realtime.controller';

// Canal de eventos en vivo. Es @Global para que mensajes, notificaciones y
// cotizaciones puedan publicar sin importar este módulo (y sin crear ciclos
// entre módulos). Quienes publican lo inyectan con @Optional(): si el módulo
// no está cargado, la app y los tests siguen funcionando sin tiempo real.
@Global()
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [RealtimeController],
  providers: [{ provide: RealtimeEvents, useClass: InMemoryRealtimeEvents }],
  exports: [RealtimeEvents],
})
export class RealtimeModule {}
