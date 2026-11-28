import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuoteStatus } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import { isPaymentSimulationEnabled } from '../../../common/config/payment-simulation';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../common/exceptions/domain.exceptions';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { permissionForTarget } from '../../domain/quote-transitions';
import {
  QUOTES_REPOSITORY,
  type QuoteRepository,
} from '../../domain/repositories/quote.repository';
import {
  allowsInstallments,
  buildSimulatedPaymentReference,
  type SimulatedCardBrand,
  type SimulatedInstallments,
} from '../../domain/simulated-payment';
import { QuoteLifecycleEvents } from '../quote-lifecycle.events';

export interface SimulateQuotePaymentInput {
  actorUserId: string;
  projectId: string;
  quoteId: string;
  brand: SimulatedCardBrand;
  lastFourDigits: string;
  installments: SimulatedInstallments;
}

@Injectable()
export class SimulateQuotePaymentUseCase {
  constructor(
    private readonly configService: ConfigService,
    private readonly authorizationService: AuthorizationService,
    @Inject(QUOTES_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    private readonly lifecycle: QuoteLifecycleEvents,
  ) {}

  async execute(input: SimulateQuotePaymentInput): Promise<QuoteEntity> {
    const enabled = isPaymentSimulationEnabled({
      PAYMENT_SIMULATION_ENABLED: this.configService.get<string>(
        'PAYMENT_SIMULATION_ENABLED',
      ),
      NODE_ENV: this.configService.get<string>('NODE_ENV'),
    });
    if (!enabled) {
      throw new ForbiddenException('Payment simulation is disabled');
    }

    await this.authorizationService.assertCan(
      input.actorUserId,
      permissionForTarget(QuoteStatus.PAID),
      input.projectId,
    );

    if (!allowsInstallments(input.brand, input.installments)) {
      throw new BadRequestException(
        'Installments are only available with Visa cards',
      );
    }

    const quote = await this.quoteRepository.findByIdInProject(
      input.quoteId,
      input.projectId,
    );
    if (!quote) {
      throw new NotFoundException('Quote not found in this project');
    }
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new ConflictException(
        `Only ACCEPTED quotes can be paid (current status: ${quote.status})`,
      );
    }

    const updated = await this.quoteRepository.transitionStatusInProject(
      input.quoteId,
      input.projectId,
      {
        from: QuoteStatus.ACCEPTED,
        to: QuoteStatus.PAID,
        at: new Date(),
        paymentReference: buildSimulatedPaymentReference(
          input.brand,
          input.lastFourDigits,
          input.installments,
        ),
      },
    );
    if (!updated) {
      throw new ConflictException(
        'Quote status changed concurrently; reload and retry',
      );
    }

    await this.lifecycle.transitioned(
      updated,
      QuoteStatus.ACCEPTED,
      input.actorUserId,
    );
    return updated;
  }
}
