import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeNextActionDto } from './charge-next-action.dto';

export class CardChargeAppearanceDto {
  @ApiPropertyOptional({ example: 'light', type: String })
  theme?: 'light' | 'dark' | 'flat';

  @ApiPropertyOptional({ example: 6, type: Number })
  border_radius?: number;

  @ApiPropertyOptional({ example: 'never', type: String })
  billing_address?: 'auto' | 'never';
}

export class CardChargeDataDto {
  @ApiProperty({ example: 'pi_3QxYk6...', type: String })
  id: string;

  @ApiProperty({ example: 'pi_3QxYk6..._secret_...', type: String })
  client_secret: string;

  @ApiProperty({ example: 152, type: Number })
  amount: number;

  @ApiProperty({ example: 'eur', type: String })
  currency: string;

  @ApiProperty({ example: 10000, type: Number })
  original_amount: number;

  @ApiProperty({ example: 'XOF', type: String })
  original_currency: string;

  @ApiProperty({ example: 'requires_payment_method', type: String })
  status: string;

  @ApiPropertyOptional({ type: CardChargeAppearanceDto })
  appearance?: CardChargeAppearanceDto;
}

export class CardChargeResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  success: boolean;

  @ApiProperty({ type: CardChargeDataDto })
  data: CardChargeDataDto;

  @ApiPropertyOptional({ type: ChargeNextActionDto })
  next_action?: ChargeNextActionDto;
}
