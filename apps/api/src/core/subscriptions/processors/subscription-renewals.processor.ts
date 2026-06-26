import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SubscriptionRenewalsService } from '../subscription-renewals.service';
import { attachWorkerResilience } from '../../../utils/bullmq/worker-resilience';

// drainDelay 60s: this queue is idle except for daily/monthly cron triggers,
// so long-poll less often to cut baseline Redis command burn. A pushed job
// still wakes the blocking fetch immediately, so pickup latency is unchanged.
@Processor('subscription-renewals', { drainDelay: 60 })
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
