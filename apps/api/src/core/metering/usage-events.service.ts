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
    const jobId = `usage:${user.organizationId}:${dto.transaction_id}`;

    if (!this.meteringQueue) {
      return this.processEvent(id, user.organizationId);
    }

    try {
      await this.meteringQueue.add(
        'process-usage-event',
        {
          eventId: id,
          organizationId: user.organizationId,
          customerId: dto.customer_id,
          code: dto.code,
        },
        {
          jobId,
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      );
    } catch (queueError: unknown) {
      const message =
        queueError instanceof Error ? queueError.message : String(queueError);
      this.logger.warn(
        `Metering queue unavailable, processing synchronously: ${message}`,
      );
      return this.processEvent(id, user.organizationId);
    }

    return {
      event_id: id,
      status: 'pending',
    };
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
