import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MAX_INSTRUCTIONS_LENGTH } from '../../application/use-cases/generate-quote-draft.use-case';

export class QuoteDraftRequestDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Lead para el que se prepara la cotización',
  })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Cliente. Si no llega leadId, se usa su lead con actividad más reciente',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    maxLength: MAX_INSTRUCTIONS_LENGTH,
    example:
      'Licencia Pro para 12 usuarios con 10% de descuento, implementación y 2 capacitaciones',
  })
  @IsString()
  @MaxLength(MAX_INSTRUCTIONS_LENGTH)
  instructions!: string;
}

export class QuoteDraftResponseDto {
  @ApiProperty({ format: 'uuid' })
  quoteId!: string;

  @ApiProperty({ example: 'COT-0028' })
  folio!: string;

  @ApiProperty({ description: 'Resumen para el asesor de lo que armó la IA' })
  summary!: string;

  @ApiProperty({
    type: [String],
    description:
      'Correcciones aplicadas (productos descartados, descuentos recortados…)',
  })
  warnings!: string[];
}

export class ReplySuggestionsResponseDto {
  @ApiProperty({ type: [String], description: '2 o 3 respuestas sugeridas' })
  suggestions!: string[];
}

export class LeadInsightResponseDto {
  @ApiProperty()
  summary!: string;

  @ApiProperty()
  nextBestAction!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  closeProbability!: number;

  @ApiProperty({ type: [String] })
  risks!: string[];

  @ApiProperty({ minimum: 0, maximum: 60 })
  suggestedFollowUpDays!: number;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}
