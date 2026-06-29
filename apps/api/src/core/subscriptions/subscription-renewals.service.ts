import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import Stripe from 'stripe';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { StripeClientsService } from '../../utils/stripe/stripe-clients.service';
import { Json } from '../../utils/types/api';
import { safeBullJobId } from '../../utils/bullmq/job-id';

type RenewalDunningResult = {
  retries_exhausted: boolean;
  renewal_failure_count: number;
  total_retries: number;
  next_renewal_retry_at: string | null;
};

type DueSubscription = {
  subscription_id: string;
  organization_id: string;
  customer_email: string;
  next_billing_date: string;
  price_amount: number;
  price_currency_code: string;
  provider_customer_id: string | null;
  provider_payment_method_id: string | null;
  environment: string;
};

export type RenewalResult = {
  subscription_id: string;
  status: string;
  error: string | null;
};

@Injectable()
export class SubscriptionRenewalsService {
  private readonly logger = new Logger(SubscriptionRenewalsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly stripeClients: StripeClientsService,
    @Optional()
    @InjectQueue('subscription-renewals')
    private readonly renewalsQueue: Queue | null,
  ) {}

  async runRenewals(dueDate?: string) {
    const todayStr = dueDate ?? new Date().toISOString().split('T')[0]!;

    if (this.renewalsQueue) {
      const job = await this.renewalsQueue.add(
        'run-subscription-renewals',
        { dueDate: todayStr },
        {
          jobId: safeBullJobId(`subscription-renewals:${todayStr}`),
          attempts: 2,
          backoff: { type: 'exponential', delay: 10000 },
        },
      );
      return { queued: true, job_id: job.id, due_date: todayStr };
    }

    return this.executeRenewals(todayStr);
  }

  async executeRenewals(dueDate: string) {
    this.logger.log(`Starting subscription renewal process for ${dueDate}`);

    const { data: dueSubs, error: subError } = await this.supabase.rpc(
      'get_active_subscriptions_for_renewal',
      { p_due_date: dueDate },
    );

    if (subError) {
      throw new Error(`Error fetching subscriptions: ${subError.message}`);
    }

    const subs = (dueSubs ?? []) as DueSubscription[];
    this.logger.log(`Found ${subs.length} subscriptions due for renewal`);

    const results: RenewalResult[] = [];

    for (const sub of subs) {
      results.push(await this.processSubscription(sub));
    }

    return {
      success: true,
      processed_count: results.length,
      results,
    };
  }

  private async processSubscription(
    sub: DueSubscription,
  ): Promise<RenewalResult> {
    const result: RenewalResult = {
      subscription_id: sub.subscription_id,
      status: 'pending',
      error: null,
    };

    try {
      const billingDate = sub.next_billing_date;

      const { data: alreadyProcessed, error: idempotencyError } =
        await this.supabase.rpc('subscription_renewal_already_processed', {
          p_subscription_id: sub.subscription_id,
          p_billing_date: billingDate,
        });

      if (idempotencyError) {
        throw new Error(idempotencyError.message);
      }

      if (alreadyProcessed) {
        result.status = 'skipped';
        return result;
      }

      if (!sub.provider_customer_id || !sub.provider_payment_method_id) {
        this.logger.log(
          `Missing Stripe credentials for ${sub.subscription_id}, falling back to manual renewal`,
        );
        await this.supabase.rpc(
          'fallback_subscription_renewal_to_manual_checkout',
          {
            p_subscription_id: sub.subscription_id,
          },
        );
        result.status = 'fallback_manual';
        return result;
      }

      this.logger.log(
        `Processing renewal for subscription ${sub.subscription_id} (${sub.customer_email})`,
      );

      const amountMinor = Math.round(sub.price_amount);
      const toCurrency = sub.price_currency_code.toLowerCase();

      const { data: conversionData, error: conversionError } =
        await this.supabase.rpc('prepare_stripe_payment_amount', {
          p_amount: amountMinor,
          p_currency: toCurrency,
        });

      const conversionRows = conversionData ?? [];

      if (conversionError || conversionRows.length === 0) {
        throw new Error('Failed to calculate EUR amount');
      }

      const { stripe_amount_cents, stripe_currency } = conversionRows[0]!;

      let stripe: Stripe;
      try {
        stripe = this.stripeClients.getClient(sub.environment);
      } catch (clientErr: unknown) {
        if (clientErr instanceof ServiceUnavailableException) {
          const message = clientErr.message;
          this.logger.warn(
            `Stripe not configured for environment "${sub.environment}" on subscription ${sub.subscription_id}: ${message}`,
          );
          result.status = 'skipped_stripe_unconfigured';
          result.error = message;
          return result;
        }
        throw clientErr;
      }

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: stripe_amount_cents,
          currency: stripe_currency,
          customer: sub.provider_customer_id,
          payment_method: sub.provider_payment_method_id,
          off_session: true,
          confirm: true,
          metadata: {
            payment_flow: 'subscription_renewal',
            subscription_id: sub.subscription_id,
            organization_id: sub.organization_id,
            original_currency: sub.price_currency_code,
            original_amount: sub.price_amount.toString(),
            billing_period_end: billingDate,
          },
        },
        {
          idempotencyKey: `${sub.subscription_id}:${billingDate}`,
        },
      );

