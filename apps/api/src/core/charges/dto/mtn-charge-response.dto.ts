import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeNextActionDto } from './charge-next-action.dto';

export class MtnChargeDataDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  transaction_id: string;

  @ApiProperty({ example: 'ext_abc123', type: String })
  external_id: string;

  @ApiPropertyOptional({
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    type: String,
    nullable: true,
  })
  reference_id: string | null;

  @ApiProperty({
    example: 'PENDING',
    description:
      'Test keys return `completed` immediately; live returns `PENDING` until the customer approves.',
    type: String,
  })
  status: string;
}

export class MtnChargeResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  success: boolean;

  @ApiProperty({ type: MtnChargeDataDto })
  data: MtnChargeDataDto;

  @ApiPropertyOptional({ type: ChargeNextActionDto })
  next_action?: ChargeNextActionDto;
}
