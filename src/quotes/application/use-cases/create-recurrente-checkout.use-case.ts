import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuoteStatus } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import { toHundredths } from '../../domain/quote-calculator';
import { permissionForTarget } from '../../domain/quote-transitions';
import {
  RECURRENTE_CHECKOUT_REPOSITORY,
  RECURRENTE_CURRENCY,
  RECURRENTE_MINIMUM_AMOUNT_IN_CENTS,
  buildRecurrenteIdempotencyKey,
  describeUnavailability,
  isActiveCheckout,
  type RecurrenteCheckoutRecord,
  type RecurrenteCheckoutRepository,
} from '../../domain/recurrente-checkout';
import {
  QUOTES_REPOSITORY,
  type QuoteRepository,
} from '../../domain/repositories/quote.repository';
import {
  RECURRENTE_GATEWAY,
  type RecurrenteGateway,
} from '../ports/recurrente.gateway';

const DEFAULT_APP_URL = 'http://localhost:5173';

@Injectable()
export class CreateRecurrenteCheckoutUseCase {
  constructor(
    private readonly configService: ConfigService,
    private readonly authorizationService: AuthorizationService,
    @Inject(QUOTES_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    @Inject(RECURRENTE_CHECKOUT_REPOSITORY)
    private readonly checkouts: RecurrenteCheckoutRepository,
    @Inject(RECURRENTE_GATEWAY)
    private readonly gateway: RecurrenteGateway,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
    quoteId: string;
  }): Promise<RecurrenteCheckoutRecord> {
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
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new ConflictException(
        `Only ACCEPTED quotes can be paid (current status: ${quote.status})`,
      );
    }

    const latest = await this.checkouts.findLatestByQuote(
      quote.id,
      input.projectId,
    );
    if (latest && isActiveCheckout(latest)) {
      return latest;
    }

    const amountInCents = Number(toHundredths(quote.total));
    if (amountInCents < RECURRENTE_MINIMUM_AMOUNT_IN_CENTS) {
      throw new BadRequestException(
        'El total de la cotización es menor al mínimo de Recurrente (Q5.00)',
      );
    }

    const availability = await this.gateway.checkAvailability();
    if (!availability.available) {
      throw new ServiceUnavailableException(
        describeUnavailability(availability.reason) ??
          'Recurrente no está disponible',
      );
    }

    const attempt = (latest?.attempt ?? 0) + 1;
    const appUrl = (
      this.configService.get<string>('APP_URL') ?? DEFAULT_APP_URL
    ).replace(/\/$/, '');
    const returnUrl = `${appUrl}/cotizaciones/${quote.id}`;

    const remote = await this.gateway.createCheckout({
      name: `Cotización ${quote.folio}`,
      amountInCents,
      currency: RECURRENTE_CURRENCY,
      idempotencyKey: buildRecurrenteIdempotencyKey(quote.id, attempt),
      successUrl: returnUrl,
      cancelUrl: returnUrl,
    });

    const created = await this.checkouts.createIfNoActive({
      projectId: input.projectId,
      quoteId: quote.id,
      attempt,
      checkoutId: remote.id,
      checkoutUrl: remote.checkoutUrl,
      amountInCents,
      currency: RECURRENTE_CURRENCY,
    });
    if (created) {
      return created;
    }

    const concurrent = await this.checkouts.findLatestByQuote(
      quote.id,
      input.projectId,
    );
    if (!concurrent || !isActiveCheckout(concurrent)) {
      throw new ConflictException(
        'No se pudo registrar el checkout; intente de nuevo',
      );
    }
    return concurrent;
  }
}
