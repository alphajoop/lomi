import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { randomUUID } from 'node:crypto';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { CreateWebhookBodyDto } from './dto/create-webhook-body.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { AuthContext } from '../core/common/decorators/current-user.decorator';
import { Database } from '../utils/types/api';
import {
  deliverMerchantWebhook,
  resolveSafeMerchantWebhookTarget,
  UnsafeWebhookUrlError,
} from './merchant-webhook-url';
import { WebhookEvent } from '../utils/types/api';
import { WebhookSenderService, type Webhook } from './webhook-sender.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly supabase: SupabaseService,
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
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return row;
    }
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
      Database['public']['Enums']['webhook_event'][] | null | undefined =
      undefined;
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
    const webhookRow = (await this.findOne(id, user)) as Record<
      string,
      unknown
    >;
    const url = String(webhookRow.url ?? '');
    const verificationToken = String(webhookRow.verification_token ?? '');
    const organizationId = String(webhookRow.organization_id ?? '');

    if (!url || !verificationToken) {
      throw new InternalServerErrorException('Webhook configuration error');
    }

    const eventId = randomUUID();
    const timestamp = new Date().toISOString();
    const testPayload = {
      id: `evt_test_${eventId}`,
      type: 'test.webhook',
      created: timestamp,
      data: {
        object: {
          id: `obj_test_${randomUUID()}`,
          merchant_id: user.merchantId,
          organization_id: organizationId,
          test: true,
          created: timestamp,
          status: 'success',
          amount: 1000,
          currency: 'XOF',
          description: 'Simple test webhook event',
          metadata: {
            test_mode: true,
            webhook_id: id,
            source: 'webhook_test',
          },
        },
      },
      livemode: (user.environment ?? 'live') !== 'test',
      webhook_id: id,
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac('sha256', verificationToken)
      .update(payloadString)
      .digest('hex');

    const webhookHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Lomi-Webhook/1.0',
      'X-Lomi-Signature': signature,
      'X-Lomi-Event': 'test.webhook',
      'X-Lomi-Timestamp': timestamp,
    };

    const requestStartTime = Date.now();
    let responseStatus: number;
    let responseBody: string;
    let deliveredUrl = url;

    try {
      const delivery = await deliverMerchantWebhook(
        url,
        payloadString,
        webhookHeaders,
      );
      responseStatus = delivery.status;
      responseBody =
        typeof delivery.data === 'string'
          ? delivery.data
          : JSON.stringify(delivery.data);
      deliveredUrl = delivery.deliveredUrl;
    } catch (error) {
      responseStatus = 502;
      responseBody =
        error instanceof Error ? error.message : 'Webhook delivery failed';
    }

    const requestDurationMs = Date.now() - requestStartTime;

    await this.supabase.rpc(
      'update_webhook_delivery_status' as never,
      {
        p_webhook_id: id,
        p_last_response_status: responseStatus,
        p_last_response_body: responseBody,
        p_last_payload: testPayload,
      } as never,
    );

    const { data: logData, error: logError } = await this.supabase.rpc(
      'log_webhook_delivery' as never,
      {
        p_webhook_id: id,
        p_merchant_id: user.merchantId,
        p_organization_id: organizationId,
        p_event_type: 'test.webhook',
        p_payload: testPayload,
        p_response_status: responseStatus,
        p_response_body: responseBody,
        p_attempt_number: 1,
        p_headers: webhookHeaders,
        p_request_duration_ms: requestDurationMs,
        p_ip_address: 'api',
        p_user_agent: 'Lomi-Webhook/1.0',
      } as never,
    );

    if (logError) {
      throw new BadRequestException(
        `Webhook test delivery logged with error: ${logError.message}`,
      );
    }

    const success = responseStatus >= 200 && responseStatus < 300;
    if (!success) {
      throw new BadRequestException(
        responseBody ||
          (responseStatus
            ? `Webhook endpoint returned HTTP ${responseStatus}`
            : 'Webhook test delivery failed'),
      );
    }

    return {
      success,
      status: responseStatus,
      response: responseBody.substring(0, 500),
      delivered_url: deliveredUrl,
      log_id: logData,
    };
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
