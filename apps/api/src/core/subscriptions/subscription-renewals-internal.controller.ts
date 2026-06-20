import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalCronGuard } from '../common/guards/internal-cron.guard';
import { SubscriptionRenewalsService } from './subscription-renewals.service';

@ApiExcludeController()
@ApiTags('Internal')
@UseGuards(InternalCronGuard)
@Controller('internal/subscriptions')
export class SubscriptionRenewalsInternalController {
  constructor(
    private readonly subscriptionRenewalsService: SubscriptionRenewalsService,
  ) {}

  @Post('run-renewals')
  @ApiOperation({
    summary: 'Process due subscription renewals (internal)',
    description:
      'Ops-only. Requires x-cron-secret header. Normally triggered by pg_cron.',
  })
  runRenewals(@Body() body: { due_date?: string }) {
    return this.subscriptionRenewalsService.runRenewals(body?.due_date);
  }
}
