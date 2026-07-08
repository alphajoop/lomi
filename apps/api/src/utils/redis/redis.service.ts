import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Shared ioredis client for non-BullMQ cache / registry use.
 * Uses UPSTASH_REDIS_URL when set; otherwise localhost (dev).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private initFailed = false;

  getClient(): Redis | null {
    if (this.client) {
      return this.client;
    }
    if (this.initFailed) {
      return null;
    }

    try {
      const redisUrl = process.env.UPSTASH_REDIS_URL;
      if (redisUrl) {
        const url = new URL(redisUrl);
        this.client = new Redis({
          host: url.hostname,
          port: parseInt(url.port || '6379', 10),
          password: decodeURIComponent(url.password),
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          commandTimeout: 1500,
          tls: url.protocol === 'rediss:' ? {} : undefined,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
      } else {
        this.client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          commandTimeout: 1500,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
      }

      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });

      return this.client;
    } catch (error) {
      this.initFailed = true;
      this.logger.warn(`Redis client init failed: ${error}`);
      return null;
    }
  }

  private async ensureConnected(client: Redis): Promise<boolean> {
    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) {
      return null;
    }

    try {
      if (!(await this.ensureConnected(client))) {
        return null;
      }
      return await client.get(key);
    } catch (error) {
      this.logger.warn(
        `Redis GET failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async setex(
    key: string,
    ttlSeconds: number,
    value: string,
  ): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return false;
    }

    try {
      if (!(await this.ensureConnected(client))) {
        return false;
      }
      await client.setex(key, ttlSeconds, value);
      return true;
    } catch (error) {
      this.logger.warn(
        `Redis SETEX failed: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
    }
  }
}
