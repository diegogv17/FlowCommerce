import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuoteStatus } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/domain.exceptions';
import type { QuoteEntity } from '../../domain/entities/quote.entity';
import { permissionForTarget } from '../../domain/quote-transitions';
import {
  RECURRENTE_CHECKOUT_REPOSITORY,
  buildRecurrentePaymentReference,
  evaluateRemoteCheckout,
  type RecurrenteCheckoutRecord,
  type RecurrenteCheckoutRepository,
  type RecurrenteVerificationOutcome,
} from '../../domain/recurrente-checkout';
import {
  QUOTES_REPOSITORY,
  type QuoteRepository,
} from '../../domain/repositories/quote.repository';
import {
  RECURRENTE_GATEWAY,
  type RecurrenteGateway,
} from '../ports/recurrente.gateway';
import { QuoteLifecycleEvents } from '../quote-lifecycle.events';

export interface ConfirmRecurrentePaymentResult {
  outcome: Exclude<RecurrenteVerificationOutcome, 'MISMATCH'>;
  transitioned: boolean;
  checkout: RecurrenteCheckoutRecord;
  quote: QuoteEntity;
}

@Injectable()
export class ConfirmRecurrentePaymentUseCase {
  private readonly logger = new Logger(ConfirmRecurrentePaymentUseCase.name);

  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(QUOTES_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    @Inject(RECURRENTE_CHECKOUT_REPOSITORY)
    private readonly checkouts: RecurrenteCheckoutRepository,
    @Inject(RECURRENTE_GATEWAY)
    private readonly gateway: RecurrenteGateway,
    private readonly lifecycle: QuoteLifecycleEvents,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
    quoteId: string;
  }): Promise<ConfirmRecurrentePaymentResult> {
    await this.authorizationService.assertCan(
      input.actorUserId,
      permissionForTarget(QuoteStatus.PAID),
      input.projectId,
    );

    const quote = await this.quoteRepository.findByIdInProject(
      input.quoteId,
      input.projectId,
    );
    if (!quote) {
      throw new NotFoundException('Quote not found in this project');
    }
    const checkout = await this.checkouts.findLatestByQuote(
      quote.id,
      input.projectId,
    );
    if (!checkout) {
      throw new NotFoundException(
        'Esta cotización no tiene un checkout de Recurrente',
      );
    }

    const remote = await this.gateway.getCheckout(checkout.checkoutId);
    const verification = evaluateRemoteCheckout(checkout, remote);

    if (verification.outcome === 'MISMATCH') {
      this.logger.warn(
        `Recurrente verification mismatch for quote ${quote.id}: ${verification.detail}`,
      );
      throw new ConflictException(
        verification.detail ?? 'La verificación del pago no coincide',
      );
    }

    if (verification.outcome === 'EXPIRED') {
      await this.checkouts.markExpired(checkout.id, input.projectId);
      return {
        outcome: 'EXPIRED',
        transitioned: false,
        checkout: { ...checkout, status: 'EXPIRED' },
        quote,
      };
    }

    if (verification.outcome !== 'PAID') {
      return {
        outcome: verification.outcome,
        transitioned: false,
        checkout,
        quote,
      };
    }

    return this.registerPayment(input, quote, checkout);
  }

  private async registerPayment(
    input: { actorUserId: string; projectId: string; quoteId: string },
    quote: QuoteEntity,
    checkout: RecurrenteCheckoutRecord,
  ): Promise<ConfirmRecurrentePaymentResult> {
    if (quote.status === QuoteStatus.PAID) {
      return this.alreadyPaid(input.projectId, quote, checkout);
    }
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new ConflictException(
        `Only ACCEPTED quotes can be paid (current status: ${quote.status})`,
      );
    }

    const paidAt = new Date();
    const updated = await this.quoteRepository.transitionStatusInProject(
      quote.id,
      input.projectId,
      {
        from: QuoteStatus.ACCEPTED,
        to: QuoteStatus.PAID,
        at: paidAt,
        paymentReference: buildRecurrentePaymentReference(checkout.checkoutId),
      },
    );

    if (!updated) {
      const reloaded = await this.quoteRepository.findByIdInProject(
        quote.id,
        input.projectId,
      );
      if (reloaded?.status === QuoteStatus.PAID) {
        return this.alreadyPaid(input.projectId, reloaded, checkout);
      }
      throw new ConflictException('Quote status changed; reload and retry');
    }

    await this.lifecycle.transitioned(
      updated,
      QuoteStatus.ACCEPTED,
      input.actorUserId,
    );
    await this.checkouts.markPaid(checkout.id, input.projectId, paidAt);
    return {
      outcome: 'PAID',
      transitioned: true,
      checkout: { ...checkout, status: 'PAID', paidAt },
      quote: updated,
    };
  }

  private async alreadyPaid(
    projectId: string,
    quote: QuoteEntity,
    checkout: RecurrenteCheckoutRecord,
  ): Promise<ConfirmRecurrentePaymentResult> {
    const paidAt = quote.paidAt ?? new Date();
    if (checkout.status !== 'PAID') {
      await this.checkouts.markPaid(checkout.id, projectId, paidAt);
    }
    return {
      outcome: 'PAID',
      transitioned: false,
      checkout: {
        ...checkout,
        status: 'PAID',
        paidAt: checkout.paidAt ?? paidAt,
      },
      quote,
    };
  }
}
