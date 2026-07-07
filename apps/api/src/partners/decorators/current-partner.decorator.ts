import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PartnerContext } from '../../core/common/guards/partner-key.guard';

export const CurrentPartner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PartnerContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.partner;
  },
);
