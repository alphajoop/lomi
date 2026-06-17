import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Normalized next step for direct charge integrators (additive; legacy fields remain). */
export class ChargeNextActionDto {
  @ApiProperty({
    enum: ['redirect', 'await_webhook', 'client_secret'],
    description:
      'How the client should proceed: open a URL, wait for webhook/status, or confirm with client_secret.',
  })
  type: 'redirect' | 'await_webhook' | 'client_secret';

  @ApiPropertyOptional({
    type: String,
    description: 'Present when type is redirect.',
  })
  url?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Present when type is await_webhook (e.g. PENDING, completed).',
  })
  status?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Present when type is client_secret.',
  })
  client_secret?: string;
}
