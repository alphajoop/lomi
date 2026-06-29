import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UsageEventsService } from '../usage-events.service';
import { attachWorkerResilience } from '../../../utils/bullmq/worker-resilience';
import { LIVE_WORKER_OPTIONS } from '../../../utils/bullmq/worker-options';

// LIVE worker options: short drainDelay so retries stay snappy, plus a widened
// stalled-check interval to keep idle Upstash command burn to a minimum.
@Processor('metering', LIVE_WORKER_OPTIONS)
export class MeteringProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(MeteringProcessor.name);

  constructor(private readonly usageEventsService: UsageEventsService) {
    super();
  }

  onApplicationBootstrap() {
    attachWorkerResilience(this.worker, this.logger, 'metering');
  }

  async process(job: Job): Promise<unknown> {
    if (job.name !== 'process-usage-event') {
      this.logger.warn(`Unknown metering job: ${job.name}`);
      return { skipped: true };
    }

    const { eventId, organizationId } = job.data as {
      eventId: string;
      organizationId: string;
    };

    this.logger.log(
      `Processing usage event ${eventId} (attempt ${job.attemptsMade + 1})`,
    );

    return this.usageEventsService.processEvent(eventId, organizationId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    this.logger.error(
      `Metering job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }
}
