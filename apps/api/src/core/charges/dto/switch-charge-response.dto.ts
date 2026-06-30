import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeNextActionDto } from './charge-next-action.dto';

export class SwitchChargeResponseDto {
  @ApiProperty({ type: Boolean })
  success: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: ['approved', 'declined', 'redirect_3ds', 'retry_other_rail'],
  })
  status?: string;

  @ApiPropertyOptional({ type: Number })
  system_reference?: number;

  @ApiPropertyOptional({ type: String })
  merchant_reference?: string;

  @ApiPropertyOptional({ type: String })
  action_code?: string;

  @ApiPropertyOptional({ type: String })
  message?: string;

  @ApiPropertyOptional({ type: String })
  auth_code?: string;

  @ApiPropertyOptional({ type: String })
  transaction_id?: string;

  @ApiPropertyOptional({ type: () => ChargeNextActionDto })
  next_action?: ChargeNextActionDto;
}
