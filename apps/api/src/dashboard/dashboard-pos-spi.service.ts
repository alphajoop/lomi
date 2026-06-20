import { BadRequestException, Injectable } from '@nestjs/common';
import { SpiPosService } from '../core/spi/spi-pos.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

@Injectable()
export class DashboardPosSpiService {
  constructor(private readonly spiPosService: SpiPosService) {}

  initQrPayment(
    user: DashboardUserContext,
    body: {
      amount: number;
      currency?: string;
      productId?: string;
      metadata?: Record<string, unknown>;
      checkoutSessionId?: string;
    },
  ) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.spiPosService.initQrPayment({
      organizationId: user.organizationId,
      merchantId: user.merchantId,
      amount: body.amount,
      currency: body.currency ?? 'XOF',
      productId: body.productId,
      metadata: body.metadata,
      checkoutSessionId: body.checkoutSessionId,
    });
  }

  getPaymentStatus(user: DashboardUserContext, checkoutSessionId: string) {
    return this.spiPosService.getPaymentStatus(
      user.organizationId,
      checkoutSessionId,
    );
  }
}
