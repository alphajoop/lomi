import { Logger } from '@nestjs/common';
import { Worker } from 'bullmq';

export interface WorkerResilienceOptions {
  /** First backoff step once a worker is considered unhealthy. */
  baseDelayMs?: number;
  /** Upper bound for the exponential backoff between poll attempts. */
  maxDelayMs?: number;
  /** Minimum spacing between repeated error log lines (anti-flood). */
  logThrottleMs?: number;
  /** Consecutive errors tolerated before we start pausing the worker. */
  errorThreshold?: number;
}

const QUOTA_ERROR =
  /max requests limit exceeded|max daily request limit|ERR max|quota/i;

/**
 * Hardens a BullMQ worker against Redis outages / provider quota rejections.
 *
 * BullMQ's connection-level `retryStrategy` only reacts when the socket drops.
 * When a provider like Upstash keeps the connection open but rejects every
 * command (e.g. `ReplyError: max requests limit exceeded`), the worker's fetch
 * loop fails instantly and retries with no delay — burning commands and
 * flooding logs. This attaches:
 *   1. Throttled error logging so an outage can't blow the log/cost budget.
 *   2. Exponential backoff via pause/resume so the worker stops hammering Redis
 *      while it is unhealthy, then probes again on a capped schedule.
 */
export function attachWorkerResilience(
  worker: Worker | undefined,
  logger: Logger,
  queueName: string,
  options: WorkerResilienceOptions = {},
): void {
  if (!worker) {
    logger.warn(
      `[${queueName}] worker not available; skipping resilience wiring.`,
    );
    return;
  }

  const baseDelayMs = options.baseDelayMs ?? 5_000;
  const maxDelayMs = options.maxDelayMs ?? 5 * 60_000;
  const logThrottleMs = options.logThrottleMs ?? 30_000;
  const errorThreshold = options.errorThreshold ?? 5;

  let consecutiveErrors = 0;
  let lastLoggedAt = 0;
  let suppressedLogs = 0;
  let backoffActive = false;

  const resetHealth = () => {
    if (consecutiveErrors === 0) return;
    consecutiveErrors = 0;
    suppressedLogs = 0;
  };

  worker.on('error', (rawError: unknown) => {
    const error =
      rawError instanceof Error ? rawError : new Error(String(rawError));
    consecutiveErrors += 1;

    const now = Date.now();
    if (now - lastLoggedAt >= logThrottleMs) {
      const suffix =
        suppressedLogs > 0 ? ` (+${suppressedLogs} suppressed)` : '';
      logger.error(
        `[${queueName}] worker Redis error: ${error.message}${suffix}`,
      );
      lastLoggedAt = now;
      suppressedLogs = 0;
    } else {
      suppressedLogs += 1;
    }

    const shouldBackoff =
      QUOTA_ERROR.test(error.message) || consecutiveErrors >= errorThreshold;
    if (!shouldBackoff || backoffActive) return;

    backoffActive = true;
    const exponent = Math.min(consecutiveErrors, 6);
    const delay = Math.min(baseDelayMs * 2 ** exponent, maxDelayMs);
    logger.warn(
      `[${queueName}] pausing worker for ${Math.round(delay / 1000)}s after ` +
        `${consecutiveErrors} consecutive Redis errors.`,
    );

    // doNotWaitActive=true: stop fetching new jobs immediately rather than
    // waiting on in-flight work (which would also be failing during an outage).
    void worker.pause(true);
    setTimeout(() => {
      backoffActive = false;
      if (worker.closing) return;
      logger.log(`[${queueName}] resuming worker after backoff.`);
      worker.resume();
    }, delay).unref?.();
  });

  worker.on('completed', resetHealth);
  worker.on('active', resetHealth);
  worker.on('ready', () => {
    resetHealth();
    logger.log(`[${queueName}] worker connected to Redis.`);
  });
}
