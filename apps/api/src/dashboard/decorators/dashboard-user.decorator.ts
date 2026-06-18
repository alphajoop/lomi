import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { LomiPaymentEnvironment } from '../../utils/payment-environment';

export interface DashboardUserContext {
  merchantId: string;
  organizationId: string;
  environment: LomiPaymentEnvironment;
}

export const CurrentDashboardUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DashboardUserContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.dashboardUser;
  },
);
