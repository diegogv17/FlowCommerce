import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permission } from '@flowcommerce/types';
import { AuthenticatedGuard } from '../../../auth/presentation/guards/authenticated.guard';
import { CurrentUserId } from '../../../auth/presentation/decorators/current-user.decorator';
import { ProjectPermissionGuard } from '../../../authorization/presentation/guards/project-permission.guard';
import { RequirePermission } from '../../../authorization/presentation/decorators/require-permission.decorator';
import { ConfirmRecurrentePaymentUseCase } from '../../application/use-cases/confirm-recurrente-payment.use-case';
import { CreateRecurrenteCheckoutUseCase } from '../../application/use-cases/create-recurrente-checkout.use-case';
import { GetRecurrenteAvailabilityUseCase } from '../../application/use-cases/recurrente-availability.use-case';
import { GetRecurrenteCheckoutUseCase } from '../../application/use-cases/get-recurrente-checkout.use-case';
import {
  RecurrenteAvailabilityDto,
  RecurrenteCheckoutDto,
  RecurrenteCheckoutStateDto,
  RecurrenteVerificationDto,
} from '../dto/recurrente.dto';

@ApiTags('quotes')
@Controller({ path: 'projects/:projectId', version: '1' })
@UseGuards(AuthenticatedGuard, ProjectPermissionGuard)
@ApiUnauthorizedResponse({ description: 'Sin sesión activa' })
@ApiForbiddenResponse({
  description: 'Sin el permiso requerido en el proyecto (o proyecto ajeno)',
})
export class RecurrenteController {
  constructor(
    private readonly getAvailabilityUseCase: GetRecurrenteAvailabilityUseCase,
    private readonly getCheckoutUseCase: GetRecurrenteCheckoutUseCase,
    private readonly createCheckoutUseCase: CreateRecurrenteCheckoutUseCase,
    private readonly confirmPaymentUseCase: ConfirmRecurrentePaymentUseCase,
  ) {}

  @Get('recurrente-sandbox/availability')
  @RequirePermission(Permission.QUOTE_READ)
  @ApiOperation({
    summary: 'Indicar si Recurrente Sandbox está disponible',
    description:
      'Consulta GET /api/test de Recurrente y exige environment sandbox. Nunca devuelve la llave.',
  })
  @ApiOkResponse({ type: RecurrenteAvailabilityDto })
  async getAvailability(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<RecurrenteAvailabilityDto> {
    return RecurrenteAvailabilityDto.from(
      await this.getAvailabilityUseCase.execute({
        actorUserId: userId,
        projectId,
      }),
    );
  }

  @Get('quotes/:quoteId/recurrente/checkout')
  @RequirePermission(Permission.QUOTE_READ)
  @ApiOperation({
    summary: 'Consultar el checkout de Recurrente guardado de una cotización',
    description: 'Lee solo lo guardado en FlowCommerce; no llama a Recurrente.',
  })
  @ApiOkResponse({ type: RecurrenteCheckoutStateDto })
  @ApiNotFoundResponse({ description: 'No existe en este proyecto' })
  async getCheckout(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
  ): Promise<RecurrenteCheckoutStateDto> {
    return RecurrenteCheckoutStateDto.from(
      await this.getCheckoutUseCase.execute({
        actorUserId: userId,
        projectId,
        quoteId,
      }),
    );
  }

  @Post('quotes/:quoteId/recurrente/checkout')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.QUOTE_CREATE)
  @ApiOperation({
    summary: 'Crear o recuperar el checkout de Recurrente Sandbox',
    description:
      'Solo ACCEPTED y con QUOTE_APPROVE. Crea el checkout en GTQ con el total guardado. Si ya existe uno vigente, devuelve el mismo.',
  })
  @ApiOkResponse({ type: RecurrenteCheckoutDto })
  @ApiNotFoundResponse({ description: 'No existe en este proyecto' })
  @ApiConflictResponse({
    description:
      'La cotización no está en ACCEPTED o hay una solicitud en curso',
  })
  @ApiServiceUnavailableResponse({
    description:
      'Recurrente sin configurar, llave inválida o llave de producción',
  })
  @ApiBadGatewayResponse({ description: 'Recurrente no respondió' })
  async createCheckout(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
  ): Promise<RecurrenteCheckoutDto> {
    return RecurrenteCheckoutDto.from(
      await this.createCheckoutUseCase.execute({
        actorUserId: userId,
        projectId,
        quoteId,
      }),
    );
  }

  @Post('quotes/:quoteId/recurrente/verify')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.QUOTE_CREATE)
  @ApiOperation({
    summary: 'Verificar con Recurrente el pago de una cotización',
    description:
      'Consulta GET /api/checkouts/{id}. Solo con status paid, y monto, moneda y checkout coincidentes, la cotización pasa de ACCEPTED a PAID. Repetirla no duplica el pago.',
  })
  @ApiOkResponse({ type: RecurrenteVerificationDto })
  @ApiNotFoundResponse({ description: 'Sin cotización o sin checkout' })
  @ApiConflictResponse({
    description: 'Estado no válido o datos del pago que no coinciden',
  })
  @ApiServiceUnavailableResponse({ description: 'Recurrente sin configurar' })
  @ApiBadGatewayResponse({ description: 'Recurrente no respondió' })
  async verifyPayment(
    @CurrentUserId() userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
  ): Promise<RecurrenteVerificationDto> {
    return RecurrenteVerificationDto.from(
      await this.confirmPaymentUseCase.execute({
        actorUserId: userId,
        projectId,
        quoteId,
      }),
    );
  }
}
