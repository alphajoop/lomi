import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BillingService } from '../billing.service';
import { attachWorkerResilience } from '../../../utils/bullmq/worker-resilience';

// drainDelay 60s: idle except for the monthly billing-cycle cron trigger.
// Longer empty-queue long-poll cuts baseline Redis command burn; a pushed job
// still wakes the blocking fetch immediately.
@Processor('billing', { drainDelay: 60 })
export class BillingProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(private readonly billingService: BillingService) {
    super();
  }

  onApplicationBootstrap() {
    attachWorkerResilience(this.worker, this.logger, 'billing');
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === 'run-usage-billing-cycle') {
      const asOfDate =
        (job.data.asOfDate as string) ?? new Date().toISOString().split('T')[0];
      this.logger.log(`Running usage billing cycle for ${asOfDate}`);
      return this.billingService.executeUsageBillingCycle(asOfDate);
    }

    return { skipped: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    this.logger.error(`Billing job ${job.id} failed: ${error.message}`);
  }
}
