import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeNextActionDto } from './charge-next-action.dto';

/**
 * Wave direct-charge responses mirror the Wave edge checkout session payload.
 * Fields present depend on the edge function version; clients should read
 * `wave_launch_url` or `checkout_url` for the customer redirect.
 */
export class WaveChargeResponseDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  transactionId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  transaction_id?: string;

  @ApiPropertyOptional({
    example: 'https://pay.wave.com/c/abc123',
    type: String,
    description: 'URL to open Wave so the customer can approve the payment.',
  })
  wave_launch_url?: string;

  @ApiPropertyOptional({
    example: 'https://checkout.lomi.africa/checkout/wave/abc123',
    type: String,
  })
  checkout_url?: string;

  @ApiPropertyOptional({
    example: 'pending',
    type: String,
  })
  status?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Nested session data when returned by the edge function.',
  })
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ type: ChargeNextActionDto })
  next_action?: ChargeNextActionDto;
}
