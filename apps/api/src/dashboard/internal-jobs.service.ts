import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface EnqueueJobBody {
  jobType: string;
  [key: string]: unknown;
}

@Injectable()
export class InternalJobsService {
  private readonly logger = new Logger(InternalJobsService.name);

  constructor(
    @InjectQueue('lomi-jobs') private readonly jobsQueue: Queue | null,
  ) {}

  async enqueue(body: EnqueueJobBody) {
    const { jobType, ...rest } = body;

    if (!jobType || typeof jobType !== 'string') {
      return { queued: false, reason: 'missing_job_type' };
    }

    if (!this.jobsQueue) {
      this.logger.warn('lomi-jobs queue unavailable; job dropped', body);
      return { queued: false, reason: 'queue_unavailable' };
    }

    const payload =
      Object.keys(rest).length > 0 ? rest : ({} as Record<string, unknown>);

    const job = await this.jobsQueue.add(jobType, payload, {
      jobId:
        typeof payload.dedupeKey === 'string' ? payload.dedupeKey : undefined,
    });

    return { queued: true, jobId: job.id, jobType };
  }
}
