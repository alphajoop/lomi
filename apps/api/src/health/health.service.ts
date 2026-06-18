import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

export type ReadinessCheck = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type RedisHealthResult =
  | {
      status: 'ok';
      redis: 'connected';
      queues?: {
        webhooks: Record<string, number>;
        metering: Record<string, number>;
        billing: Record<string, number>;
      };
    }
  | {
      status: 'degraded';
      redis: 'unavailable';
      error: string;
    };

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis | null = null;

  // Short TTL cache for full Redis health (ping + queue counts).
  // Readiness probes (Railway healthcheck + manual /ready) would otherwise
  // hammer Redis with ping + getJobCounts on every call. 15s is a good
  // trade-off between freshness and command volume.
  private lastRedisHealth: {
    value: RedisHealthResult & { ok: boolean };
    at: number;
  } | null = null;
  private readonly REDIS_HEALTH_CACHE_TTL_MS = 15_000;

  constructor(
    @Optional() @InjectQueue('webhooks') private readonly webhooksQueue?: Queue,
    @Optional() @InjectQueue('metering') private readonly meteringQueue?: Queue,
    @Optional() @InjectQueue('billing') private readonly billingQueue?: Queue,
  ) {}

  private getRedis(): Redis | null {
    if (this.redis) {
      return this.redis;
    }

    const redisUrl = process.env.UPSTASH_REDIS_URL;
    try {
      if (redisUrl) {
        const url = new URL(redisUrl);
        this.redis = new Redis({
          host: url.hostname,
          port: parseInt(url.port || '6379', 10),
          password: decodeURIComponent(url.password),
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          tls: url.protocol === 'rediss:' ? {} : undefined,
          lazyConnect: true,
        });
      } else {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          lazyConnect: true,
        });
      }
      return this.redis;
    } catch (error) {
      this.logger.warn(`Redis client init failed: ${error}`);
      return null;
    }
  }

  private runEnvCheck(
    checks: ReadinessCheck[],
    name: string,
    fn: () => void,
  ): void {
    try {
      fn();
      checks.push({ name, ok: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      checks.push({ name, ok: false, detail });
    }
  }

  async checkReadiness(): Promise<{
    ok: boolean;
    ready: boolean;
    service: string;
    checks: ReadinessCheck[];
    redis?: RedisHealthResult;
  }> {
    const checks: ReadinessCheck[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    this.runEnvCheck(checks, 'supabase_url', () => {
      if (!process.env.SUPABASE_URL?.trim()) {
        throw new Error('SUPABASE_URL is required');
      }
    });

    this.runEnvCheck(checks, 'supabase_secret_key', () => {
      if (!process.env.SUPABASE_SECRET_KEY?.trim()) {
        throw new Error('SUPABASE_SECRET_KEY is required');
      }
    });

    this.runEnvCheck(checks, 'upstash_redis_url', () => {
      if (isProduction && !process.env.UPSTASH_REDIS_URL?.trim()) {
        throw new Error(
          'UPSTASH_REDIS_URL is required in production for BullMQ workers',
        );
      }
    });

    if (isProduction) {
      this.runEnvCheck(checks, 'cron_secret', () => {
        if (!process.env.CRON_SECRET?.trim()) {
          throw new Error('CRON_SECRET is required in production');
        }
      });
    }

    // Use a *cheap* ping for the readiness decision and the 'redis_ping' check item.
    // This keeps Railway healthcheck probes (and any k8s-style readiness) from
    // generating a full ping + 15+ getJobCounts commands on every hit.
    const ping = await this.checkRedisPing();
    checks.push({
      name: 'redis_ping',
      ok: ping.ok,
      detail: ping.ok ? undefined : ping.error,
    });

    const envOk = checks.every((c) => c.ok);
    const ready = envOk && ping.ok;

    // For the response payload we still try to include rich queue counts, but
    // checkRedis is internally cached (15s TTL) so this does not add per-probe cost.
    let redisForResponse: any = ping.ok
      ? { status: 'ok', redis: 'connected' }
      : { status: 'degraded', redis: 'unavailable', error: ping.error };
    try {
      const full = await this.checkRedis();
      redisForResponse = full.ok
        ? {
            status: 'ok',
            redis: 'connected',
            ...('queues' in full && full.queues ? { queues: full.queues } : {}),
          }
        : full;
    } catch {
      // best effort; keep the ping-derived summary
    }

    return {
      ok: ready,
      ready,
      service: 'lomi-api',
      checks,
      redis: redisForResponse,
    };
  }

  async checkRedis(): Promise<RedisHealthResult & { ok: boolean }> {
    const now = Date.now();
    if (
      this.lastRedisHealth &&
      now - this.lastRedisHealth.at < this.REDIS_HEALTH_CACHE_TTL_MS
    ) {
      return this.lastRedisHealth.value;
    }

    const redis = this.getRedis();
    if (!redis) {
      const value: RedisHealthResult & { ok: boolean } = {
        ok: false,
        status: 'degraded',
        redis: 'unavailable',
        error: 'Redis client could not be initialized',
      };
      this.lastRedisHealth = { value, at: now };
      return value;
    }

    try {
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      const pong = await redis.ping();
      if (pong !== 'PONG') {
        const value: RedisHealthResult & { ok: boolean } = {
          ok: false,
          status: 'degraded',
          redis: 'unavailable',
          error: `Unexpected PING response: ${pong}`,
        };
        this.lastRedisHealth = { value, at: now };
        return value;
      }

      const queues = await this.getQueueCounts();
      const value: RedisHealthResult & { ok: boolean } = {
        ok: true,
        status: 'ok',
        redis: 'connected',
        ...(queues ? { queues } : {}),
      };
      this.lastRedisHealth = { value, at: now };
      return value;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const value: RedisHealthResult & { ok: boolean } = {
        ok: false,
        status: 'degraded',
        redis: 'unavailable',
        error: message,
      };
      this.lastRedisHealth = { value, at: now };
      return value;
    }
  }

  private async getQueueCounts(): Promise<{
    webhooks: Record<string, number>;
    metering: Record<string, number>;
    billing: Record<string, number>;
  } | null> {
    if (!this.webhooksQueue && !this.meteringQueue && !this.billingQueue) {
      return null;
    }

    const countTypes = [
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    ] as const;

    const snapshot = async (queue?: Queue) => {
      if (!queue) {
        return {};
      }
      return queue.getJobCounts(...countTypes);
    };

    return {
      webhooks: await snapshot(this.webhooksQueue),
      metering: await snapshot(this.meteringQueue),
      billing: await snapshot(this.billingQueue),
    };
  }

  /**
   * Cheap ping-only check. Used by readiness so that platform healthchecks
   * (Railway hitting /health or /ready) do not each cost a full set of
   * queue.getJobCounts() calls.
   */
  private async checkRedisPing(): Promise<{ ok: boolean; error?: string }> {
    const redis = this.getRedis();
    if (!redis) {
      return { ok: false, error: 'Redis client could not be initialized' };
    }
    try {
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      const pong = await redis.ping();
      if (pong !== 'PONG') {
        return { ok: false, error: `Unexpected PING response: ${pong}` };
      }
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message };
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
      this.redis = null;
    }
  }
}
