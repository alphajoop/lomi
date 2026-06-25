import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { CreatePayoutDto } from './dto/create-payout.dto';
import {
  withApiIdempotency,
  type ApiIdempotencyContext,
} from '../../utils/api-idempotency';
import type { IdempotentCreateResult } from '../../utils/idempotency-cache';

type PayoutMethodRow = {
  payout_method_id: string;
  organization_id: string;
  account_number: string;
  account_name: string;
  payout_method_type: string;
  is_valid: boolean;
  is_spi_enabled: boolean;
  auto_withdrawal_mobile_provider: string | null;
};

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    dto: CreatePayoutDto,
    user: AuthContext,
    idempotency?: ApiIdempotencyContext,
  ): Promise<IdempotentCreateResult<unknown>> {
    const scope = {
      organizationId: user.organizationId,
      environment: environmentFromAuth(user),
      endpointRoute: 'POST:/payouts',
    };
    return withApiIdempotency(this.supabaseService, scope, idempotency, () =>
      this.executeCreate(dto, user),
    );
  }

  private async executeCreate(dto: CreatePayoutDto, user: AuthContext) {
    if (dto.destination === 'beneficiary') {
      if (dto.rail === 'bank') {
        throw new BadRequestException(
          'Bank payouts to third-party beneficiaries are not supported',
        );
      }
      return this.createBeneficiaryPayout(dto, user);
    }

    return this.createSelfPayout(dto, user);
  }

  async findAll(
    user: AuthContext,
    statuses?: string[],
    page = 1,
    pageSize = 50,
    startDate?: string,
    endDate?: string,
  ) {
    const paymentEnvironment = environmentFromAuth(user);
    const statusFilter = statuses?.length ? statuses : null;

    const { data: withdrawals, error: wError } = await this.supabaseService.rpc(
      'fetch_payouts' as never,
      {
        p_merchant_id: user.merchantId,
        p_statuses: statusFilter,
        p_page_number: page,
        p_page_size: pageSize,
        p_start_date: startDate ?? null,
        p_end_date: endDate ?? null,
        p_organization_id: user.organizationId,
        p_environment: paymentEnvironment,
      } as never,
    );

    if (wError) {
      throw new BadRequestException(wError.message);
    }

    let beneficiaryRows: Record<string, unknown>[] = [];
    if (paymentEnvironment !== 'test') {
      const { data: beneficiaries, error: bError } =
        await this.supabaseService.rpc(
          'fetch_beneficiary_payouts' as never,
          {
            p_merchant_id: user.merchantId,
            p_statuses: statusFilter,
            p_page_number: page,
            p_page_size: pageSize,
            p_start_date: startDate ?? null,
            p_end_date: endDate ?? null,
            p_currency_code: null,
          } as never,
        );

      if (bError) {
        throw new BadRequestException(bError.message);
      }

      beneficiaryRows = (beneficiaries ?? []).map(
        (row: Record<string, unknown>) => ({
          ...row,
          kind: 'beneficiary' as const,
        }),
      );
    }

    const withdrawalRows = (withdrawals ?? []).map(
      (row: Record<string, unknown>) => ({
        ...row,
        kind: 'withdrawal' as const,
      }),
    );

    return {
      success: true,
      data: [...withdrawalRows, ...beneficiaryRows],
    };
  }

  async findOne(id: string, user: AuthContext) {
    const { data: withdrawal, error: wError } = await this.supabaseService
      .getClient()
      .rpc(
        'get_payout_api' as never,
        {
          p_payout_id: id,
          p_organization_id: user.organizationId,
        } as never,
      );

    if (wError) {
      throw new BadRequestException(wError.message);
    }

    const wRows = Array.isArray(withdrawal) ? withdrawal : [];
    if (wRows.length > 0) {
      const row = wRows[0] as Record<string, unknown>;
      return { success: true, data: { ...row, kind: 'withdrawal' } };
    }

    const { data: beneficiary, error: bError } = await this.supabaseService
      .getClient()
      .rpc(
        'get_beneficiary_payout_api' as never,
        {
          p_payout_id: id,
          p_organization_id: user.organizationId,
        } as never,
      );

    if (bError) {
      throw new BadRequestException(bError.message);
    }

    const bRows = Array.isArray(beneficiary) ? beneficiary : [];
    if (bRows.length > 0) {
      const row = bRows[0] as Record<string, unknown>;
      return { success: true, data: { ...row, kind: 'beneficiary' } };
    }

    throw new NotFoundException('Payout not found');
  }

  /** API payouts skip dashboard payout PIN (authorized by API key + permissions). */
  private apiPayoutArgs() {
    return { p_bypass_payout_pin: true as const };
  }

  private async createSelfPayout(dto: CreatePayoutDto, user: AuthContext) {
    if (!dto.payout_method_id) {
      throw new BadRequestException(
        'payout_method_id is required for self payouts',
      );
    }

    const method = await this.loadPayoutMethod(
      dto.payout_method_id,
      user.organizationId,
    );

    switch (dto.rail) {
      case 'bank':
        if (method.payout_method_type !== 'bank') {
          throw new BadRequestException(
            'payout_method_id must be a registered bank account',
          );
        }
        return this.selfBankOrSpiWithdrawal(dto, user, method, null);
      case 'spi':
        if (!method.is_spi_enabled) {
          throw new BadRequestException(
            'payout_method_id must be an SPI-enabled payout method',
          );
        }
        return this.selfSpiPayout(dto, user);
      case 'wave':
        this.assertWavePayoutAllowedInEnvironment(user);
        if (method.payout_method_type !== 'mobile_money') {
          throw new BadRequestException(
            'payout_method_id must be a registered mobile money payout method',
          );
        }
        if (method.auto_withdrawal_mobile_provider !== 'WAVE') {
          throw new BadRequestException(
            'payout_method_id must be a Wave mobile money method',
          );
        }
        return this.selfWaveWithdrawal(dto, user, method);
      case 'mtn':
        this.assertMtnPayoutAllowedInEnvironment(user);
        if (method.payout_method_type !== 'mobile_money') {
          throw new BadRequestException(
            'payout_method_id must be a registered mobile money payout method',
          );
        }
        if (method.auto_withdrawal_mobile_provider !== 'MTN') {
          throw new BadRequestException(
            'payout_method_id must be an MTN mobile money method',
          );
        }
        return this.selfMtnWithdrawal(dto, user, method);
      default:
        throw new BadRequestException('Invalid rail for self payout');
    }
  }

  private assertWavePayoutAllowedInEnvironment(user: AuthContext): void {
    if (environmentFromAuth(user) === 'test') {
      throw new BadRequestException(
        'Wave payouts are not available in test mode. Use a live API key.',
      );
    }
  }

  private assertMtnPayoutAllowedInEnvironment(user: AuthContext): void {
    if (environmentFromAuth(user) === 'test') {
      throw new BadRequestException(
        'MTN payouts are not available in test mode. Use a live API key.',
      );
    }
  }

  private async createBeneficiaryPayout(
    dto: CreatePayoutDto,
    user: AuthContext,
  ) {
    switch (dto.rail) {
      case 'mtn':
        this.assertMtnPayoutAllowedInEnvironment(user);
        if (!dto.recipient?.phone || !dto.recipient?.name) {
          throw new BadRequestException(
            'recipient.name and recipient.phone are required for beneficiary payouts',
          );
        }
        return this.beneficiaryMtnPayout(dto, user);
      case 'wave':
        this.assertWavePayoutAllowedInEnvironment(user);
        if (!dto.recipient?.phone || !dto.recipient?.name) {
          throw new BadRequestException(
            'recipient.name and recipient.phone are required for beneficiary payouts',
          );
        }
        return this.beneficiaryWavePayout(dto, user);
      case 'spi':
        if (!dto.payout_method_id) {
          throw new BadRequestException(
            'payout_method_id is required for beneficiary SPI payouts',
          );
        }
        return this.beneficiarySpiPayout(dto, user);
      default:
        throw new BadRequestException('Invalid rail for beneficiary payout');
    }
  }

  private async loadPayoutMethod(
    payoutMethodId: string,
    organizationId: string,
  ): Promise<PayoutMethodRow> {
    const { data, error } = await this.supabaseService.getClient().rpc(
      'fetch_payout_method_details' as never,
      {
        p_payout_method_id: payoutMethodId,
        p_organization_id: organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    const method = rows[0] as PayoutMethodRow | undefined;
    if (!method) {
      throw new BadRequestException(
        'Payout method not found for this organization',
      );
    }
    return method;
  }

  private async selfBankOrSpiWithdrawal(
    dto: CreatePayoutDto,
    user: AuthContext,
    method: PayoutMethodRow,
    providerCode: string | null,
  ) {
    if (method.payout_method_type === 'bank' && !method.is_valid) {
      throw new BadRequestException(
        'Bank account is pending verification. Please wait for admin approval.',
      );
    }

    const { data, error } = await this.supabaseService.getClient().rpc(
      'initiate_withdrawal_api' as never,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_amount: dto.amount,
        p_payout_method_id: dto.payout_method_id,
        p_currency_code: dto.currency_code,
        p_provider_code: providerCode,
        ...this.apiPayoutArgs(),
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;
    const success = (row as { success?: boolean })?.success;
    const message = (row as { message?: string })?.message;

    if (!success) {
      throw new BadRequestException(message ?? 'Withdrawal failed');
    }

    return {
      success: true,
      kind: 'withdrawal' as const,
      status: 'pending',
      message: message ?? 'Withdrawal initiated successfully',
    };
  }

  private async selfSpiPayout(dto: CreatePayoutDto, user: AuthContext) {
    const { data: initiated, error: initError } = await this.supabaseService
      .getClient()
      .rpc(
        'initiate_spi_payout' as never,
        {
          p_organization_id: user.organizationId,
          p_merchant_id: user.merchantId,
          p_payout_method_id: dto.payout_method_id,
          p_amount: dto.amount,
          p_currency_code: dto.currency_code,
          ...this.apiPayoutArgs(),
        } as never,
      );

    if (initError) {
      throw new BadRequestException(
        initError.message ?? 'Failed to initiate SPI payout',
      );
    }

    const row = Array.isArray(initiated) ? initiated[0] : initiated;
    if (!row) {
      throw new BadRequestException('Failed to initiate SPI payout');
    }

    const { payout_id: payoutId, spi_tx_id: spiTxId } = row as {
      payout_id: string;
      spi_tx_id: string;
    };

    await this.supabaseService.getClient().rpc(
      'update_spi_payout_status' as never,
      {
        p_payout_id: payoutId,
        p_status: 'processing',
        p_spi_tx_id: spiTxId,
      } as never,
    );

    return {
      success: true,
      payout_id: payoutId,
      kind: 'withdrawal' as const,
      status: 'processing',
      message: 'SPI payout initiated; settlement continues asynchronously.',
    };
  }

  private async selfWaveWithdrawal(
    dto: CreatePayoutDto,
    user: AuthContext,
    method: PayoutMethodRow,
  ) {
    const destinationPhone = method.account_number;
    const result = await this.invokeWaveEdge('/merchant-withdrawal', {
      merchantId: user.merchantId,
      organizationId: user.organizationId,
      amount: dto.amount,
      currency: dto.currency_code,
      reason: dto.reason ?? 'Merchant withdrawal',
      metadata: {
        payoutMethodId: dto.payout_method_id,
        mobilePhoneNumber: destinationPhone,
        ...(dto.metadata ?? {}),
      },
    });

    const payload = result as {
      payoutId?: string;
      status?: string;
      message?: string;
    };

    return {
      success: true,
      payout_id: payload.payoutId,
      kind: 'withdrawal' as const,
      status: payload.status ?? 'processing',
      message: payload.message ?? 'Wave withdrawal initiated',
      data: result,
    };
  }

  private async beneficiaryWavePayout(dto: CreatePayoutDto, user: AuthContext) {
    const result = await this.invokeWaveEdge('/beneficiary-payout', {
      merchantId: user.merchantId,
      organizationId: user.organizationId,
      amount: dto.amount,
      currency: dto.currency_code,
      recipientName: dto.recipient!.name,
      recipientPhone: dto.recipient!.phone,
      description: dto.reason ?? 'Beneficiary payout',
      metadata: dto.metadata ?? {},
    });

    const payload = result as {
      payoutId?: string;
      status?: string;
      message?: string;
    };

    return {
      success: true,
      payout_id: payload.payoutId,
      kind: 'beneficiary' as const,
      status: payload.status ?? 'processing',
      message: payload.message ?? 'Beneficiary payout initiated',
      data: result,
    };
  }

  private async beneficiarySpiPayout(dto: CreatePayoutDto, user: AuthContext) {
    const method = await this.loadPayoutMethod(
      dto.payout_method_id!,
      user.organizationId,
    );

    if (!method.is_spi_enabled) {
      throw new BadRequestException(
        'payout_method_id must be an SPI-enabled payout method',
      );
    }

    const { data, error } = await this.supabaseService.rpc(
      'create_beneficiary_payout' as never,
      {
        p_merchant_id: user.merchantId,
        p_amount: dto.amount,
        p_currency_code: dto.currency_code,
        p_payout_method_id: dto.payout_method_id,
        p_provider_code: 'SPI',
        p_payment_method_code: 'BANK_TRANSFER',
        p_metadata: {
          ...(dto.metadata ?? {}),
          recipient_name: method.account_name,
          api_initiated: true,
        },
        p_status: 'pending',
        ...this.apiPayoutArgs(),
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as {
      payout_id?: string;
      message?: string;
      status?: string;
    } | null;

    if (!row?.payout_id) {
      throw new BadRequestException(
        row?.message ?? 'Beneficiary payout failed',
      );
    }

    return {
      success: true,
      payout_id: row.payout_id,
      kind: 'beneficiary' as const,
      status: row.status ?? 'pending',
      message: row.message ?? 'Beneficiary payout created',
    };
  }

  private async selfMtnWithdrawal(
    dto: CreatePayoutDto,
    user: AuthContext,
    method: PayoutMethodRow,
  ) {
    const destinationPhone = method.account_number;
    const result = await this.invokeMtnEdge('/merchant-withdrawal', {
      merchantId: user.merchantId,
      organizationId: user.organizationId,
      amount: dto.amount,
      currency: dto.currency_code,
      reason: dto.reason ?? 'Merchant withdrawal',
      metadata: {
        payoutMethodId: dto.payout_method_id,
        mobilePhoneNumber: destinationPhone,
        ...(dto.metadata ?? {}),
      },
    });

    const payload = result as {
      payoutId?: string;
      status?: string;
      message?: string;
    };

    return {
      success: true,
      payout_id: payload.payoutId,
      kind: 'withdrawal' as const,
      status: payload.status ?? 'processing',
      message: payload.message ?? 'MTN withdrawal initiated',
      data: result,
    };
  }

  private async beneficiaryMtnPayout(dto: CreatePayoutDto, user: AuthContext) {
    const result = await this.invokeMtnEdge('/beneficiary-payout', {
      merchantId: user.merchantId,
      organizationId: user.organizationId,
      amount: dto.amount,
      currency: dto.currency_code,
      recipientName: dto.recipient!.name,
      recipientPhone: dto.recipient!.phone,
      description: dto.reason ?? 'Beneficiary payout',
      metadata: dto.metadata ?? {},
    });

    const payload = result as {
      payoutId?: string;
      status?: string;
      message?: string;
    };

    return {
      success: true,
      payout_id: payload.payoutId,
      kind: 'beneficiary' as const,
      status: payload.status ?? 'processing',
      message: payload.message ?? 'Beneficiary payout initiated',
      data: result,
    };
  }

  private async invokeMtnEdge(
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .functions.invoke('mtn', {
        body: { path, method: 'POST', body },
      });

    if (error) {
      this.logger.error(`MTN edge ${path} failed: ${error.message}`);
      throw new InternalServerErrorException(`Payout failed: ${error.message}`);
    }

    const response = data as { error?: string } | null;
    if (response?.error) {
      throw new BadRequestException(response.error);
    }

    return data;
  }

  private async invokeWaveEdge(
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const { data, error } = await this.supabaseService
      .getClient()
      .functions.invoke('wave', {
        body: { path, method: 'POST', body },
      });

    if (error) {
      this.logger.error(`Wave edge ${path} failed: ${error.message}`);
      throw new InternalServerErrorException(`Payout failed: ${error.message}`);
    }

    const response = data as { error?: string } | null;
    if (response?.error) {
      throw new BadRequestException(response.error);
    }

    return data;
  }
}
