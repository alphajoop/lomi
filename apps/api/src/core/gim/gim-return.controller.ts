import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GimChargeService } from './gim-charge.service';

const CHECKOUT_SUCCESS_BASE =
  process.env.CHECKOUT_SUCCESS_URL?.trim() ??
  'https://checkout.lomi.africa/checkout/success';

const CHECKOUT_ERROR_BASE =
  process.env.CHECKOUT_ERROR_URL?.trim() ??
  'https://checkout.lomi.africa/checkout/error';

@ApiExcludeController()
@ApiTags('Payments')
@Controller('payments/gim')
export class GimReturnController {
  constructor(private readonly gimCharge: GimChargeService) {}

  @Get('return')
  @ApiOperation({ summary: 'GIM Pay 3DS return URL handler' })
  async handleReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const result = await this.gimCharge.finalizeFromReturnQuery(query);
      const sessionParam = result.checkoutSessionId
        ? `?session_id=${encodeURIComponent(result.checkoutSessionId)}`
        : result.merchantReference
          ? `?session_id=${encodeURIComponent(result.merchantReference)}`
          : '';

      if (result.approved) {
        return res.redirect(302, `${CHECKOUT_SUCCESS_BASE}${sessionParam}`);
      }

      const reason = encodeURIComponent('payment_declined');
      return res.redirect(
        302,
        `${CHECKOUT_ERROR_BASE}${sessionParam}${sessionParam ? '&' : '?'}error=${reason}`,
      );
    } catch {
      return res.redirect(
        302,
        `${CHECKOUT_ERROR_BASE}?error=${encodeURIComponent('hash_mismatch')}`,
      );
    }
  }
}
