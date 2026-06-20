import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Observable, Subject, filter, map, merge, interval } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import Redis from 'ioredis';

const AGENT_SSE_CHANNEL = 'agent:sse:events';

type BusMessage = {
  organizationId: string;
  event: Record<string, unknown>;
};

@Injectable()
export class L5EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(L5EventBusService.name);
  private readonly localStream = new Subject<BusMessage>();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;

  onModuleInit(): void {
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    try {
      if (redisUrl) {
        const url = new URL(redisUrl);
        const options = {
          host: url.hostname,
          port: parseInt(url.port || '6379', 10),
          password: decodeURIComponent(url.password),
          maxRetriesPerRequest: null,
          tls: url.protocol === 'rediss:' ? {} : undefined,
          lazyConnect: true,
        };
        this.publisher = new Redis(options);
        this.subscriber = new Redis(options);
      } else {
        this.publisher = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });
        this.subscriber = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });
      }

      void this.subscriber
        .connect()
        .then(() => this.subscriber?.subscribe(AGENT_SSE_CHANNEL))
        .catch((error) => {
          this.logger.warn(`Agent SSE Redis subscribe failed: ${error}`);
        });

      this.subscriber?.on('message', (_channel, payload) => {
        try {
          const parsed = JSON.parse(payload) as BusMessage;
          if (parsed?.organizationId && parsed.event) {
            this.localStream.next(parsed);
          }
        } catch (error) {
          this.logger.warn(`Invalid agent SSE Redis payload: ${error}`);
        }
      });
    } catch (error) {
      this.logger.warn(`Redis unavailable for agent SSE bus: ${error}`);
      this.publisher = null;
      this.subscriber = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber?.quit();
    await this.publisher?.quit();
  }

  /** Emits org-scoped events for SSE clients. Includes keepalive pings every 30s. */
  events$(organizationId: string): Observable<MessageEvent> {
    const data = this.localStream.asObservable().pipe(
      filter((e) => e.organizationId === organizationId),
      map((e) => ({ data: e.event }) as MessageEvent),
    );
    const pings = interval(30_000).pipe(
      map(
        () =>
          ({
            data: { type: 'ping', ts: new Date().toISOString() },
          }) as MessageEvent,
      ),
    );
    return merge(data, pings);
  }

  emit(organizationId: string, event: Record<string, unknown>): void {
    const message: BusMessage = { organizationId, event };
    this.localStream.next(message);

    if (!this.publisher) return;

    void (async () => {
      try {
        if (this.publisher?.status !== 'ready') {
          await this.publisher?.connect();
        }
        await this.publisher?.publish(
          AGENT_SSE_CHANNEL,
          JSON.stringify(message),
        );
      } catch (error) {
        this.logger.warn(`Failed to publish agent SSE event: ${error}`);
      }
    })();
  }
}
