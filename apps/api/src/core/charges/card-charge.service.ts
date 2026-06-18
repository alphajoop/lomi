import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { normalizePaymentEnvironment } from '../../utils/payment-environment';
import { StripeClientsService } from '../../utils/stripe/stripe-clients.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import {
  buildNetworkProviderMetadata,
  assertNetworkContextRecorded,
  isNetworkRequest,
  recordNetworkContext,
  resolveNetworkMemberMerchantId,
} from '../common/network-context';
import { CreateCardChargeDto } from './dto/create-card-charge.dto';
import {
  attachChargeNextAction,
  deriveCardChargeNextAction,
} from './charge-next-action';
import {
  assertOptionalUuid,
  assertCardChargeReconciliationInput,
} from './dto/assert-card-charge-reconciliation';

type StripeTheme = 'stripe' | 'night' | 'flat';
type LomiTheme = 'light' | 'dark' | 'flat';

function toStripeTheme(
  theme?: CreateCardChargeDto['appearance_theme'],
): StripeTheme | undefined {
  if (!theme) return undefined;
  if (theme === 'light' || theme === 'stripe') return 'stripe';
  if (theme === 'dark' || theme === 'night') return 'night';
  return 'flat';
}

function toLomiTheme(
  theme?: CreateCardChargeDto['appearance_theme'],
): LomiTheme | undefined {
  if (!theme) return undefined;
  if (theme === 'light' || theme === 'stripe') return 'light';
  if (theme === 'dark' || theme === 'night') return 'dark';
  return 'flat';
}

@Injectable()
export class CardChargeService {
  private readonly logger = new Logger(CardChargeService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly stripeClients: StripeClientsService,
  ) {}

  async create(createDto: CreateCardChargeDto, user: AuthContext) {
    const stripe = this.stripeClients.getClient(user.environment);
    const paymentEnv = normalizePaymentEnvironment(user.environment);

    assertCardChargeReconciliationInput(createDto);
    assertOptionalUuid('product_id', createDto.product_id);
    assertOptionalUuid('subscription_id', createDto.subscription_id);

    const amount = Number(createDto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    const sourceCurrency = (
      createDto.currency_code ||
      createDto.currency ||
      'XOF'
    ).toUpperCase();
    if (!['XOF', 'USD', 'EUR'].includes(sourceCurrency)) {
      throw new BadRequestException(
        `Unsupported currency '${sourceCurrency}'. Use XOF, USD, or EUR.`,
      );
    }

    if (
      createDto.appearance_theme &&
      !['light', 'dark', 'flat', 'stripe', 'night'].includes(
        createDto.appearance_theme,
      )
    ) {
      throw new BadRequestException(
        "appearance_theme must be one of 'light', 'dark', or 'flat'",
      );
    }

    if (
      createDto.appearance_border_radius !== undefined &&
      (!Number.isFinite(Number(createDto.appearance_border_radius)) ||
        Number(createDto.appearance_border_radius) < 0)
    ) {
      throw new BadRequestException(
        'appearance_border_radius must be a non-negative number',
      );
    }

    if (
      createDto.appearance_billing_address !== undefined &&
      !['auto', 'never'].includes(createDto.appearance_billing_address)
    ) {
      throw new BadRequestException(
        "appearance_billing_address must be one of 'auto' or 'never'",
      );
    }

    const ledgerMerchantId = isNetworkRequest(user)
      ? await resolveNetworkMemberMerchantId(this.supabase, user)
      : user.merchantId;

    const resolvedCustomerId = await this.resolveCustomerId(
      createDto,
      user,
      ledgerMerchantId,
    );

    const { data: conversionData, error: conversionError } = await (
      this.supabase.getClient() as any
    ).rpc('prepare_stripe_payment_amount', {
      p_amount: amount,
      p_currency: sourceCurrency,
    });

    if (
      conversionError ||
      !Array.isArray(conversionData) ||
      conversionData.length === 0
    ) {
      this.logger.error({
        message: 'prepare_stripe_payment_amount_failed',
        organization_id: user.organizationId,
        error: conversionError?.message || null,
      });
      throw new BadRequestException('Failed to prepare Stripe payment amount');
    }

    const converted = conversionData[0] as {
      stripe_amount_cents: number;
      stripe_currency: string;
      original_amount_xof: number;
    };

    const metadata = this.buildMetadata(
      createDto,
      user,
      ledgerMerchantId,
      sourceCurrency,
      amount,
      resolvedCustomerId,
      converted,
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: converted.stripe_amount_cents,
      currency: converted.stripe_currency,
      payment_method_types: ['card'],
      description: createDto.description || undefined,
      metadata,
    });

    const transactionId = await this.createPendingTransaction(
      createDto,
      user,
      ledgerMerchantId,
      paymentEnv,
      sourceCurrency,
      amount,
      resolvedCustomerId,
      paymentIntent.id,
    );

    const networkContext = await recordNetworkContext(this.supabase, user, {
      transactionId,
      amount,
      currencyCode: sourceCurrency,
      capabilityKey: 'payment.create',
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        source: 'api_charge_card',
      },
    });
    assertNetworkContextRecorded(user, networkContext, 'card charge');

