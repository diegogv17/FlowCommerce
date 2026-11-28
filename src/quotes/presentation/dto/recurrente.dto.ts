import { ApiProperty } from '@nestjs/swagger';
import {
  RECURRENTE_CHECKOUT_STATUSES,
  type RecurrenteCheckoutRecord,
  type RecurrenteCheckoutStatus,
  type RecurrenteUnavailableReason,
  type RecurrenteVerificationOutcome,
} from '../../domain/recurrente-checkout';
import type { RecurrenteAvailabilityResult } from '../../application/use-cases/recurrente-availability.use-case';
import type { ConfirmRecurrentePaymentResult } from '../../application/use-cases/confirm-recurrente-payment.use-case';
import { QuoteDetailDto } from './quote.dto';

const VERIFICATION_OUTCOMES = [
  'PAID',
  'PENDING',
  'IN_PROGRESS',
  'EXPIRED',
] as const;

const OUTCOME_MESSAGES: Record<(typeof VERIFICATION_OUTCOMES)[number], string> =
  {
    PAID: 'Recurrente confirmó el pago: la cotización quedó pagada',
    PENDING:
      'Recurrente no confirma el pago (el checkout sigue sin pagar). Si el intento fue rechazado, la cotización permanece aceptada',
    IN_PROGRESS: 'Recurrente informa que el pago está en proceso',
    EXPIRED: 'El checkout venció; se puede generar un enlace nuevo',
  };

export class RecurrenteAvailabilityDto {
  @ApiProperty()
  available!: boolean;

  @ApiProperty({
    enum: ['MISSING_KEY', 'INVALID_KEY', 'NOT_SANDBOX', 'UNREACHABLE'],
    nullable: true,
  })
  reason!: RecurrenteUnavailableReason | null;

  @ApiProperty({ nullable: true })
  message!: string | null;

  static from(result: RecurrenteAvailabilityResult): RecurrenteAvailabilityDto {
    const dto = new RecurrenteAvailabilityDto();
    dto.available = result.available;
    dto.reason = result.reason;
    dto.message = result.message;
    return dto;
  }
}

export class RecurrenteCheckoutDto {
  @ApiProperty()
  checkoutId!: string;

  @ApiProperty()
  checkoutUrl!: string;

  @ApiProperty({ description: 'Monto enviado a Recurrente, en centavos' })
  amountInCents!: number;

  @ApiProperty({ example: 'GTQ' })
  currency!: string;

  @ApiProperty({ enum: RECURRENTE_CHECKOUT_STATUSES })
  status!: RecurrenteCheckoutStatus;

  @ApiProperty({ nullable: true })
  paidAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  static from(record: RecurrenteCheckoutRecord): RecurrenteCheckoutDto {
    const dto = new RecurrenteCheckoutDto();
    dto.checkoutId = record.checkoutId;
    dto.checkoutUrl = record.checkoutUrl;
    dto.amountInCents = record.amountInCents;
    dto.currency = record.currency;
    dto.status = record.status;
    dto.paidAt = record.paidAt ? record.paidAt.toISOString() : null;
    dto.createdAt = record.createdAt.toISOString();
    return dto;
  }
}

export class RecurrenteCheckoutStateDto {
  @ApiProperty({ type: RecurrenteCheckoutDto, nullable: true })
  checkout!: RecurrenteCheckoutDto | null;

  static from(
    record: RecurrenteCheckoutRecord | null,
  ): RecurrenteCheckoutStateDto {
    const dto = new RecurrenteCheckoutStateDto();
    dto.checkout = record ? RecurrenteCheckoutDto.from(record) : null;
    return dto;
  }
}

export class RecurrenteVerificationDto {
  @ApiProperty({ enum: VERIFICATION_OUTCOMES })
  outcome!: Exclude<RecurrenteVerificationOutcome, 'MISMATCH'>;

  @ApiProperty()
  message!: string;

  @ApiProperty({
    description:
      'true solo en la llamada que realizó la transición ACCEPTED a PAID',
  })
  transitioned!: boolean;

  @ApiProperty({ type: RecurrenteCheckoutDto })
  checkout!: RecurrenteCheckoutDto;

  @ApiProperty({ type: QuoteDetailDto })
  quote!: QuoteDetailDto;

  static from(
    result: ConfirmRecurrentePaymentResult,
  ): RecurrenteVerificationDto {
    const dto = new RecurrenteVerificationDto();
    dto.outcome = result.outcome;
    dto.message = OUTCOME_MESSAGES[result.outcome];
    dto.transitioned = result.transitioned;
    dto.checkout = RecurrenteCheckoutDto.from(result.checkout);
    dto.quote = result.quote.toDetail();
    return dto;
  }
}
