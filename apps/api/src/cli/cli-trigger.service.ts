import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import type { AuthContext } from '../core/common/decorators/current-user.decorator';
import { WebhookEvent } from '../utils/types/api';
import { CliListenerService } from './cli-listener.service';
import { CliStreamService } from './cli-stream.service';

const SYNTHETIC_EVENTS = new Set<string>([
  'PAYMENT_CREATED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'REFUND_CREATED',
  'REFUND_COMPLETED',
  'REFUND_FAILED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_CANCELLED',
]);

@Injectable()
export class CliTriggerService {
  private readonly logger = new Logger(CliTriggerService.name);

  constructor(
    private readonly listener: CliListenerService,
    private readonly stream: CliStreamService,
    private readonly events: EventEmitter2,
  ) {}

  async trigger(
    user: AuthContext,
    event: string,
    webhookId?: string,
  ): Promise<{ event: string; delivered: boolean; webhook_id?: string }> {
    this.listener.assertListenAllowed(user.environment);

    if (!SYNTHETIC_EVENTS.has(event)) {
      throw new BadRequestException(`Unsupported synthetic event: ${event}`);
    }

    const payload = this.buildSyntheticPayload(user, event as WebhookEvent);

    this.stream.emit(user.organizationId, {
      type: 'webhook',
      organization_id: user.organizationId,
      event,
      payload,
      ts: new Date().toISOString(),
    });

    this.events.emit(event, payload);

    this.logger.log(
      `CLI synthetic event ${event} for org ${user.organizationId}${webhookId ? ` (webhook ${webhookId})` : ''}`,
    );

    return {
      event,
      delivered: true,
      ...(webhookId ? { webhook_id: webhookId } : {}),
    };
  }

  private buildSyntheticPayload(
    user: AuthContext,
    event: WebhookEvent,
  ): Record<string, unknown> {
    const id = `cli_${randomUUID()}`;
    const base = {
      id,
      organization_id: user.organizationId,
      merchant_id: user.merchantId,
      lomi_environment: user.environment,
      synthetic: true,
      created_at: new Date().toISOString(),
    };

    if (event.startsWith('PAYMENT_')) {
      return {
        ...base,
        status: event === 'PAYMENT_SUCCEEDED' ? 'completed' : 'failed',
        gross_amount: 1000,
        currency_code: 'XOF',
        payment_method: 'mobile_money',
      };
    }

    if (event.startsWith('REFUND_')) {
      return {
        ...base,
        status: event === 'REFUND_COMPLETED' ? 'completed' : 'pending',
        amount: 500,
        currency_code: 'XOF',
      };
    }

    return {
      ...base,
      status: 'active',
      plan_name: 'CLI synthetic subscription',
    };
  }
}
