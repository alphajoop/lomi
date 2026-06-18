import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhookSenderService } from '../webhook-sender.service';
import { sanitizeMerchantWebhookTransactionPayload } from '../sanitize-merchant-webhook-transaction-payload';
import { WebhookEvent } from '../../utils/types/api';

@Injectable()
export class WebhookListener {
  private readonly logger = new Logger(WebhookListener.name);

  constructor(
    private readonly webhookSender: WebhookSenderService,
    @InjectQueue('webhooks') private readonly webhookQueue: Queue,
  ) {}

  @OnEvent('PAYMENT_SUCCEEDED')
  async handlePaymentSucceeded(payload: any) {
    this.logger.log(
      `Handling PAYMENT_SUCCEEDED event for transaction ${payload.id}`,
    );
    sanitizeMerchantWebhookTransactionPayload(
      payload as Record<string, unknown>,
    );
    await this.queueWebhook(
      payload.organization_id,
      'PAYMENT_SUCCEEDED',
      payload,
    );
  }

  @OnEvent('PAYMENT_FAILED')
  async handlePaymentFailed(payload: any) {
    this.logger.log(
      `Handling PAYMENT_FAILED event for transaction ${payload.id}`,
    );
    sanitizeMerchantWebhookTransactionPayload(
      payload as Record<string, unknown>,
    );
    await this.queueWebhook(payload.organization_id, 'PAYMENT_FAILED', payload);
  }

  @OnEvent('REFUND_CREATED')
  async handleRefundCreated(payload: any) {
    this.logger.log(`Handling REFUND_CREATED event for refund ${payload.id}`);
    await this.queueWebhook(payload.organization_id, 'REFUND_CREATED', payload);
  }

  @OnEvent('REFUND_COMPLETED')
  async handleRefundCompleted(payload: any) {
    this.logger.log(`Handling REFUND_COMPLETED event for refund ${payload.id}`);
    await this.queueWebhook(
      payload.organization_id,
      'REFUND_COMPLETED',
      payload,
    );
  }

  @OnEvent('REFUND_FAILED')
  async handleRefundFailed(payload: any) {
    this.logger.log(`Handling REFUND_FAILED event for refund ${payload.id}`);
    await this.queueWebhook(payload.organization_id, 'REFUND_FAILED', payload);
  }

  @OnEvent('SUBSCRIPTION_CREATED')
  async handleSubscriptionCreated(payload: any) {
    this.logger.log(
      `Handling SUBSCRIPTION_CREATED event for subscription ${payload.id}`,
    );
    await this.queueWebhook(
      payload.organization_id,
      'SUBSCRIPTION_CREATED',
      payload,
    );
  }

  @OnEvent('SUBSCRIPTION_UPDATED')
  async handleSubscriptionUpdated(payload: any) {
    this.logger.log(
      `Handling SUBSCRIPTION_UPDATED event for subscription ${payload.id}`,
    );
    await this.queueWebhook(
      payload.organization_id,
      'SUBSCRIPTION_UPDATED',
      payload,
    );
  }

  @OnEvent('SUBSCRIPTION_RENEWED')
  async handleSubscriptionRenewed(payload: any) {
    this.logger.log(
      `Handling SUBSCRIPTION_RENEWED event for subscription ${payload.id}`,
    );
    await this.queueWebhook(
      payload.organization_id,
      'SUBSCRIPTION_RENEWED',
      payload,
    );
  }

  @OnEvent('USAGE_RECORDED')
  async handleUsageRecorded(payload: any) {
    this.logger.log(`Handling USAGE_RECORDED event ${payload.id}`);
    await this.queueWebhook(payload.organization_id, 'USAGE_RECORDED', payload);
  }

  @OnEvent('USAGE_INVOICE_CREATED')
  async handleUsageInvoiceCreated(payload: any) {
    await this.queueWebhook(
      payload.organization_id,
      'USAGE_INVOICE_CREATED',
      payload,
    );
  }

  @OnEvent('USAGE_INVOICE_PAID')
  async handleUsageInvoicePaid(payload: any) {
    await this.queueWebhook(
      payload.organization_id,
      'USAGE_INVOICE_PAID',
      payload,
    );
  }

  @OnEvent('USAGE_INVOICE_OVERDUE')
  async handleUsageInvoiceOverdue(payload: any) {
    await this.queueWebhook(
      payload.organization_id,
      'USAGE_INVOICE_OVERDUE',
      payload,
    );
  }

  @OnEvent('SUBSCRIPTION_USAGE_PERIOD_CLOSED')
  async handleUsagePeriodClosed(payload: any) {
    await this.queueWebhook(
      payload.organization_id,
      'SUBSCRIPTION_USAGE_PERIOD_CLOSED',
      payload,
    );
  }

  @OnEvent('SUBSCRIPTION_CANCELLED')
  async handleSubscriptionCanceled(payload: any) {
    this.logger.log(
      `Handling SUBSCRIPTION_CANCELLED event for subscription ${payload.id}`,
    );
    await this.queueWebhook(
      payload.organization_id,
      'SUBSCRIPTION_CANCELLED',
      payload,
    );
  }

  private async queueWebhook(
    organizationId: string,
    event: WebhookEvent,
    data: any,
  ) {
    try {
      // Try to queue webhooks via Redis (async, with retries)
      await this.webhookSender.queueWebhooksForOrganization(
        organizationId,
        event,
        data,
        this.webhookQueue,
      );
    } catch (error: any) {
      // Redis unavailable - fall back to synchronous sending
      this.logger.warn(
        `Redis queue unavailable, falling back to sync webhook dispatch: ${error.message}`,
      );
      try {
        await this.webhookSender.notifyOrganization(
          organizationId,
          event,
          data,
        );
      } catch (syncError: any) {
        this.logger.error(
          `Failed to send webhooks synchronously: ${syncError.message}`,
        );
      }
    }
  }
}
