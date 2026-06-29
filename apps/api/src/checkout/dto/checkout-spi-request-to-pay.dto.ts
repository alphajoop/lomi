import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CheckoutSpiRequestToPayDto {
  @IsUUID()
  checkoutSessionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  payeurAlias!: string;
}