      if (paymentIntent.status === 'succeeded') {
        const { error: txError } = await this.supabase.rpc(
          'record_subscription_renewal',
          {
            p_subscription_id: sub.subscription_id,
            p_stripe_payment_intent_id: paymentIntent.id,
            p_amount_minor_units: amountMinor,
            p_currency: toCurrency,
            p_status: 'completed',
            p_billing_period_end: billingDate,
          },
        );

        if (txError) {
          this.logger.error(
            `Failed to record transaction for ${sub.subscription_id}: ${txError.message}`,
          );
        }

        result.status = 'succeeded';
        return result;
      }

      result.status = 'failed';
      result.error = `Payment status: ${paymentIntent.status}`;

      const failureOutcome = await this.handleRenewalFailure(
        sub.subscription_id,
        result.error,
        {
          stripePaymentIntentId: paymentIntent.id,
          amountMinor,
          currency: toCurrency,
          billingDate,
        },
      );
      result.status = failureOutcome;
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error processing subscription ${sub.subscription_id}: ${message}`,
      );
      result.error = message;

      const stripePaymentIntentId = this.extractStripePaymentIntentId(err);

      try {
        const failureOutcome = await this.handleRenewalFailure(
          sub.subscription_id,
          message,
          stripePaymentIntentId
            ? {
                stripePaymentIntentId,
                amountMinor: Math.round(sub.price_amount),
                currency: sub.price_currency_code.toLowerCase(),
                billingDate: sub.next_billing_date,
              }
            : undefined,
        );
        result.status = failureOutcome;
      } catch (failureErr: unknown) {
        const failureMessage =
          failureErr instanceof Error ? failureErr.message : String(failureErr);
        result.status = 'error';
        result.error = failureMessage;
      }

      return result;
    }
  }

  private extractStripePaymentIntentId(err: unknown): string | undefined {
    if (!(err instanceof Object)) return undefined;
    if ('payment_intent' in err) {
      const pi = (err as { payment_intent?: { id?: string } | string })
        .payment_intent;
      if (typeof pi === 'object' && pi?.id) return pi.id;
      if (typeof pi === 'string') return pi;
    }
    if (err instanceof Stripe.errors.StripeError && err.payment_intent) {
      const pi = err.payment_intent;
      return typeof pi === 'string' ? pi : pi.id;
    }
    return undefined;
  }

  private async handleRenewalFailure(
    subscriptionId: string,
    error: string,
    recordAttempt?: {
      stripePaymentIntentId: string;
      amountMinor: number;
      currency: string;
      billingDate: string;
    },
  ): Promise<'retry_scheduled' | 'retries_exhausted'> {
    if (recordAttempt) {
      await this.supabase.rpc('record_subscription_renewal', {
        p_subscription_id: subscriptionId,
        p_stripe_payment_intent_id: recordAttempt.stripePaymentIntentId,
        p_amount_minor_units: recordAttempt.amountMinor,
        p_currency: recordAttempt.currency,
        p_status: 'failed',
        p_billing_period_end: recordAttempt.billingDate,
      });
    }

    const { data: dunningResult, error: dunningError } =
      await this.supabase.rpc('handle_subscription_renewal_payment_failure', {
        p_subscription_id: subscriptionId,
        p_error: error,
      });

    if (dunningError) {
      throw new Error(dunningError.message);
    }

    const dunning = dunningResult as RenewalDunningResult | Json | null;

    if (
      dunning &&
      typeof dunning === 'object' &&
      !Array.isArray(dunning) &&
      'retries_exhausted' in dunning &&
      dunning.retries_exhausted === true
    ) {
      await this.supabase.rpc('finalize_subscription_renewal_after_retries', {
        p_subscription_id: subscriptionId,
        p_error: error,
      });
      return 'retries_exhausted';
    }

    return 'retry_scheduled';
  }
}
