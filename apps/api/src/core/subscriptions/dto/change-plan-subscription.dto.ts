import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanSubscriptionDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'New price UUID for the subscription',
  })
  price_id: string;
}
