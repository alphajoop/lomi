import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { normalizePaymentEnvironment } from '../../utils/payment-environment';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { RadarService } from '../radar/radar.service';
import {
  withApiIdempotency,
  type ApiIdempotencyContext,
} from '../../utils/api-idempotency';
import type { IdempotentCreateResult } from '../../utils/idempotency-cache';
import { environmentFromAuth } from '../common/auth-environment';
import { buildCreateOrUpdateCustomerRpcArgs } from '../../utils/customers/create-or-update-customer-rpc';
import { CreateGimChargeDto } from '../charges/dto/create-gim-charge.dto';
import {
  attachChargeNextAction,
  deriveGimChargeNextAction,
} from '../charges/charge-next-action';
import { GimClientService, GimTransportError } from './gim-client.service';
import { GimHmacService } from './gim-hmac.service';
import {
  actionCodeUserMessage,
  buildDateTimeLocalTrxn,
  classifyActionCode,
  gateXofAmount,
  maskPan,
  toExpiryYyMm,
  toGimAmount,
} from './gim.utils';
import type { GimChargeScenarioKey } from '../charges/gim-charge-scenario';
import { WebhookSenderService } from '../../webhooks/webhook-sender.service';
import { dispatchGimMerchantWebhook } from './gim-merchant-webhook.helper';
import type { WebhookEvent } from '../../utils/types/api';
import { randomUUID } from 'crypto';

export type GimChargeResultData = {
  success: boolean;
  status: 'approved' | 'declined' | 'redirect_3ds' | 'retry_other_rail';
  system_reference?: number;
  merchant_reference?: string;
  action_code?: string;
  message?: string;
  auth_code?: string;
  transaction_id?: string;
  three_ds_url?: string | null;
};

type FinalizeGimPaymentResult = {
  transaction_id?: string;
  checkout_session_id?: string;
  organization_id?: string;
  status?: string;
  webhook_event?: WebhookEvent | null;
};

@Injectable()
export class GimChargeService {
  private readonly logger = new Logger(GimChargeService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly gimClient: GimClientService,
    private readonly gimHmac: GimHmacService,
    private readonly radarService: RadarService,
    private readonly webhookSender: WebhookSenderService,
  ) {}

  async create(
    createDto: CreateGimChargeDto,
    user: AuthContext,
    idempotency?: ApiIdempotencyContext,
    scenarioKey?: GimChargeScenarioKey,
  ): Promise<IdempotentCreateResult<unknown>> {
    const scope = {
      organizationId: user.organizationId,
      environment: environmentFromAuth(user),
      endpointRoute: 'POST:/charge/gim',
    };
    return withApiIdempotency(this.supabase, scope, idempotency, () =>
      this.executeCreate(createDto, user, scenarioKey),
    );
  }

  private async executeCreate(
    createDto: CreateGimChargeDto,
    user: AuthContext,
    scenarioKey?: GimChargeScenarioKey,
  ) {
    const config = this.gimClient.getConfig();
    const paymentEnv = normalizePaymentEnvironment(user.environment);

    const sourceCurrency = (createDto.currency_code ?? 'XOF').toUpperCase();
    if (sourceCurrency !== 'XOF') {
      throw new BadRequestException('GIM Pay only supports XOF currency');
    }

    let amount: number;
    try {
      amount = gateXofAmount(Number(createDto.amount));
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid amount',
      );
    }

