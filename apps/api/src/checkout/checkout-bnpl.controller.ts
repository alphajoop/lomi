import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  WRITE_THROTTLE_LIMIT,
  WRITE_THROTTLE_TTL_MS,
} from '../config/http.constants';
import { BnplService } from '../core/bnpl/bnpl.service';
import { CheckoutBnplCreateDto } from './dto/checkout-bnpl.dto';
import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutBnplEligibilityQuery {
  @IsUUID()
  organizationId!: string;
}

class CheckoutBnplDisplayQuery {
  @IsUUID()
  organizationId!: string;

  @Type(() => Number)
  @Min(1)
  productAmount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(12)
  installmentCount!: number;
}

@ApiExcludeController()
@ApiTags('Checkout')
@Controller('checkout/v1/bnpl')
export class CheckoutBnplController {
  constructor(private readonly bnplService: BnplService) {}

  @Get('eligibility')
  @ApiOperation({ summary: 'Whether merchant can offer Jumbo BNPL at checkout' })
  getEligibility(@Query() query: CheckoutBnplEligibilityQuery) {
    return this.bnplService.getMerchantEligibility(query.organizationId);
  }

  @Get('display')
  @ApiOperation({ summary: 'BNPL installment breakdown for hosted checkout' })
  getDisplay(@Query() query: CheckoutBnplDisplayQuery) {
    return this.bnplService.getCheckoutDisplay(
      query.organizationId,
      query.productAmount,
      query.installmentCount,
    );
  }

  @Post('create')
  @Throttle({
    default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS },
  })
  @ApiOperation({ summary: 'Create BNPL plan from checkout session' })
  create(@Body() body: CheckoutBnplCreateDto) {
    return this.bnplService.createFromCheckout({
      checkoutSessionId: body.checkoutSessionId,
      installmentCount: body.installmentCount,
      payeurAlias: body.payeurAlias,
      merchantId: body.merchantId,
      customerId: body.customerId,
      productId: body.productId,
      productAmount: body.productAmount ?? 0,
    });
  }
}
