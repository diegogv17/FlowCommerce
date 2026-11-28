import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@flowcommerce/types';
import { AuthorizationService } from '../../../authorization/application/services/authorization.service';
import {
  describeUnavailability,
  type RecurrenteAvailability,
} from '../../domain/recurrente-checkout';
import {
  RECURRENTE_GATEWAY,
  type RecurrenteGateway,
} from '../ports/recurrente.gateway';

export interface RecurrenteAvailabilityResult extends RecurrenteAvailability {
  message: string | null;
}

@Injectable()
export class GetRecurrenteAvailabilityUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(RECURRENTE_GATEWAY)
    private readonly gateway: RecurrenteGateway,
  ) {}

  async execute(input: {
    actorUserId: string;
    projectId: string;
  }): Promise<RecurrenteAvailabilityResult> {
    await this.authorizationService.assertCan(
      input.actorUserId,
      Permission.QUOTE_READ,
      input.projectId,
    );
    const availability = await this.gateway.checkAvailability();
    return {
      ...availability,
      message: describeUnavailability(availability.reason),
    };
  }
}
