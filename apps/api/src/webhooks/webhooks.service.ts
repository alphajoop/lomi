import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { CreateWebhookBodyDto } from './dto/create-webhook-body.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { AuthContext } from '../core/common/decorators/current-user.decorator';
import { Database } from '../utils/types/api';
import {
  resolveSafeMerchantWebhookTarget,
  UnsafeWebhookUrlError,
} from './merchant-webhook-url';
import { WebhookEvent } from '../utils/types/api';
import { WebhookSenderService, type Webhook } from './webhook-sender.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService,
    private readonly webhookSender: WebhookSenderService,
  ) {}

  private normalizeEvents(
    events: string | string[],
  ): Database['public']['Enums']['webhook_event'][] {
    const list = typeof events === 'string' ? [events] : events;
    if (!list?.length) {
      throw new BadRequestException('authorized_events is required');
    }
    return list as Database['public']['Enums']['webhook_event'][];
  }

  mapWebhookRow(row: Record<string, unknown>) {
    return {
      ...row,
      id: row.webhook_id ?? row.id,
      events: row.authorized_events ?? row.events,
      active: row.is_active ?? row.active,
    };
  }

  stripSecret<T extends Record<string, unknown>>(row: T): T {
    const { verification_token: _removed, ...rest } = row;
    return rest as T;
  }

  private async assertSafeWebhookUrl(url: string): Promise<void> {
    try {
      await resolveSafeMerchantWebhookTarget(url);
    } catch (error) {
      const message =
        error instanceof UnsafeWebhookUrlError
          ? error.message
          : 'Invalid webhook URL';
      throw new BadRequestException(message);
    }
  }

  async create(createDto: CreateWebhookBodyDto, user: AuthContext) {
    await this.assertSafeWebhookUrl(createDto.url);
    const authorizedEvents = this.normalizeEvents(createDto.authorized_events);
    const metadata =
      createDto.metadata ??
      (createDto.description ? { description: createDto.description } : null);

    const { data: webhookId, error } = await this.supabase.getClient().rpc(
      'create_webhook' as never,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_url: createDto.url,
        p_authorized_events: authorizedEvents,
        p_metadata: metadata,
        p_environment: user.environment || 'live',
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!webhookId) {
      throw new InternalServerErrorException('Failed to create webhook');
    }

    const row = (await this.findOne(String(webhookId), user)) as Record<
      string,
      unknown
    >;
    const secret = String(row.verification_token ?? '');

    return {
      data: this.stripSecret(this.mapWebhookRow(row)),
      secret,
    };
  }

  async findAll(user: AuthContext) {
    const { data, error } = await this.supabase.rpc(
      'fetch_organization_webhooks',
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_event: null,
        p_is_active: null,
        p_search_term: null,
        p_environment: user.environment || 'live',
      },
    );

    if (error) throw new Error(error.message);
    const rows = (data as Record<string, unknown>[]) || [];
    return rows.map((row) => this.stripSecret(this.mapWebhookRow(row)));
  }

  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.rpc('get_webhook', {
      p_webhook_id: id,
      p_merchant_id: user.merchantId,
    });

    if (error) throw new Error(error.message);
    if (!data || (data as unknown[]).length === 0) {
      throw new NotFoundException('Webhook not found');
    }
    return (data as Record<string, unknown>[])[0];
  }

  async findOneForApi(id: string, user: AuthContext) {
    const row = await this.findOne(id, user);
    return this.stripSecret(this.mapWebhookRow(row as Record<string, unknown>));
  }

  async update(id: string, updateDto: UpdateWebhookDto, user: AuthContext) {
    let authorizedEvents:
      | Database['public']['Enums']['webhook_event'][]
      | null
      | undefined = undefined;
    if (updateDto.authorized_events !== undefined) {
      authorizedEvents = this.normalizeEvents(updateDto.authorized_events);
    }

    const params: Record<string, unknown> = {
      p_webhook_id: id,
      p_merchant_id: user.merchantId,
    };

    if (updateDto.url !== undefined) {
      await this.assertSafeWebhookUrl(updateDto.url);
      params.p_url = updateDto.url;
    }
    if (authorizedEvents !== undefined) {
      params.p_authorized_events = authorizedEvents;
    }
    if (updateDto.is_active !== undefined) {
      params.p_is_active = updateDto.is_active;
    }
    if (updateDto.metadata !== undefined) {
      params.p_metadata = updateDto.metadata;
    }

    const { data: updated, error: updateError } = await this.supabase
      .getClient()
      .rpc('update_webhook', params as never);

    if (updateError) {
      throw new BadRequestException(
        `Failed to update webhook: ${updateError.message}`,
      );
    }
    if (!updated) {
      throw new NotFoundException('Webhook not found or update failed');
    }

    const row = await this.findOne(id, user);
    return this.stripSecret(this.mapWebhookRow(row as Record<string, unknown>));
  }

  async remove(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'delete_webhook' as never,
      {
        p_webhook_id: id,
        p_merchant_id: user.merchantId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Webhook not found');
    }
    return { deleted: true };
  }

  async test(id: string, user: AuthContext) {
    await this.findOne(id, user);

    const projectRef = this.configService.get<string>('SUPABASE_PROJECT_REF');
    const anonKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');
    if (!projectRef || !anonKey) {
      throw new InternalServerErrorException(
        'Webhook test is not configured on this API host',
      );
    }

    const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/test_webhook`;
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        webhook_id: id,
        merchant_id: user.merchantId,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new BadRequestException(
        (body as { message?: string; error?: string }).message ||
          (body as { error?: string }).error ||
          'Webhook test delivery failed',
      );
    }

    return body;
  }

  async retryDelivery(webhookId: string, logId: string, user: AuthContext) {
    const webhookRow = (await this.findOne(webhookId, user)) as Record<
      string,
      unknown
    >;

    const { data: logs, error: logError } = await this.supabase.rpc(
      'get_webhook_delivery_log',
      {
        p_log_id: logId,
        p_merchant_id: user.merchantId,
      },
    );

    if (logError) {
      throw new BadRequestException(logError.message);
    }

    const log = (logs as Record<string, unknown>[] | null)?.[0];
    if (!log || String(log.webhook_id) !== webhookId) {
      throw new NotFoundException('Delivery log not found or retry failed');
    }

    const storedPayload = log.payload as {
      id?: string;
      event: WebhookEvent;
      timestamp?: string;
      data: Record<string, unknown>;
      lomi_environment?: string;
    };

    if (!storedPayload?.event || !storedPayload?.data) {
      throw new BadRequestException('Delivery log payload is invalid');
    }

    const webhook: Webhook = {
      id: String(webhookRow.webhook_id ?? webhookId),
      url: String(webhookRow.url),
      events: (webhookRow.authorized_events ?? []) as WebhookEvent[],
      secret: String(webhookRow.verification_token),
      active: Boolean(webhookRow.is_active ?? true),
      organization_id: String(webhookRow.organization_id),
    };

    const attemptNumber =
      typeof log.attempt_number === 'number' ? log.attempt_number + 1 : 1;

    const result = await this.webhookSender.sendStoredWebhookPayload(
      webhook,
      storedPayload,
      {
        attemptNumber,
        merchantId: user.merchantId,
      },
    );

    if (!result.success) {
      throw new BadRequestException(
        typeof result.lastResponseBody === 'string'
          ? result.lastResponseBody
          : `Webhook retry failed (${result.lastResponseStatus ?? 0})`,
      );
    }

    return {
      delivered: true,
      response_status: result.lastResponseStatus,
      event_id: storedPayload.id,
    };
  }
}
