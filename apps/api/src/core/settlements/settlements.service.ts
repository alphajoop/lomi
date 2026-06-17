import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';

const SETTLEMENT_ID_PATTERN = /^[A-Z]{3}:\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class SettlementsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(
    user: AuthContext,
    page = 1,
    pageSize = 50,
    startDate?: string,
    endDate?: string,
    currency?: string,
  ) {
    const { data, error } = await this.supabaseService.rpc(
      'fetch_settlement_periods' as never,
      {
        p_organization_id: user.organizationId,
        p_start_date: startDate ?? null,
        p_end_date: endDate ?? null,
        p_currency: currency ?? null,
        p_page: page,
        p_page_size: pageSize,
        p_environment: environmentFromAuth(user),
        p_merchant_id: user.merchantId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }

  async findTransactions(
    user: AuthContext,
    settlementId: string,
    page = 1,
    pageSize = 50,
  ) {
    if (!SETTLEMENT_ID_PATTERN.test(settlementId)) {
      throw new BadRequestException(
        'Invalid settlement id. Expected format: {currency}:{YYYY-MM-DD} (for example XOF:2026-06-01).',
      );
    }

    const { data, error } = await this.supabaseService.rpc(
      'fetch_settlement_transactions' as never,
      {
        p_organization_id: user.organizationId,
        p_settlement_id: settlementId,
        p_page: page,
        p_page_size: pageSize,
        p_environment: environmentFromAuth(user),
        p_merchant_id: user.merchantId,
      } as never,
    );

    if (error) {
      if (error.message.includes('Invalid settlement_id')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }
}
