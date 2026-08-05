import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PayService } from '../services/pay.service.js';

@Controller('v1')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Post('pay')
  pay(
    @Body()
    body: {
      amount?: number;
      destination?: string;
      metadata?: Record<string, unknown>;
    },
    @Headers('authorization') authorization?: string,
    @Headers('x-lomi-vw-key') vwKeyHeader?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const apiKey = this.extractVirtualWalletKey(authorization, vwKeyHeader);
    const result = this.payService.pay({
      api_key: apiKey,
      amount: body.amount ?? 0,
      destination: body.destination ?? '',
      idempotency_key: idempotencyKey,
      metadata: body.metadata,
    });
    return { ok: true, ...result };
  }

  private extractVirtualWalletKey(
    authorization?: string,
    vwKeyHeader?: string,
  ): string {
    if (vwKeyHeader?.startsWith('lomi_vw_')) {
      return vwKeyHeader.trim();
    }
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      if (token.startsWith('lomi_vw_')) {
        return token;
      }
    }
    return '';
  }
}
