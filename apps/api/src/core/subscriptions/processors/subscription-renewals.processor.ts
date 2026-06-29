import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SubscriptionRenewalsService } from '../subscription-renewals.service';
import { attachWorkerResilience } from '../../../utils/bullmq/worker-resilience';
import { CRON_WORKER_OPTIONS } from '../../../utils/bullmq/worker-options';

// CRON worker options: idle except for daily/monthly cron triggers, so we
// long-poll less often and widen the stalled-check interval to minimize
// baseline Upstash command burn. A pushed job still wakes the fetch immediately.
@Processor('subscription-renewals', CRON_WORKER_OPTIONS)
export class SubscriptionRenewalsProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(SubscriptionRenewalsProcessor.name);

  constructor(
    private readonly subscriptionRenewalsService: SubscriptionRenewalsService,
  ) {
    super();
  }

  onApplicationBootstrap() {
    attachWorkerResilience(this.worker, this.logger, 'subscription-renewals');
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === 'run-subscription-renewals') {
      const dueDate =
        (job.data.dueDate as string) ?? new Date().toISOString().split('T')[0];
      this.logger.log(`Running subscription renewals for ${dueDate}`);
      return this.subscriptionRenewalsService.executeRenewals(dueDate);
    }

    return { skipped: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    this.logger.error(
      `Subscription renewals job ${job.id} failed: ${error.message}`,
    );
  }
}
