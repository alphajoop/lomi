import type { WorkerOptions } from 'bullmq';

/**
 * Shared BullMQ worker tuning aimed at keeping Upstash (per-command billed)
 * Redis usage to a minimum on our low-volume queues.
 *
 * The dominant idle cost is the stalled-job checker: it runs every
 * `stalledInterval` ms, forever, per worker, issuing several Redis commands per
 * scan. At the 30s default across our always-on workers that check is the bulk
 * of the command spend even when no jobs flow. Widening it to 5 minutes cuts
 * that roughly 10x. The only trade-off is that a job orphaned by a hard process
 * crash is re-queued up to ~5 min later, which is acceptable for these queues.
 *
 * `drainDelay` (seconds) is how long the blocking fetch waits on an empty
 * queue. Newly added jobs wake the fetch immediately, so a larger value only
 * delays *delayed/retry* jobs, hence the split below.
 */
const STALLED_INTERVAL_MS = 300_000;

/**
 * For queues that handle live traffic and time-sensitive retries (webhooks,
 * usage metering). Keeps retry latency low while still trimming idle cost.
 */
export const LIVE_WORKER_OPTIONS = {
  drainDelay: 60,
  stalledInterval: STALLED_INTERVAL_MS,
} satisfies Partial<WorkerOptions>;

/**
 * For cron-driven queues (billing cycles, subscription renewals) that are
 * triggered on a schedule and tolerate higher pickup latency.
 */
export const CRON_WORKER_OPTIONS = {
  drainDelay: 300,
  stalledInterval: STALLED_INTERVAL_MS,
} satisfies Partial<WorkerOptions>;
