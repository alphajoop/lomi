import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ProvisioningContext } from '../../core/common/guards/provisioning-key.guard';

export const CurrentProvisioning = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ProvisioningContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.provisioning;
  },
);
