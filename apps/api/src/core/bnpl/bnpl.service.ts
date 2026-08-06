import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiBnplService } from '../spi/spi-bnpl.service';
import type { AuthContext } from '../common/decorators/current-user.decorator';
import { throwMappedSupabaseRpcError } from '../../utils/supabase-rpc-errors';

export type CreateCheckoutBnplInput = {
  checkoutSessionId: string;
  installmentCount: number;
  payeurAlias: string;
  merchantId: string;
  customerId: string;
  productId?: string | null;
  productAmount: number;
};

export type CreateCheckoutBnplResult = {
  planId: string;
  initialTransactionId: string;
  customerTotal: number;
  merchantReceives: number;
  installmentSubmissions: Awaited<
    ReturnType<SpiBnplService['submitAllInstallmentsForPlan']>
  >;
};

@Injectable()
export class BnplService {
  private readonly logger = new Logger(BnplService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiBnpl: SpiBnplService,
  ) {}

  async getMerchantEligibility(organizationId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_bnpl_merchant_eligibility' as never,
      { p_organization_id: organizationId } as never,
    );

    if (error) {
      throwMappedSupabaseRpcError(error.message);
    }

    return (data ?? { eligible: false, reasons: [] }) as {
      eligible: boolean;
      reasons: string[];
    };
  }

  async getCheckoutDisplay(
    organizationId: string,
    productAmount: number,
    installmentCount: number,
  ) {
    const { data, error } = await this.supabase.rpc(
      'get_bnpl_checkout_display' as never,
      {
        p_organization_id: organizationId,
        p_product_amount: productAmount,
        p_installment_count: installmentCount,
        p_currency_code: 'XOF',
      } as never,
    );

    if (error) {
      throwMappedSupabaseRpcError(error.message);
    }

    return data;
  }

  async createFromCheckout(
    input: CreateCheckoutBnplInput,
  ): Promise<CreateCheckoutBnplResult> {
    if (input.installmentCount < 2) {
      throw new BadRequestException('installmentCount must be at least 2');
    }

    const { data: session, error: sessionError } = await this.supabase
      .from('checkout_sessions')
      .select('organization_id, amount, currency_code, product_id, status')
      .eq('checkout_session_id', input.checkoutSessionId)
      .maybeSingle();

    if (sessionError || !session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.status !== 'open') {
      throw new BadRequestException('Checkout session is not open');
    }

    if (session.currency_code !== 'XOF') {
      throw new BadRequestException('BNPL is only available for XOF');
    }

    const amount = Number(session.amount);
    if (amount <= 0) {
      throw new BadRequestException('Invalid checkout amount');
    }

    const productId = input.productId ?? session.product_id ?? null;
    if (!productId) {
      throw new BadRequestException('product_id is required for BNPL checkout');
    }

    const { data: created, error: createError } = await this.supabase.rpc(
      'create_bnpl_plan_with_spi' as never,
      {
        p_merchant_id: input.merchantId,
        p_organization_id: session.organization_id,
        p_customer_id: input.customerId,
        p_product_id: productId,
        p_product_amount: input.productAmount || amount,
        p_installment_count: input.installmentCount,
        p_currency_code: 'XOF',
        p_checkout_session_id: input.checkoutSessionId,
        p_spi_account_number: null,
      } as never,
    );

    const createdRows = (created ?? []) as Array<{
      plan_id: string;
      initial_transaction_id: string;
      payment_request_ids: string[];
      customer_total: number;
      merchant_receives: number;
    }>;

    if (createError || createdRows.length === 0) {
      this.logger.error(`create_bnpl_plan_with_spi: ${createError?.message}`);
      throwMappedSupabaseRpcError(
        createError?.message ?? 'BNPL plan creation failed',
      );
    }

    const row = createdRows[0]!;

    const installmentSubmissions =
      await this.spiBnpl.submitAllInstallmentsForPlan(
        row.payment_request_ids ?? [],
        input.payeurAlias,
      );

    return {
      planId: row.plan_id,
      initialTransactionId: row.initial_transaction_id,
      customerTotal: Number(row.customer_total),
      merchantReceives: Number(row.merchant_receives),
      installmentSubmissions,
    };
  }

  async listPlans(user: AuthContext, limit = 25, offset = 0) {
    const { data, error } = await this.supabase.rpc(
      'list_installment_plans_api' as never,
      {
        p_organization_id: user.organizationId,
        p_environment: user.environment,
        p_limit: limit,
        p_offset: offset,
      } as never,
    );

    if (error) {
      throwMappedSupabaseRpcError(error.message);
    }

    return data ?? [];
  }

  async toggleBnpl(user: AuthContext, enable: boolean) {
    await this.supabase.rpc('ensure_bnpl_configuration' as never, {
      p_organization_id: user.organizationId,
    } as never);

    const { data, error } = await this.supabase.rpc(
      'toggle_bnpl_for_organization' as never,
      {
        p_organization_id: user.organizationId,
        p_currency_code: 'XOF',
        p_enable: enable,
      } as never,
    );

    if (error) {
      throwMappedSupabaseRpcError(error.message);
    }

    return { enabled: Boolean(data) };
  }

  async updateInterestRate(user: AuthContext, rate: number) {
    const { data, error } = await this.supabase.rpc(
      'update_bnpl_interest_rate' as never,
      {
        p_organization_id: user.organizationId,
        p_currency_code: 'XOF',
        p_interest_rate: rate,
      } as never,
    );

    if (error) {
      throwMappedSupabaseRpcError(error.message);
    }

    return data;
  }

  async getConfigSummary(user: AuthContext) {
    const { data, error } = await this.supabase.rpc(
      'get_bnpl_config_summary' as never,
      {
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throwMappedSupabaseRpcError(error.message);
    }

    return data;
  }
}
