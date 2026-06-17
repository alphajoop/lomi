import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import {
  isNetworkRequest,
  assertNetworkContextRecorded,
  recordNetworkContext,
  recordNetworkOperatorFeeReversal,
  resolveNetworkMemberMerchantId,
} from '../common/network-context';
import { CreateRefundDto } from './dto/create-refund.dto';
import {
  calculateRefundProcessingFee,
  refundFeePercentageForBalanceRpc,
  type RefundFeeConfig,
} from './refund-fees';

import {
  createStripeClient,
  resolveStripeSecretKey,
} from '../../utils/stripe/stripe-keys';
import { environmentFromAuth } from '../common/auth-environment';
import { getMtnCountryConfig } from '../charges/mtn-country';

type TransactionRow = {
  transaction_id: string;
  organization_id: string;
  customer_id: string | null;
  gross_amount: number;
  net_amount: number;
  fee_amount: number;
  currency_code: string;
  provider_code: string;
  payment_method_code: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  environment?: string | null;
  stripe_payment_intent_id?: string | null;
};

type SubscriptionRefundActionResult = {
  applied?: boolean;
  action?: string;
  subscription_id?: string | null;
  previous_status?: string;
  reason?: string;
};

type RpcRefundResult = {
  success?: boolean;
  error?: string;
  refund_id?: string;
  refunded_amount?: number;
  status?: string;
  subscription_action?: SubscriptionRefundActionResult;
};