    const data = {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      original_amount: amount,
      original_currency: sourceCurrency,
      status: paymentIntent.status,
      appearance:
        createDto.appearance_theme !== undefined ||
        createDto.appearance_border_radius !== undefined ||
        createDto.appearance_billing_address !== undefined
          ? {
              theme: toLomiTheme(createDto.appearance_theme),
              border_radius:
                createDto.appearance_border_radius !== undefined
                  ? Number(createDto.appearance_border_radius)
                  : undefined,
              billing_address: createDto.appearance_billing_address,
            }
          : undefined,
    };
    return attachChargeNextAction(
      { success: true, data },
      deriveCardChargeNextAction(data),
    );
  }

  async findOne(paymentIntentId: string, user: AuthContext) {
    const stripe = this.stripeClients.getClient(user.environment);

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Payment intent not found';
      throw new NotFoundException(message);
    }

    const { data: txJson, error: txError } = await this.supabase
      .getClient()
      .rpc(
        'get_transaction_by_stripe_intent' as never,
        {
          p_payment_intent_id: paymentIntentId,
        } as never,
      );

    if (txError) {
      this.logger.warn({
        message: 'get_transaction_by_stripe_intent_failed',
        payment_intent_id: paymentIntentId,
        error: txError.message,
      });
    }

    const transaction =
      txJson && typeof txJson === 'object'
        ? (txJson as Record<string, unknown>)
        : null;

    if (transaction) {
      const orgId = transaction.organization_id as string | undefined;
      const merchantId = transaction.merchant_id as string | undefined;
      if (orgId && orgId !== user.organizationId) {
        throw new ForbiddenException('Access denied to this payment intent');
      }
      if (
        merchantId &&
        !isNetworkRequest(user) &&
        merchantId !== user.merchantId
      ) {
        throw new ForbiddenException('Access denied to this payment intent');
      }
      if (merchantId && isNetworkRequest(user)) {
        const memberMerchantId = await resolveNetworkMemberMerchantId(
          this.supabase,
          user,
        );
        if (merchantId !== memberMerchantId) {
          throw new ForbiddenException('Access denied to this payment intent');
        }
      }
    }

    const meta = paymentIntent.metadata ?? {};
    const originalAmount = meta.original_amount
      ? Number(meta.original_amount)
      : undefined;
    const originalCurrency = meta.original_currency;

    return {
      success: true,
      data: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        original_amount: originalAmount,
        original_currency: originalCurrency,
        status: paymentIntent.status,
        transaction: transaction
          ? {
              transaction_id: transaction.transaction_id,
              status: transaction.status,
            }
          : null,
      },
    };
  }

  async cancel(paymentIntentId: string, user: AuthContext) {
    await this.findOne(paymentIntentId, user);
    const stripe = this.stripeClients.getClient(user.environment);
    const canceled = await stripe.paymentIntents.cancel(paymentIntentId);
    return {
      success: true,
      data: {
        id: canceled.id,
        status: canceled.status,
      },
    };
  }

  /**
   * Aligns internal customer row with webhook reconciliation: use explicit id
   * or create/find via RPC before any Stripe call.
   */
  private async resolveCustomerId(
    createDto: CreateCardChargeDto,
    user: AuthContext,
    ledgerMerchantId: string = user.merchantId,
  ): Promise<string> {
    const trimmedId = createDto.customer_id?.trim();
    if (trimmedId) {
      return trimmedId;
    }

    const email = createDto.customer_email!.trim();
    const name = createDto.customer_name!.trim();

    const { data: custId, error } = await this.supabase.getClient().rpc(
      'create_or_update_customer' as any,
      {
        p_merchant_id: ledgerMerchantId,
        p_organization_id: user.organizationId,
        p_name: name,
        p_email: email,
        p_phone_number: createDto.customer_phone?.trim() || '',
        p_city: '',
        p_address: '',
        p_country: 'CI',
        p_postal_code: '',
        p_whatsapp_number: createDto.customer_phone?.trim() || '',
      } as any,
    );

    if (error || !custId) {
      this.logger.error({
        message: 'create_or_update_customer_failed',
        organization_id: user.organizationId,
        error: error?.message ?? null,
      });
      throw new BadRequestException(
        'Unable to resolve customer for reconciliation. Verify customer_email and customer_name.',
      );
    }

    return custId as string;
  }

  private buildMetadata(
    createDto: CreateCardChargeDto,
    user: AuthContext,
    ledgerMerchantId: string,
    sourceCurrency: string,
    amount: number,
    resolvedCustomerId: string,
    converted: {
      stripe_amount_cents: number;
      stripe_currency: string;
      original_amount_xof: number;
    },
  ): Stripe.MetadataParam {
    const baseMetadata: Record<string, string> = {
      organization_id: user.organizationId,
      merchant_id: ledgerMerchantId,
      environment: user.environment || 'live',
      source: 'api_charge_card',
      original_currency: sourceCurrency,
      original_amount: String(amount),
      customer_id: resolvedCustomerId,
      /** XOF-equivalent / internal conversion output from prepare_stripe_payment_amount. */
      original_amount_xof: String(converted.original_amount_xof),
      stripe_amount_cents: String(converted.stripe_amount_cents),
      stripe_charge_currency: converted.stripe_currency,
      ...buildNetworkProviderMetadata(user),
    };

    if (createDto.payment_reference) {
      baseMetadata.payment_reference = createDto.payment_reference;
    }
    if (createDto.customer_email) {
      baseMetadata.customer_email = createDto.customer_email;
    }
    if (createDto.customer_name) {
      baseMetadata.customer_name = createDto.customer_name;
    }
    if (createDto.customer_phone) {
      baseMetadata.customer_phone = createDto.customer_phone;
    }
    if (createDto.product_id) {
      baseMetadata.product_id = createDto.product_id;
    }
    if (createDto.subscription_id) {
      baseMetadata.subscription_id = createDto.subscription_id;
    }
    if (createDto.appearance_theme) {
      baseMetadata.appearance_theme = toStripeTheme(
        createDto.appearance_theme,
      )!;
      baseMetadata.appearance_theme_alias = toLomiTheme(
        createDto.appearance_theme,
      )!;
    }
    if (createDto.appearance_border_radius !== undefined) {
      baseMetadata.appearance_border_radius = String(
        createDto.appearance_border_radius,
      );
    }
    if (createDto.appearance_billing_address) {
      baseMetadata.appearance_billing_address =
        createDto.appearance_billing_address;
    }

    if (createDto.metadata) {
      for (const [key, value] of Object.entries(createDto.metadata)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'string') {
          baseMetadata[key] = value;
        } else if (
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          typeof value === 'bigint'
        ) {
          baseMetadata[key] = String(value);
        } else {
          baseMetadata[key] = JSON.stringify(value);
        }
      }
    }

    return baseMetadata;
  }

  private async createPendingTransaction(
    createDto: CreateCardChargeDto,
    user: AuthContext,
    ledgerMerchantId: string,
    paymentEnv: ReturnType<typeof normalizePaymentEnvironment>,
    sourceCurrency: string,
    merchantChargeAmount: number,
    customerId: string,
    paymentIntentId: string,
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.getClient().rpc(
        'create_stripe_transaction' as any,
        {
          p_merchant_id: ledgerMerchantId,
          p_organization_id: user.organizationId,
          p_customer_id: customerId,
          p_amount: merchantChargeAmount,
          p_currency_code: sourceCurrency,
          p_provider_transaction_id: paymentIntentId,
          p_product_id: createDto.product_id || null,
          p_subscription_id: createDto.subscription_id || null,
          p_description: createDto.description || null,
          p_metadata: createDto.metadata ?? null,
          p_quantity: createDto.quantity ?? 1,
          p_checkout_session_id: null,
          p_environment: paymentEnv,
        } as any,
      );

      if (error) {
        this.logger.error({
          message: 'create_stripe_transaction_failed',
          organization_id: user.organizationId,
          payment_intent_id: paymentIntentId,
          error: error.message,
        });
        throw new BadRequestException(
          `Failed to register pending transaction: ${error.message}`,
        );
      }

      if (typeof data !== 'string') {
        this.logger.error({
          message: 'create_stripe_transaction_missing_id',
          organization_id: user.organizationId,
          payment_intent_id: paymentIntentId,
        });
        throw new BadRequestException(
          'Failed to register pending transaction: missing transaction id',
        );
      }

      return data;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        message: 'create_stripe_transaction_exception',
        organization_id: user.organizationId,
        payment_intent_id: paymentIntentId,
        error: message,
      });
      throw new BadRequestException(
        'Failed to register pending transaction for reconciliation',
      );
    }
  }
}
