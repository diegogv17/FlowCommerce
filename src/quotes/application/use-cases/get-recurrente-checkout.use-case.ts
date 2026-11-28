import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import { NotFoundException } from '../../../common/exceptions/domain.exceptions';
import {
  RECURRENTE_CHECKOUT_REPOSITORY,
  type RecurrenteCheckoutRecord,
  type RecurrenteCheckoutRepository,
} from '../../domain/recurrente-checkout';
import {
  QUOTES_REPOSITORY,
  type QuoteRepository,
} from '../../domain/repositories/quote.repository';

@Injectable()
export class GetRecurrenteCheckoutUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(QUOTES_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    @Inject(RECURRENTE_CHECKOUT_REPOSITORY)
    private readonly checkouts: RecurrenteCheckoutRepository,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
    quoteId: string;
  }): Promise<RecurrenteCheckoutRecord | null> {
    await this.authorizationService.assertCan(
      input.actorUserId,
      Permission.QUOTE_READ,
      input.projectId,
    );
    const quote = await this.quoteRepository.findByIdInProject(
      input.quoteId,
      input.projectId,
    );
    if (!quote) {
      throw new NotFoundException('Quote not found in this project');
    }
    return this.checkouts.findLatestByQuote(input.quoteId, input.projectId);
  }
}