    let expiryYyMm: string;
    try {
      expiryYyMm = toExpiryYyMm(createDto.expiry);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid card expiry',
      );
    }

    const cvv = createDto.cvv?.trim();
    if (!cvv || cvv.length < 3) {
      throw new BadRequestException('CVV is required');
    }

    const pan = createDto.pan?.replace(/\s/g, '') ?? '';
    if (pan.length < 14 || pan.length > 18) {
      throw new BadRequestException('Card number must be 14–18 digits');
    }

    const resolvedCustomerId = await this.resolveCustomerId(
      createDto,
      user,
      user.merchantId,
    );

    await this.radarService.assertChargeAllowed(user, {
      amount,
      currencyCode: sourceCurrency,
      rail: 'card',
      customerId: resolvedCustomerId,
      metadata: {
        ...(createDto.metadata ?? {}),
        source: 'api_charge_gim',
      },
    });

    const merchantReference =
      createDto.payment_reference?.trim() || randomUUID();
    const amountMinor = toGimAmount(amount, config.amountMultiplier);
    const dateTimeLocalTrxn = buildDateTimeLocalTrxn(
      new Date(),
      config.dateTimeLocalTrxnDigitLength,
    );

    const transactionId = await this.createPendingTransaction({
      createDto,
      user,
      merchantId: user.merchantId,
      paymentEnv,
      amount,
      customerId: resolvedCustomerId,
      merchantReference,
      panMasked: maskPan(pan),
      amountMinor,
      dateTimeLocalTrxn,
    });

    return this.executePayByCard({
      pan,
      expiryYyMm,
      cvv,
      amountMinor,
      merchantReference,
      transactionId,
      cardHolderName: createDto.customer_name,
      email: createDto.customer_email,
      ecomIp: createDto.ecom_ip,
      mobileNo: createDto.customer_phone,
      dateTimeLocalTrxn,
      scenarioKey: paymentEnv === 'test' ? scenarioKey : undefined,
      organizationId: user.organizationId,
    });
  }

  async executePayByCard(input: {
    pan: string;
    expiryYyMm: string;
    cvv: string;
    amountMinor: number;
    merchantReference: string;
    transactionId: string;
    cardHolderName?: string;
    email?: string;
    ecomIp?: string;
    mobileNo?: string;
    dateTimeLocalTrxn?: string;
    scenarioKey?: GimChargeScenarioKey;
    organizationId?: string;
  }) {
    if (input.scenarioKey) {
      return this.executeScenarioPayByCard(input);
    }

    try {
      const result = await this.gimClient.payByCard({
        pan: input.pan,
        expiryYyMm: input.expiryYyMm,
        cvv2: input.cvv,
        amountMinorUnits: input.amountMinor,
        merchantReference: input.merchantReference,
        cardHolderName: input.cardHolderName,
        email: input.email,
        ecomIp: input.ecomIp,
        mobileNo: input.mobileNo,
        dateTimeLocalTrxn: input.dateTimeLocalTrxn,
      });

      if (result.kind === 'redirect_3ds') {
        await this.finalizeGimPayment({
          merchantReference: input.merchantReference,
          status: 'redirect_3ds',
          systemReference: result.systemReference,
          threeDsRequired: true,
          organizationId: input.organizationId,
        });

        const data: GimChargeResultData = {
          success: true,
          status: 'redirect_3ds',
          system_reference: result.systemReference,
          merchant_reference: input.merchantReference,
          transaction_id: input.transactionId,
          three_ds_url: result.threeDsUrl,
        };

        return attachChargeNextAction(
          { success: true, data },
          deriveGimChargeNextAction({
            status: 'redirect_3ds',
            three_ds_url: result.threeDsUrl,
          }),
        );
      }

      const outcome = classifyActionCode(result.actionCode);
      if (outcome === 'retry_other_rail') {
        const data: GimChargeResultData = {
          success: false,
          status: 'retry_other_rail',
          merchant_reference: input.merchantReference,
          action_code: result.actionCode,
          message: actionCodeUserMessage(result.actionCode, result.message),
          transaction_id: input.transactionId,
        };
        return attachChargeNextAction(
          { success: true, data },
          deriveGimChargeNextAction({ status: 'retry_other_rail' }),
        );
      }

      const approved = outcome === 'approved' && result.approved;
      await this.finalizeGimPayment({
        merchantReference: input.merchantReference,
        status: approved ? 'approved' : 'declined',
        systemReference: result.systemReference,
        networkReference: result.networkReference,
        authCode: result.authCode,
        actionCode: result.actionCode,
        gatewayMessage: result.message,
        returnHashValid: null,
        organizationId: input.organizationId,
      });

      const data: GimChargeResultData = {
        success: approved,
        status: approved ? 'approved' : 'declined',
        system_reference: result.systemReference,
        merchant_reference: input.merchantReference,
        action_code: result.actionCode,
        message: actionCodeUserMessage(result.actionCode, result.message),
        auth_code: result.authCode,
        transaction_id: input.transactionId,
      };

      return { success: true, data };
    } catch (error) {
      if (error instanceof GimTransportError) {
        const data: GimChargeResultData = {
          success: false,
          status: 'retry_other_rail',
          merchant_reference: input.merchantReference,
          message: 'GIM Pay is temporarily unavailable',
          transaction_id: input.transactionId,
        };
        return attachChargeNextAction(
          { success: true, data },
          deriveGimChargeNextAction({ status: 'retry_other_rail' }),
        );
      }
      throw error;
    }
  }

  private async executeScenarioPayByCard(input: {
    merchantReference: string;
    transactionId: string;
    scenarioKey?: GimChargeScenarioKey;
    organizationId?: string;
  }) {
    const scenario = input.scenarioKey ?? 'approved';

    if (scenario === 'retry_other_rail') {
      const data: GimChargeResultData = {
        success: false,
        status: 'retry_other_rail',
        merchant_reference: input.merchantReference,
        message: 'GIM Pay is temporarily unavailable (test scenario)',
        transaction_id: input.transactionId,
      };
      return attachChargeNextAction(
        { success: true, data },
        deriveGimChargeNextAction({ status: 'retry_other_rail' }),
      );
    }

    if (scenario === '3ds') {
      await this.finalizeGimPayment({
        merchantReference: input.merchantReference,
        status: 'redirect_3ds',
        systemReference: 999001,
        threeDsRequired: true,
        organizationId: input.organizationId,
      });

      const threeDsUrl =
        'https://checkout.lomi.africa/checkout/success?scenario=3ds';
      const data: GimChargeResultData = {
        success: true,
        status: 'redirect_3ds',
        system_reference: 999001,
        merchant_reference: input.merchantReference,
        transaction_id: input.transactionId,
        three_ds_url: threeDsUrl,
      };

      return attachChargeNextAction(
        { success: true, data },
        deriveGimChargeNextAction({
          status: 'redirect_3ds',
          three_ds_url: threeDsUrl,
        }),
      );
    }

    const approved = scenario === 'approved';
    await this.finalizeGimPayment({
      merchantReference: input.merchantReference,
      status: approved ? 'approved' : 'declined',
      systemReference: approved ? 999002 : 999003,
      networkReference: 'TEST-NET-REF',
      authCode: approved ? '123456' : undefined,
      actionCode: approved ? '000' : '100',
      gatewayMessage: approved
        ? 'Approved (test scenario)'
        : 'Declined (test scenario)',
      returnHashValid: null,
      organizationId: input.organizationId,
    });

    const data: GimChargeResultData = {
      success: approved,
      status: approved ? 'approved' : 'declined',
      system_reference: approved ? 999002 : 999003,
      merchant_reference: input.merchantReference,
      action_code: approved ? '000' : '100',
      message: approved ? 'Payment accepted' : 'Card declined',
      auth_code: approved ? '123456' : undefined,
      transaction_id: input.transactionId,
    };

    return { success: true, data };
  }

  async finalizeFromReturnQuery(query: Record<string, string>): Promise<{
    approved: boolean;
    merchantReference?: string;
    checkoutSessionId?: string;
  }> {
    const config = this.gimClient.getConfig();
    const receivedHash = query.SecureHash ?? '';
    const valid = this.gimHmac.verifyReturn(
      query,
      receivedHash,
      config.secretKeyHex,
    );

    if (!valid) {
      throw new BadRequestException('Invalid return signature');
    }

    const actionCode = query.ActionCode;
    const approved =
      query.Success === 'true' &&
      (actionCode === '000' ||
        actionCode === '001' ||
        actionCode === '003' ||
        actionCode === '007' ||
        actionCode === '00');

    const merchantReference = query.MerchantReference ?? '';

    const finalizeResult = await this.finalizeGimPayment({
      merchantReference,
      status: approved ? 'approved' : 'declined',
      systemReference: query.SystemReference
        ? Number(query.SystemReference)
        : undefined,
      networkReference: query.NetworkReference,
      authCode: query.AuthCode,
      actionCode,
      gatewayMessage: query.Message,
      returnHashValid: true,
    });

    const checkoutSessionId =
      finalizeResult.checkout_session_id ??
      (merchantReference?.startsWith('CHK-')
        ? merchantReference.slice(4)
        : undefined);

    return { approved, merchantReference, checkoutSessionId };
  }

  private async resolveCustomerId(
    createDto: CreateGimChargeDto,
    user: AuthContext,
    ledgerMerchantId: string,
  ): Promise<string> {
    const trimmedId = createDto.customer_id?.trim();
    if (trimmedId) {
      return trimmedId;
    }

    const email = createDto.customer_email?.trim();
    const name = createDto.customer_name?.trim();
    if (!email || !name) {
      throw new BadRequestException(
        'customer_id or customer_email + customer_name is required',
      );
    }

    const { data: custId, error } = await this.supabase.getClient().rpc(
      'create_or_update_customer' as never,
      buildCreateOrUpdateCustomerRpcArgs({
        merchantId: ledgerMerchantId,
        organizationId: user.organizationId,
        name,
        email,
        phoneNumber: createDto.customer_phone?.trim() || '',
        whatsappNumber: createDto.customer_phone?.trim() || '',
        environment: environmentFromAuth(user),
      }) as never,
    );

    if (error || !custId) {
      throw new BadRequestException('Unable to resolve customer');
    }

    return custId as string;
  }

  private async createPendingTransaction(params: {
    createDto: CreateGimChargeDto;
    user: AuthContext;
    merchantId: string;
    paymentEnv: string;
    amount: number;
    customerId: string;
    merchantReference: string;
    panMasked: string;
    amountMinor: number;
    dateTimeLocalTrxn: string;
  }): Promise<string> {
    const { data, error } = await this.supabase.getClient().rpc(
      'create_gim_transaction' as never,
      {
        p_merchant_id: params.merchantId,
        p_organization_id: params.user.organizationId,
        p_customer_id: params.customerId,
        p_amount: params.amount,
        p_currency_code: 'XOF',
        p_merchant_reference: params.merchantReference,
        p_pan_masked: params.panMasked,
        p_amount_minor: params.amountMinor,
        p_product_id: params.createDto.product_id ?? null,
        p_subscription_id: params.createDto.subscription_id ?? null,
        p_description: params.createDto.description ?? null,
        p_metadata: params.createDto.metadata ?? null,
        p_quantity: params.createDto.quantity ?? 1,
        p_checkout_session_id: params.createDto.checkout_session_id ?? null,
        p_environment: params.paymentEnv,
        p_date_time_local_trxn: params.dateTimeLocalTrxn,
      } as never,
    );

    if (error || !data) {
      this.logger.error({
        message: 'create_gim_transaction_failed',
        error: error?.message,
      });
      throw new BadRequestException(
        error?.message ?? 'Failed to register GIM transaction',
      );
    }

    return data as string;
  }

  async finalizeGimPayment(params: {
    merchantReference: string;
    status: 'approved' | 'declined' | 'redirect_3ds' | 'error';
    systemReference?: number;
    networkReference?: string;
    authCode?: string;
    actionCode?: string;
    gatewayMessage?: string | null;
    returnHashValid?: boolean | null;
    threeDsRequired?: boolean;
    organizationId?: string;
  }): Promise<FinalizeGimPaymentResult> {
    const { data, error } = await this.supabase.getClient().rpc(
      'finalize_gim_payment' as never,
      {
        p_merchant_reference: params.merchantReference,
        p_status: params.status,
        p_system_reference: params.systemReference ?? null,
        p_network_reference: params.networkReference ?? null,
        p_auth_code: params.authCode ?? null,
        p_action_code: params.actionCode ?? null,
        p_gateway_message: params.gatewayMessage ?? null,
        p_return_hash_valid: params.returnHashValid ?? null,
        p_three_ds_required: params.threeDsRequired ?? false,
      } as never,
    );

    if (error) {
      this.logger.error({
        message: 'finalize_gim_payment_failed',
        error: error.message,
      });
      throw new BadRequestException(error.message);
    }

    const result = (data ?? {}) as FinalizeGimPaymentResult;

    const webhookEvent = result.webhook_event;
    if (
      webhookEvent &&
      result.transaction_id &&
      (result.organization_id ?? params.organizationId)
    ) {
      await dispatchGimMerchantWebhook(
        {
          supabase: this.supabase,
          webhookSender: this.webhookSender,
          logger: this.logger,
        },
        {
          transactionId: result.transaction_id,
          organizationId: result.organization_id ?? params.organizationId ?? '',
          event: webhookEvent,
        },
      );
    }

    return result;
  }
}
