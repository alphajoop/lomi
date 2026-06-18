import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalCronGuard } from '../common/guards/internal-cron.guard';
import { BillingService } from './billing.service';

@ApiExcludeController()
@ApiTags('Internal')
@UseGuards(InternalCronGuard)
@Controller('internal/usage-billing')
export class UsageBillingInternalController {
  constructor(private readonly billingService: BillingService) {}

  @Post('run-cycle')
  @ApiOperation({
    summary: 'Run usage billing cycle (internal)',
    description:
      'Ops-only. Requires x-cron-secret header. Normally handled by pg_cron.',
  })
  runCycle(@Body() body: { as_of_date?: string }) {
    return this.billingService.runUsageBillingCycle(body?.as_of_date);
  }

  @Post('run-dunning')
  @ApiOperation({
    summary: 'Process usage invoice dunning (internal)',
    description: 'Ops-only. Requires x-cron-secret header.',
  })
  runDunning(@Body() body: { grace_days?: number }) {
    return this.billingService.runDunning(body?.grace_days ?? 3);
  }
}
