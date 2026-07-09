import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { type CurrencyCode } from '../../utils/types/api';

@Injectable()
export class MerchantsService {
  constructor(private readonly supabase: SupabaseService) {}

  private assertMerchantAccess(merchantId: string, user: AuthContext): void {
    if (merchantId !== user.merchantId) {
      throw new ForbiddenException(
        'Access denied: merchant ID does not match API key',
      );
    }
  }

  private wrap<T>(data: T) {
    return { success: true as const, data };
  }

  async getDetails(merchantId: string, user: AuthContext) {
    this.assertMerchantAccess(merchantId, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'get_merchant_details' as never,
      {
        p_merchant_id: merchantId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new NotFoundException(error.message);
    }

    const rows = data as Record<string, unknown>[] | null;
    if (!rows?.length) {
      throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
    }

    return this.wrap(rows[0]);
  }

  async getMrr(merchantId: string, user: AuthContext) {
    this.assertMerchantAccess(merchantId, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'get_merchant_mrr' as never,
      {
        p_merchant_id: merchantId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new NotFoundException(error.message);
    }

    const rows = data as Record<string, unknown>[] | null;
    if (!rows?.length) {
      throw new NotFoundException(`MRR not found for merchant ${merchantId}`);
    }

    const row = rows[0];
    return this.wrap({
      merchant_id: row.merchant_id,
      mrr: Number(row.mrr ?? 0),
      currency_code: row.currency_code ?? 'XOF',
      as_of_date: new Date().toISOString(),
    });
  }

  async getArr(merchantId: string, user: AuthContext) {
    this.assertMerchantAccess(merchantId, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'get_merchant_arr' as never,
      {
        p_merchant_id: merchantId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new NotFoundException(error.message);
    }

    const rows = data as Record<string, unknown>[] | null;
    if (!rows?.length) {
      throw new NotFoundException(`ARR not found for merchant ${merchantId}`);
    }

    const row = rows[0];
    return this.wrap({
      merchant_id: row.merchant_id,
      arr: Number(row.arr ?? 0),
      currency_code: row.currency_code ?? 'XOF',
      as_of_date: new Date().toISOString(),
    });
  }

  async getBalance(
    merchantId: string,
    user: AuthContext,
    currencyCode: CurrencyCode,
  ) {
    this.assertMerchantAccess(merchantId, user);

    if (!currencyCode) {
      throw new BadRequestException(
        'currency_code query parameter is required',
      );
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'get_merchant_balance' as never,
      {
        p_merchant_id: merchantId,
        p_organization_id: user.organizationId,
        p_currency_code: currencyCode,
      } as never,
    );

    if (error) {
      if (error.message?.includes('No account found')) {
        throw new NotFoundException(error.message);
      }
      throw new NotFoundException(error.message);
    }

    const rows = data as Record<string, unknown>[] | null;
    if (!rows?.length) {
      throw new NotFoundException(
        `No balance found for currency ${currencyCode}`,
      );
    }

    const row = rows[0];
    return this.wrap({
      merchant_id: row.merchant_id,
      currency_code: row.currency_code,
      balance: Number(row.balance ?? 0),
      as_of_date: row.as_of_date ?? new Date().toISOString(),
    });
  }
}
