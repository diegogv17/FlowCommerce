import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Matches } from 'class-validator';
import {
  SIMULATED_CARD_BRANDS,
  SIMULATED_INSTALLMENT_OPTIONS,
  type SimulatedCardBrand,
  type SimulatedInstallments,
} from '../../domain/simulated-payment';

export class SimulateQuotePaymentDto {
  @ApiProperty({ enum: SIMULATED_CARD_BRANDS, example: 'VISA' })
  @IsIn(SIMULATED_CARD_BRANDS)
  brand!: SimulatedCardBrand;

  @ApiProperty({
    example: '4242',
    description:
      'Últimos 4 dígitos de la tarjeta; el número completo no se envía',
  })
  @Matches(/^\d{4}$/)
  lastFourDigits!: string;

  @ApiProperty({ enum: SIMULATED_INSTALLMENT_OPTIONS, example: 1 })
  @IsInt()
  @IsIn(SIMULATED_INSTALLMENT_OPTIONS)
  installments!: SimulatedInstallments;
}
