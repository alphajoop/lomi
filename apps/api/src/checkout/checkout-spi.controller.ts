import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  WRITE_THROTTLE_LIMIT,
  WRITE_THROTTLE_TTL_MS,
} from '../config/http.constants';
import { SpiCheckoutService } from '../core/spi/spi-checkout.service';
import { CheckoutSpiRequestToPayDto } from './dto/checkout-spi-request-to-pay.dto';

/**
 * Public, unauthenticated SPI endpoints for the hosted checkout app
 * (checkout.lomi.africa). There is no payer JWT, the `checkoutSessionId`
 * (an unguessable UUID) is the capability. The amount is always derived
 * server-side from the session; the client amount is never trusted.
 */
@ApiExcludeController()
@ApiTags('Checkout')
@Controller('checkout/v1/spi')
export class CheckoutSpiController {
  constructor(private readonly checkoutSpi: SpiCheckoutService) {}

  @Post('request-payment')
  @Throttle({
    default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS },
  })
  @ApiOperation({
    summary: 'Initiate hosted-checkout SPI request-to-pay from a payer alias',
  })
  initRequestToPay(@Body() body: CheckoutSpiRequestToPayDto) {
    return this.checkoutSpi.initRequestToPay({
      checkoutSessionId: body.checkoutSessionId,
      payeurAlias: body.payeurAlias,
    });
  }

  @Get('payments/:checkoutSessionId')
  @ApiOperation({ summary: 'Poll hosted-checkout SPI payment status' })
  getPaymentStatus(
    @Param('checkoutSessionId', ParseUUIDPipe) checkoutSessionId: string,
  ) {
    return this.checkoutSpi.getPaymentStatus(checkoutSessionId);
  }
}
