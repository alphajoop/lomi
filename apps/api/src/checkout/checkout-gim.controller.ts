import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  WRITE_THROTTLE_LIMIT,
  WRITE_THROTTLE_TTL_MS,
} from '../config/http.constants';
import { GimCheckoutService } from '../core/gim/gim-checkout.service';
import { CheckoutGimPayDto } from './dto/checkout-gim-pay.dto';

/**
 * Public, unauthenticated GIM Pay endpoints for the hosted checkout app.
 * The checkout_session_id is the capability; amount is never trusted from the client.
 */
@ApiExcludeController()
@ApiTags('Checkout')
@Controller('checkout/v1/gim')
export class CheckoutGimController {
  constructor(private readonly checkoutGim: GimCheckoutService) {}

  @Post('pay')
  @Throttle({ default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Initiate hosted-checkout GIM PayByCard payment' })
  pay(@Body() body: CheckoutGimPayDto) {
    return this.checkoutGim.pay({
      checkoutSessionId: body.checkoutSessionId,
      pan: body.pan,
      expiry: body.expiry,
      cvv: body.cvv,
      cardHolderName: body.cardHolderName,
      ecomIp: body.ecomIp,
    });
  }
}
