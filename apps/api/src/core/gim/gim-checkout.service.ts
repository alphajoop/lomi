import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { GimChargeService } from './gim-charge.service';
import {
  buildDateTimeLocalTrxn,
  gateXofAmount,
  maskPan,
  toExpiryYyMm,
  toGimAmount,
} from './gim.utils';
import { GimClientService } from './gim-client.service';

export type CheckoutGimPayInput = {
  checkoutSessionId: string;
  pan: string;
  expiry: string;
  cvv: string;
  cardHolderName?: string;
  ecomIp?: string;
};

type PrepareRpcResult = {
  organization_id: string;
  merchant_id: string;
  checkout_session_id: string;
  customer_id: string;
  amount: number;
  currency_code: string;
  merchant_reference: string;
  transaction_id: string | null;
  already_initiated: boolean;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
};

/**
 * Public hosted-checkout GIM PayByCard.
 * Amount is derived server-side from the checkout session; client amount is never trusted.
 */
@Injectable()
export class GimCheckoutService {
  private readonly logger = new Logger(GimCheckoutService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly gimCharge: GimChargeService,
    private readonly gimClient: GimClientService,
  ) {}

  async pay(input: CheckoutGimPayInput) {
    const { data: prepared, error: prepareError } = await this.supabase.rpc(
      'prepare_checkout_gim_payment' as never,
      {
        p_checkout_session_id: input.checkoutSessionId,
      } as never,
    );

    if (prepareError || !prepared) {
      this.logger.error(
        `prepare_checkout_gim_payment failed: ${prepareError?.message}`,
      );
      throw new BadRequestException(
        prepareError?.message ?? 'Failed to prepare checkout GIM payment',
      );
    }

    const prep = prepared as PrepareRpcResult;

    if (prep.already_initiated && prep.transaction_id) {
      return {
        checkoutSessionId: prep.checkout_session_id,
        merchantReference: prep.merchant_reference,
        transactionId: prep.transaction_id,
        alreadyInitiated: true,
      };
    }

    let expiryYyMm: string;
    try {
      expiryYyMm = toExpiryYyMm(input.expiry);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid card expiry',
      );
    }

    const cvv = input.cvv?.trim();
    if (!cvv) {
      throw new BadRequestException('CVV is required');
    }

    const pan = input.pan.replace(/\s/g, '');
    const config = this.gimClient.getConfig();
    const amount = gateXofAmount(prep.amount);
    const amountMinor = toGimAmount(amount, config.amountMultiplier);
    const dateTimeLocalTrxn = buildDateTimeLocalTrxn(
      new Date(),
      config.dateTimeLocalTrxnDigitLength,
    );

    const { data: transactionId, error: createError } = await this.supabase
      .getClient()
      .rpc(
        'create_gim_transaction' as never,
        {
          p_merchant_id: prep.merchant_id,
          p_organization_id: prep.organization_id,
          p_customer_id: prep.customer_id,
          p_amount: amount,
          p_currency_code: 'XOF',
          p_merchant_reference: prep.merchant_reference,
          p_pan_masked: maskPan(pan),
          p_amount_minor: amountMinor,
          p_product_id: null,
          p_subscription_id: null,
          p_description: null,
          p_metadata: null,
          p_quantity: 1,
          p_checkout_session_id: prep.checkout_session_id,
          p_environment: 'live',
          p_date_time_local_trxn: dateTimeLocalTrxn,
        } as never,
      );

    if (createError || !transactionId) {
      throw new BadRequestException(
        createError?.message ?? 'Failed to register GIM transaction',
      );
    }

    return this.gimCharge.executePayByCard({
      pan,
      expiryYyMm,
      cvv,
      amountMinor,
      merchantReference: prep.merchant_reference,
      transactionId: transactionId as string,
      cardHolderName: input.cardHolderName ?? prep.customer_name,
      email: prep.customer_email,
      ecomIp: input.ecomIp,
      mobileNo: prep.customer_phone,
      dateTimeLocalTrxn,
      organizationId: prep.organization_id,
    });
  }
}
