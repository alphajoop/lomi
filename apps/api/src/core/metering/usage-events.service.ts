import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { Json } from '../../utils/types/api';
import { CreateUsageEventDto } from './dto/create-usage-event.dto';
import { CreateUsageSubscriptionDto } from './dto/create-usage-subscription.dto';
import { ListUsageEventsQueryDto } from './dto/list-usage-events-query.dto';
import { safeBullJobId } from '../../utils/bullmq/job-id';

@Injectable()
export class UsageEventsService {
  private readonly logger = new Logger(UsageEventsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    @Optional()
    @InjectQueue('metering')
    private readonly meteringQueue: Queue | null,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async ingest(dto: CreateUsageEventDto, user: AuthContext) {
    const { data: eventId, error } = await this.supabase.getClient().rpc(
      'enqueue_usage_event' as never,
      {
        p_organization_id: user.organizationId,
        p_customer_id: dto.customer_id,
        p_transaction_id: dto.transaction_id,
        p_code: dto.code,
        p_subscription_id: dto.subscription_id ?? null,
        p_timestamp: dto.timestamp ?? null,
        p_properties: (dto.properties ?? {}) as Json,
        p_quantity: dto.quantity ?? null,
        p_environment: environmentFromAuth(user),
        p_created_by: user.merchantId,
      } as never,
    );

    if (error) throw new Error(error.message);

    const id = eventId as string;
    return this.scheduleProcessing(
      id,
      user.organizationId,
      dto.customer_id,
      dto.code,
    );
  }

  /**
   * Re-enqueue or synchronously process usage events left pending after BullMQ
   * drops or dedupes a job. Called from pg_cron via internal API.
   */
  async reconcileStalePendingEvents(options?: {
    staleAfterSeconds?: number;
    limit?: number;
  }) {
    const { data, error } = await this.supabase.getClient().rpc(
      'list_stale_pending_usage_events' as never,
      {
        p_stale_after_seconds: options?.staleAfterSeconds ?? 30,
        p_limit: options?.limit ?? 50,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (Array.isArray(data) ? data : []) as Array<{
      event_id: string;
      organization_id: string;
      customer_id: string;
      code: string;
    }>;

    let requeued = 0;
    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const outcome = await this.scheduleProcessing(
          row.event_id,
          row.organization_id,
          row.customer_id,
          row.code,
        );
        if (outcome.status === 'pending') {
          requeued += 1;
        } else {
          processed += 1;
        }
      } catch (reconcileError: unknown) {
        const message =
          reconcileError instanceof Error
            ? reconcileError.message
            : String(reconcileError);
        this.logger.warn(
          `Failed to reconcile usage event ${row.event_id}: ${message}`,
        );
        failed += 1;
      }
    }

    return {
      scanned: rows.length,
      requeued,
      processed,
      failed,
    };
  }

  private usageEventJobId(eventId: string): string {
    return safeBullJobId(`usage:event:${eventId}`);
  }

  private async scheduleProcessing(
    eventId: string,
    organizationId: string,
    customerId: string,
    code: string,
  ) {
    if (!this.meteringQueue) {
      return this.processEvent(eventId, organizationId);
    }

    const jobId = this.usageEventJobId(eventId);

    try {
      const job = await this.meteringQueue.add(
        'process-usage-event',
        {
          eventId,
          organizationId,
          customerId,
          code,
        },
        {
          jobId,
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      );

      const state = await job.getState();
      if (state === 'completed' || state === 'failed') {
        return this.ensureProcessedIfPending(eventId, organizationId);
      }
    } catch (queueError: unknown) {
      const message =
        queueError instanceof Error ? queueError.message : String(queueError);
      this.logger.warn(
        `Metering queue unavailable for event ${eventId}, processing synchronously: ${message}`,
      );
      return this.processEvent(eventId, organizationId);
    }

    return {
      event_id: eventId,
      status: 'pending',
    };
  }

  private async ensureProcessedIfPending(
    eventId: string,
    organizationId: string,
  ) {
    const status = await this.fetchProcessingStatus(eventId, organizationId);
    if (status === 'processed' || status === 'failed') {
      return { event_id: eventId, status };
    }

    return this.processEvent(eventId, organizationId);
  }

  private async fetchProcessingStatus(
    eventId: string,
    organizationId: string,
  ): Promise<string | null> {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_usage_event_api' as never,
      {
        p_event_id: eventId,
        p_organization_id: organizationId,
      } as never,
    );

    if (error) throw new Error(error.message);

    const row = data as { processing_status?: string } | null;
    return row?.processing_status ?? null;
  }

  async processEvent(eventId: string, organizationId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .rpc('process_usage_event' as never, { p_event_id: eventId } as never);

    if (error) throw new Error(error.message);

    const result = data as Record<string, unknown>;

    if (result?.status === 'processed' && !result?.idempotent) {
      this.eventEmitter.emit('USAGE_RECORDED', {
        id: eventId,
        organization_id: organizationId,
        meter_id: result.meter_id,
        subscription_id: result.subscription_id,
        quantity_applied: result.quantity_applied,
      });
    }

    return result;
  }

  async createUsageSubscription(
    dto: CreateUsageSubscriptionDto,
    user: AuthContext,
  ) {
    const { data, error } = await this.supabase.getClient().rpc(
      'create_usage_subscription' as never,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_customer_id: dto.customer_id,
        p_product_id: dto.product_id,
        p_price_id: dto.price_id ?? null,
        p_metadata: (dto.metadata ?? {}) as Json,
        p_environment: environmentFromAuth(user),
      } as never,
    );

    if (error) throw new Error(error.message);

    return { subscription_id: data as string };
  }

  async findAll(user: AuthContext, query: ListUsageEventsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 50;
    const offset = (page - 1) * pageSize;

    const { data, error } = await this.supabase.getClient().rpc(
      'list_usage_events_api' as never,
      {
        p_organization_id: user.organizationId,
        p_limit: pageSize,
        p_offset: offset,
        p_customer_id: query.customer_id ?? null,
        p_code: query.code ?? null,
        p_status: query.status ?? null,
        p_environment: environmentFromAuth(user),
      } as never,
    );

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findOne(eventId: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_usage_event_api' as never,
      {
        p_event_id: eventId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) throw new Error(error.message);
    if (!data) {
      throw new NotFoundException(`Usage event ${eventId} not found`);
    }

    return data;
  }
}
