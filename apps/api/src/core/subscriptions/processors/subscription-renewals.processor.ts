import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SubscriptionRenewalsService } from '../subscription-renewals.service';

@Processor('subscription-renewals')
export class SubscriptionRenewalsProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionRenewalsProcessor.name);

  constructor(
    private readonly subscriptionRenewalsService: SubscriptionRenewalsService,
  ) {
    super();
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