type BeneficiaryPayoutEdgeResult = {
  payoutId?: string;
  wavePayoutId?: string;
  totalDeduction?: number;
};

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(dto: CreateRefundDto, user: AuthContext) {
    const tx = await this.loadTransaction(
      dto.transaction_id,
      user.organizationId,
    );
    await this.assertNetworkRefundAccess(dto.transaction_id, user);
    this.assertRefundable(tx, dto.amount);

    const gross = Number(tx.gross_amount);
    const isFullRefund = this.resolveIsFullRefund(dto, gross);

    const feeConfig = await this.fetchRefundFeeConfig(
      user.organizationId,
      tx.currency_code,
    );
    const feeAmount = calculateRefundProcessingFee(
      feeConfig,
      dto.amount,
      isFullRefund,
    );
    const feePercentage = refundFeePercentageForBalanceRpc(
      feeConfig,
      dto.amount,
      isFullRefund,
    );
    const refundMerchantId = await resolveNetworkMemberMerchantId(
      this.supabaseService,
      user,
    );

    let result: { refund_id?: string; [key: string]: unknown };

    if (tx.provider_code === 'STRIPE' && tx.payment_method_code === 'CARDS') {
      result = await this.createCardRefund(
        dto,
        user,
        feePercentage,
        refundMerchantId,
      );
    } else if (tx.provider_code === 'WAVE') {
      result = isFullRefund
        ? await this.createMobileMoneyFullRefund(
            dto,
            user,
            tx,
            feePercentage,
            refundMerchantId,
          )
        : await this.createMobileMoneyPartialRefund(
            dto,
            user,
            tx,
            feeAmount,
            feePercentage,
            refundMerchantId,
          );
    } else if (tx.provider_code === 'MTN') {
      result = isFullRefund
        ? await this.createMtnFullRefund(
            dto,
            user,
            tx,
            feePercentage,
            refundMerchantId,
          )
        : await this.createMtnPartialRefund(
            dto,
            user,
            tx,
            feePercentage,
            refundMerchantId,
          );
    } else {
      throw new BadRequestException(
        'Refunds are not supported for this transaction type',
      );
    }

    const networkContext = await recordNetworkContext(
      this.supabaseService,
      user,
      {
        refundId: result.refund_id ?? null,
        amount: dto.amount,
        currencyCode: tx.currency_code,
        capabilityKey: 'refund.create',
        metadata: {
          source: 'api_refund',
          transaction_id: dto.transaction_id,
          refund_type: dto.refund_type ?? null,
        },
      },
    );
    assertNetworkContextRecorded(user, networkContext, 'refund');

    await recordNetworkOperatorFeeReversal(this.supabaseService, user, {
      refundId: result.refund_id ?? null,
      transactionId: dto.transaction_id,
      refundAmount: dto.amount,
      metadata: {
        source: 'api_refund',
        refund_type: dto.refund_type ?? null,
      },
    });

    return result;
  }

  async findAll(
    user: AuthContext,
    status?: string,
    startDate?: string,
    endDate?: string,
    limit = 50,
    offset = 0,
  ) {
    if (isNetworkRequest(user)) {
      const { data, error } = await this.supabaseService.getClient().rpc(
        'fetch_network_refunds_for_api' as never,
        {
          p_network_membership_id: user.networkMembershipId,
          p_status: status ?? null,
          p_start_date: startDate ?? null,
          p_end_date: endDate ?? null,
          p_limit: limit,
          p_offset: offset,
          p_environment: user.environment,
          p_read_scope: this.networkReadScope(user),
        } as never,
      );

      if (error) {
        throw new BadRequestException(error.message);
      }

      return { success: true, data: data ?? [] };
    }

    const { data, error } = await this.supabaseService.getClient().rpc(
      'list_refunds' as never,
      {
        p_organization_id: user.organizationId,
        p_status: status ?? null,
        p_start_date: startDate ?? null,
        p_end_date: endDate ?? null,
        p_limit: limit,
        p_offset: offset,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, data: data ?? [] };
  }

  async findOne(refundId: string, user: AuthContext) {
    if (isNetworkRequest(user)) {
      const { data, error } = await this.supabaseService.getClient().rpc(
        'get_network_refund_for_api' as never,
        {
          p_network_membership_id: user.networkMembershipId,
          p_refund_id: refundId,
          p_environment: user.environment,
          p_read_scope: this.networkReadScope(user),
        } as never,
      );

      if (error) {
        throw new BadRequestException(error.message);
      }

      const rows = Array.isArray(data) ? data : [];
      const row = rows[0];
      if (!row) {
        throw new NotFoundException(
          `Refund with ID ${refundId} not found or access denied`,
        );
      }

      return { success: true, data: row };
    }

    const { data, error } = await this.supabaseService.getClient().rpc(
      'get_refund' as never,
      {
        p_refund_id: refundId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(
        `Refund with ID ${refundId} not found or access denied`,
      );
    }

    return { success: true, data: row };
  }

  private networkReadScope(user: AuthContext): 'all' | 'own' {
    return user.networkCapabilityKey === 'transaction.read' ? 'all' : 'own';
  }

  private resolveIsFullRefund(dto: CreateRefundDto, gross: number): boolean {
    if (dto.refund_type === 'full') return true;
    if (dto.refund_type === 'partial') return false;
    return dto.amount + 0.01 >= gross;
  }

  private resolveSubscriptionActionParam(dto: CreateRefundDto): string {
    return dto.subscription_action ?? 'default';
  }

  private async loadTransaction(
    transactionId: string,
    organizationId: string,
  ): Promise<TransactionRow> {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'get_transaction' as never,
      {
        p_transaction_id: transactionId,
        p_organization_id: organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    const tx = rows[0] as TransactionRow | undefined;
    if (!tx?.transaction_id) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found or access denied`,
      );
    }

    return tx;
  }

  private assertRefundable(tx: TransactionRow, amount: number) {
    if (tx.status !== 'completed') {
      throw new BadRequestException(
        'Only completed transactions can be refunded',
      );
    }
    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }
    if (amount > Number(tx.gross_amount) + 0.01) {
      throw new BadRequestException(
        'Refund amount exceeds transaction gross amount',
      );
    }
  }

  private async assertNetworkRefundAccess(
    transactionId: string,
    user: AuthContext,
  ) {
    if (!isNetworkRequest(user)) {
      return;
    }

    const { data, error } = await this.supabaseService.getClient().rpc(
      'get_network_transaction_for_api' as never,
      {
        p_network_membership_id: user.networkMembershipId,
        p_transaction_id: transactionId,
        p_environment: user.environment,
        p_read_scope: 'own',
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    if (!rows[0]) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found or access denied`,
      );
    }
  }

  private async fetchRefundFeeConfig(
    organizationId: string,
    currencyCode: string,
  ): Promise<RefundFeeConfig> {
    const client = this.supabaseService.getClient();
    const [fullResult, partialResult] = await Promise.all([
      client.rpc(
        'get_effective_other_fee_config' as never,
        {
          p_organization_id: organizationId,
          p_currency_code: currencyCode,
          p_subcategory: 'refund',
        } as never,
      ),
      client.rpc(
        'get_effective_other_fee_config' as never,
        {
          p_organization_id: organizationId,
          p_currency_code: currencyCode,
          p_subcategory: 'partial_refund',
        } as never,
      ),
    ]);

    const pick = (data: unknown) => {
      const row = Array.isArray(data) ? data[0] : data;
      return row as { percentage?: number; fixed_amount?: number } | undefined;
    };

    const fullData = pick(fullResult.data);
    const partialData = pick(partialResult.data);

    return {
      full: {
        percentage: fullData?.percentage ?? 0,
        fixed_amount: fullData?.fixed_amount ?? 0,
      },
      partial: {
        percentage: partialData?.percentage ?? 0,
        fixed_amount: partialData?.fixed_amount ?? 0,
      },
    };
  }

  private async createCardRefund(
    dto: CreateRefundDto,
    user: AuthContext,
    feePercentage: number,
    refundMerchantId: string,
  ) {
    const tx = await this.loadTransactionWithStripeContext(
      dto.transaction_id,
      user.organizationId,
    );

    const useManualFallback =
      this.configService.get<string>('STRIPE_REFUND_FALLBACK_MANUAL') ===
      'true';

    const chargeId = await this.resolveStripeChargeId(tx);
    if (!chargeId) {
      if (useManualFallback) {
        return this.createManualCardRefund(
          dto,
          user,
          feePercentage,
          refundMerchantId,
        );
      }
      throw new BadRequestException(
        'Stripe charge ID not found for this transaction',
      );
    }

    const stripeSecret = resolveStripeSecretKey(
      tx.environment ?? user.environment,
    );
    if (!stripeSecret) {
      if (useManualFallback) {
        return this.createManualCardRefund(
          dto,
          user,
          feePercentage,
          refundMerchantId,
        );
      }
      throw new InternalServerErrorException('Stripe is not configured');
    }

    const stripe = createStripeClient(stripeSecret);
    const refundCents = this.computeStripeRefundCents(
      dto.amount,
      Number(tx.gross_amount),
      tx.metadata,
    );

    let stripeRefund;
    try {
      stripeRefund = await stripe.refunds.create({
        charge: chargeId,
        amount: refundCents,
        reason: 'requested_by_customer',
        metadata: {
          refund_id: '',
          transaction_id: dto.transaction_id,
          organization_id: user.organizationId,
          refunded_by: 'merchant_api',
        },
      });
    } catch (error) {
      if (useManualFallback) {
        return this.createManualCardRefund(
          dto,
          user,
          feePercentage,
          refundMerchantId,
        );
      }
      throw this.mapStripeRefundError(error);
    }

    const { data, error } = await this.supabaseService.getClient().rpc(
      'create_stripe_card_refund_api' as never,
      {
        p_merchant_id: refundMerchantId,
        p_organization_id: user.organizationId,
        p_transaction_id: dto.transaction_id,
        p_refund_amount: dto.amount,
        p_processing_fee_percentage: feePercentage,
        p_reason: dto.reason ?? null,
        p_stripe_refund_id: stripeRefund.id,
        p_stripe_charge_id: chargeId,
        p_subscription_action: this.resolveSubscriptionActionParam(dto),
      } as never,
    );

    if (error) {
      this.logger.error(
        `create_stripe_card_refund_api failed after Stripe refund ${stripeRefund.id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Refund initiated in Stripe but ledger update failed; webhook will reconcile',
      );
    }

    const result = data as RpcRefundResult;

    if (!result?.success) {
      this.logger.error(
        `create_stripe_card_refund_api returned failure after Stripe refund ${stripeRefund.id}: ${result?.error ?? 'unknown'}`,
      );
      throw new InternalServerErrorException(
        result?.error ??
          'Refund initiated in Stripe but ledger update failed; webhook will reconcile',
      );
    }

    return {
      success: true,
      refund_id: result.refund_id,
      transaction_id: dto.transaction_id,
      refunded_amount: result.refunded_amount ?? dto.amount,
      status: result.status ?? 'completed',
      message: 'Refund processed successfully.',
      subscription_action: result.subscription_action,
      stripe_refund_id: stripeRefund.id,
    };
  }

  private async createManualCardRefund(
    dto: CreateRefundDto,
    user: AuthContext,
    feePercentage: number,
    refundMerchantId: string,
  ) {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'create_manual_refund_request_api' as never,
      {
        p_merchant_id: refundMerchantId,
        p_organization_id: user.organizationId,
        p_transaction_id: dto.transaction_id,
        p_refund_amount: dto.amount,
        p_processing_fee_percentage: feePercentage,
        p_reason: dto.reason ?? null,
        p_subscription_action: this.resolveSubscriptionActionParam(dto),
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const result = data as RpcRefundResult;

    if (!result?.success) {
      throw new BadRequestException(
        result?.error ?? 'Failed to create card refund',
      );
    }

    return {
      success: true,
      refund_id: result.refund_id,
      transaction_id: dto.transaction_id,
      refunded_amount: result.refunded_amount ?? dto.amount,
      status: result.status ?? 'completed',
      message: 'Refund recorded. Customer credit is processed by our team.',
      subscription_action: result.subscription_action,
      fallback: 'manual',
    };
  }

  private async loadTransactionWithStripeContext(
    transactionId: string,
    organizationId: string,
  ): Promise<TransactionRow> {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'get_transaction' as never,
      {
        p_transaction_id: transactionId,
        p_organization_id: organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    const tx = rows[0] as TransactionRow | undefined;
    if (!tx?.transaction_id) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found or access denied`,
      );
    }

    const { data: providerRows } = await this.supabaseService
      .getClient()
      .from('providers_transactions' as never)
      .select('provider_transaction_id' as never)
      .eq('transaction_id' as never, transactionId as never)
      .eq('provider_code' as never, 'STRIPE' as never)
      .limit(1);

    const providerChargeId = (
      providerRows as { provider_transaction_id?: string }[] | null
    )?.[0]?.provider_transaction_id;

    const metadata = (tx.metadata ?? {}) as Record<string, unknown>;
    if (!metadata.stripe_charge_id && providerChargeId) {
      metadata.stripe_charge_id = providerChargeId;
    }
    tx.metadata = metadata;

    return tx;
  }

  private async resolveStripeChargeId(
    tx: TransactionRow,
  ): Promise<string | null> {
    const metadata = tx.metadata ?? {};
    if (typeof metadata.stripe_charge_id === 'string') {
      return metadata.stripe_charge_id;
    }

    const { data } = await this.supabaseService
      .getClient()
      .from('providers_transactions' as never)
      .select('provider_transaction_id' as never)
      .eq('transaction_id' as never, tx.transaction_id as never)
      .eq('provider_code' as never, 'STRIPE' as never)
      .limit(1)
      .maybeSingle();

    const chargeId = (data as { provider_transaction_id?: string } | null)
      ?.provider_transaction_id;
    return chargeId ?? null;
  }

  private computeStripeRefundCents(
    refundAmountXof: number,
    grossAmountXof: number,
    metadata?: Record<string, unknown> | null,
  ): number {
    const raw = metadata?.stripe_amount_cents;
    const stripeAmountCents =
      typeof raw === 'string'
        ? parseInt(raw, 10)
        : typeof raw === 'number'
          ? raw
          : null;

    if (
      stripeAmountCents != null &&
      stripeAmountCents > 0 &&
      grossAmountXof > 0
    ) {
      return Math.max(
        1,
        Math.round((refundAmountXof / grossAmountXof) * stripeAmountCents),
      );
    }

    return Math.max(1, Math.round(refundAmountXof));
  }

  private mapStripeRefundError(error: unknown): BadRequestException {
    const stripeError = error as { code?: string; message?: string };
    const code = stripeError?.code ?? '';
    const message = stripeError?.message ?? 'Stripe refund failed';

    if (
      code === 'charge_already_refunded' ||
      message.toLowerCase().includes('already been refunded')
    ) {
      return new BadRequestException('This charge has already been refunded');
    }

    if (
      code === 'charge_disputed' ||
      message.toLowerCase().includes('disputed')
    ) {
      return new BadRequestException(
        'Cannot refund a charge with a pending dispute',
      );
    }

    return new BadRequestException(message);
  }

  private async createMobileMoneyFullRefund(
    dto: CreateRefundDto,
    user: AuthContext,
    tx: TransactionRow,
    feePercentage: number,
    refundMerchantId: string,
  ) {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'create_wave_refund_request_api' as never,
      {
        p_merchant_id: refundMerchantId,
        p_organization_id: user.organizationId,
        p_transaction_id: dto.transaction_id,
        p_refund_amount: dto.amount,
        p_processing_fee_percentage: feePercentage,
        p_reason: dto.reason ?? null,
        p_subscription_action: this.resolveSubscriptionActionParam(dto),
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const ledgerResult = data as RpcRefundResult;

    if (!ledgerResult?.success || !ledgerResult.refund_id) {
      throw new BadRequestException(
        ledgerResult?.error ?? 'Failed to create Wave refund request',
      );
    }

    const refundId = ledgerResult.refund_id;
    const subscriptionAction = ledgerResult.subscription_action;

    try {
      await this.invokePaymentEdge('/refund', {
        transactionId: dto.transaction_id,
        amount: String(dto.amount),
        currency: tx.currency_code,
        reason: dto.reason,
        refundId,
      });
    } catch (edgeError) {
      const rollbackMessage =
        edgeError instanceof Error ? edgeError.message : 'Wave API failed';

      const { data: rollbackData, error: rollbackError } =
        await this.supabaseService.getClient().rpc(
          'rollback_wave_refund' as never,
          {
            p_refund_id: refundId,
            p_reason: rollbackMessage,
          } as never,
        );

      if (rollbackError) {
        this.logger.error(
          `rollback_wave_refund failed after Wave error: ${rollbackError.message}`,
        );
      } else {
        const rollbackResult = rollbackData as RpcRefundResult;
        if (rollbackResult?.success !== true) {
          this.logger.error(
            `rollback_wave_refund returned failure: ${rollbackResult?.error ?? 'unknown'}`,
          );
        }
      }

      throw edgeError;
    }

    return {
      success: true,
      refund_id: refundId,
      transaction_id: dto.transaction_id,
      refunded_amount: dto.amount,
      status: 'completed',
      message: 'Refund initiated and recorded.',
      subscription_action: subscriptionAction,
    };
  }

  private async createMobileMoneyPartialRefund(
    dto: CreateRefundDto,
    user: AuthContext,
    tx: TransactionRow,
    feeAmount: number,
    feePercentage: number,
    refundMerchantId: string,
  ) {
    if (!tx.customer_id) {
      throw new BadRequestException(
        'Transaction has no customer; partial refund requires a customer phone number',
      );
    }

    const customer = await this.loadCustomer(
      tx.customer_id,
      user.organizationId,
    );
    const phone = customer.phone_number || customer.whatsapp_number;
    if (!phone) {
      throw new BadRequestException(
        'Customer phone number is required for partial refunds',
      );
    }

    const payoutResult = (await this.invokePaymentEdge('/beneficiary-payout', {
      merchantId: user.merchantId,
      organizationId: user.organizationId,
      amount: dto.amount,
      currency: tx.currency_code,
      recipientName: customer.name || 'Customer',
      recipientPhone: phone,
      description:
        dto.reason || `Partial refund for transaction ${dto.transaction_id}`,
      metadata: {
        is_partial_refund: true,
        partial_refund_for_transaction: dto.transaction_id,
        original_transaction_amount: tx.gross_amount,
        refund_type: 'partial',
        source: 'api',
      },
    })) as BeneficiaryPayoutEdgeResult;

    const refundId = await this.recordRefundOnly({
      transactionId: dto.transaction_id,
      amount: dto.amount,
      reason: dto.reason
        ? `${dto.reason} (partial refund via payout)`
        : 'Partial refund via payout',
      providerCode: tx.provider_code,
      merchantId: refundMerchantId,
      subscriptionAction: this.resolveSubscriptionActionParam(dto),
      feeAmount,
      metadata: {
        processing_fee: feeAmount,
        customer_refund_amount: dto.amount,
        refund_method: 'partial_beneficiary_payout',
        balance_via_payout: true,
        beneficiary_payout_id: payoutResult?.payoutId,
        payout_reference: payoutResult?.wavePayoutId,
        payout_total_deduction: payoutResult?.totalDeduction,
        customer_phone: phone,
        is_partial_refund: true,
        source: 'api',
      },
    });

    const { data: chargeRows, error: chargeError } = await this.supabaseService
      .getClient()
      .rpc(
        'apply_wave_partial_refund_charges' as never,
        {
          p_transaction_id: dto.transaction_id,
          p_refund_id: refundId,
          p_refund_amount: dto.amount,
          p_processing_fee_percentage: feePercentage,
          p_subscription_action: this.resolveSubscriptionActionParam(dto),
        } as never,
      );

    if (chargeError) {
      throw new BadRequestException(chargeError.message);
    }

    const chargeResult = Array.isArray(chargeRows) ? chargeRows[0] : chargeRows;
    if ((chargeResult as { success?: boolean })?.success === false) {
      throw new BadRequestException(
        (chargeResult as { error_message?: string })?.error_message ??
          'Failed to apply partial refund charges',
      );
    }

    const subscriptionAction = (
      chargeResult as { subscription_action?: SubscriptionRefundActionResult }
    )?.subscription_action;

    return {
      success: true,
      refund_id: refundId,
      transaction_id: dto.transaction_id,
      refunded_amount: dto.amount,
      status: 'completed',
      message: 'Partial refund sent to customer and recorded.',
      subscription_action: subscriptionAction,
    };
  }

  private async createMtnFullRefund(
    dto: CreateRefundDto,
    user: AuthContext,
    tx: TransactionRow,
    feePercentage: number,
    refundMerchantId: string,
  ) {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'create_mtn_refund_request_api' as never,
      {
        p_merchant_id: refundMerchantId,
        p_organization_id: user.organizationId,
        p_transaction_id: dto.transaction_id,
        p_refund_amount: dto.amount,
        p_processing_fee_percentage: feePercentage,
        p_reason: dto.reason ?? null,
        p_subscription_action: this.resolveSubscriptionActionParam(dto),
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const ledgerResult = data as RpcRefundResult;

    if (!ledgerResult?.success || !ledgerResult.refund_id) {
      throw new BadRequestException(
        ledgerResult?.error ?? 'Failed to create MTN refund request',
      );
    }

    const refundId = ledgerResult.refund_id;
    const subscriptionAction = ledgerResult.subscription_action;

    if (this.shouldSkipMtnProviderRefund(tx)) {
      return {
        success: true,
        refund_id: refundId,
        transaction_id: dto.transaction_id,
        refunded_amount: dto.amount,
        status: 'completed',
        message: 'Refund initiated and recorded.',
        subscription_action: subscriptionAction,
      };
    }

    try {
      await this.invokeMtnEdge('/refund', user, {
        transactionId: dto.transaction_id,
        amount: String(dto.amount),
        currency: tx.currency_code,
        reason: dto.reason,
        refundId,
      });
    } catch (edgeError) {
      await this.rollbackMtnRefund(refundId, edgeError);
      throw edgeError;
    }

    return {
      success: true,
      refund_id: refundId,
      transaction_id: dto.transaction_id,
      refunded_amount: dto.amount,
      status: 'completed',
      message: 'Refund initiated and recorded.',
      subscription_action: subscriptionAction,
    };
  }

  private async createMtnPartialRefund(
    dto: CreateRefundDto,
    user: AuthContext,
    tx: TransactionRow,
    feePercentage: number,
    refundMerchantId: string,
  ) {
    if (!tx.customer_id) {
      throw new BadRequestException(
        'Transaction has no customer; partial refund requires a customer phone number',
      );
    }

    const customer = await this.loadCustomer(
      tx.customer_id,
      user.organizationId,
    );
    const phone = customer.phone_number || customer.whatsapp_number;
    if (!phone) {
      throw new BadRequestException(
        'Customer phone number is required for partial refunds',
      );
    }

    const { data, error } = await this.supabaseService.getClient().rpc(
      'create_mtn_refund_request_api' as never,
      {
        p_merchant_id: refundMerchantId,
        p_organization_id: user.organizationId,
        p_transaction_id: dto.transaction_id,
        p_refund_amount: dto.amount,
        p_processing_fee_percentage: feePercentage,
        p_reason: dto.reason ?? null,
        p_subscription_action: 'none',
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const ledgerResult = data as RpcRefundResult;

    if (!ledgerResult?.success || !ledgerResult.refund_id) {
      throw new BadRequestException(
        ledgerResult?.error ?? 'Failed to create MTN partial refund request',
      );
    }

    const refundId = ledgerResult.refund_id;

    if (!this.shouldSkipMtnProviderRefund(tx)) {
      try {
        await this.invokeMtnEdge('/refund', user, {
          transactionId: dto.transaction_id,
          amount: String(dto.amount),
          currency: tx.currency_code,
          reason: dto.reason,
          refundId,
        });
      } catch (edgeError) {
        await this.rollbackMtnRefund(refundId, edgeError);
        throw edgeError;
      }
    }

    const { data: chargeRows, error: chargeError } = await this.supabaseService
      .getClient()
      .rpc(
        'apply_mtn_partial_refund_charges' as never,
        {
          p_transaction_id: dto.transaction_id,
          p_refund_id: refundId,
          p_refund_amount: dto.amount,
          p_processing_fee_percentage: feePercentage,
          p_subscription_action: this.resolveSubscriptionActionParam(dto),
        } as never,
      );

    if (chargeError) {
      throw new BadRequestException(chargeError.message);
    }

    const chargeResult = Array.isArray(chargeRows) ? chargeRows[0] : chargeRows;
    if ((chargeResult as { success?: boolean })?.success === false) {
      throw new BadRequestException(
        (chargeResult as { error_message?: string })?.error_message ??
          'Failed to apply partial refund charges',
      );
    }

    const subscriptionAction = (
      chargeResult as { subscription_action?: SubscriptionRefundActionResult }
    )?.subscription_action;

    return {
      success: true,
      refund_id: refundId,
      transaction_id: dto.transaction_id,
      refunded_amount: dto.amount,
      status: 'completed',
      message: 'Partial refund processed and recorded.',
      subscription_action: subscriptionAction,
    };
  }

  private shouldSkipMtnProviderRefund(tx: TransactionRow): boolean {
    return tx.environment === 'test';
  }

  private resolveMtnApiEnvironment(
    user: AuthContext,
  ): 'development' | 'production' {
    const paymentEnvironment = environmentFromAuth(user);
    return paymentEnvironment === 'test' ? 'development' : 'production';
  }

  private async rollbackMtnRefund(
    refundId: string,
    edgeError: unknown,
  ): Promise<void> {
    const rollbackMessage =
      edgeError instanceof Error ? edgeError.message : 'MTN API failed';

    const { data: rollbackData, error: rollbackError } =
      await this.supabaseService.getClient().rpc(
        'rollback_mtn_refund' as never,
        {
          p_refund_id: refundId,
          p_reason: rollbackMessage,
        } as never,
      );

    if (rollbackError) {
      this.logger.error(
        `rollback_mtn_refund failed after MTN error: ${rollbackError.message}`,
      );
    } else {
      const rollbackResult = rollbackData as RpcRefundResult;
      if (rollbackResult?.success !== true) {
        this.logger.error(
          `rollback_mtn_refund returned failure: ${rollbackResult?.error ?? 'unknown'}`,
        );
      }
    }
  }

  private async loadCustomer(customerId: string, organizationId: string) {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'get_customer' as never,
      {
        p_customer_id: customerId,
        p_organization_id: organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    const customer = rows[0] as {
      name?: string;
      phone_number?: string;
      whatsapp_number?: string;
    };

    if (!customer) {
      throw new NotFoundException('Customer not found for this transaction');
    }

    return customer;
  }

  /** Records refund row only — balance already handled by beneficiary payout. */
  private async recordRefundOnly(params: {
    transactionId: string;
    amount: number;
    reason?: string;
    providerCode: string;
    merchantId: string;
    subscriptionAction?: string;
    feeAmount: number;
    metadata: Record<string, unknown>;
  }): Promise<string> {
    const { data: refundId, error: createError } = await this.supabaseService
      .getClient()
      .rpc(
        'create_refund' as never,
        {
          p_transaction_id: params.transactionId,
          p_amount: params.amount,
          p_reason: params.reason ?? null,
          p_provider_transaction_id: null,
          p_provider_merchant_id: null,
          p_provider_code: params.providerCode,
          p_metadata: params.metadata,
          p_created_by: params.merchantId,
          p_subscription_action: params.subscriptionAction ?? 'default',
        } as never,
      );

    if (createError || !refundId) {
      this.logger.error(`create_refund failed: ${createError?.message}`);
      throw new BadRequestException(
        createError?.message ?? 'Failed to record refund',
      );
    }

    return String(refundId);
  }

  private async invokePaymentEdge(
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const projectRef = this.configService.get<string>('SUPABASE_PROJECT_REF');
    const anonKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!projectRef || !anonKey) {
      throw new InternalServerErrorException('Payment configuration missing');
    }

    const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/wave`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        path,
        method: 'POST',
        body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Payment edge ${path} failed: ${errorText}`);
      throw new BadRequestException(`Refund processing failed: ${errorText}`);
    }

    return response.json();
  }

  private async invokeMtnEdge(
    path: string,
    user: AuthContext,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const projectRef = this.configService.get<string>('SUPABASE_PROJECT_REF');
    const anonKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!projectRef || !anonKey) {
      throw new InternalServerErrorException('Payment configuration missing');
    }

    const mtnApiEnvironment = this.resolveMtnApiEnvironment(user);
    const countryCode =
      typeof body.countryCode === 'string' ? body.countryCode : 'CI';
    const { targetEnvironment: countryTarget } =
      getMtnCountryConfig(countryCode);
    const targetEnvironment =
      mtnApiEnvironment === 'development' ? 'sandbox' : countryTarget;

    const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/mtn`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        path,
        method: 'POST',
        environment: mtnApiEnvironment,
        targetEnvironment,
        body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`MTN edge ${path} failed: ${errorText}`);
      throw new BadRequestException(`Refund processing failed: ${errorText}`);
    }

    return response.json();
  }
}
