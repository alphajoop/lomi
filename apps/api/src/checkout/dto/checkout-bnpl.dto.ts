import { IsInt, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CheckoutBnplCreateDto {
  @IsUUID()
  checkoutSessionId!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  merchantId!: string;

  @IsInt()
  @Min(2)
  @Max(12)
  installmentCount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  payeurAlias!: string;

  productId?: string;

  productAmount?: number;
}

export class CheckoutBnplDisplayQueryDto {
  @IsUUID()
  organizationId!: string;

  @Min(1)
  productAmount!: number;

  @IsInt()
  @Min(2)
  @Max(12)
  installmentCount!: number;
}
