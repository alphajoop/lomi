import { Injectable } from '@nestjs/common';
import { SpiInvoicingService } from '../core/spi/spi-invoicing.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

@Injectable()
export class DashboardInvoicingSpiService {
  constructor(private readonly spiInvoicing: SpiInvoicingService) {}

  requestPayment(
    user: DashboardUserContext,
    body: { invoiceId: string; payeurAlias?: string },
  ) {
    return this.spiInvoicing.requestPayment({
      organizationId: user.organizationId,
      invoiceId: body.invoiceId,
      payeurAlias: body.payeurAlias,
    });
  }

  bulkRequestPayment(
    user: DashboardUserContext,
    body: { invoiceIds: string[] },
  ) {
    return this.spiInvoicing.bulkRequestPayment({
      organizationId: user.organizationId,
      invoiceIds: body.invoiceIds,
    });
  }

  getPaymentStatus(user: DashboardUserContext, invoiceId: string) {
    return this.spiInvoicing.getPaymentStatus(user.organizationId, invoiceId);
  }
}
