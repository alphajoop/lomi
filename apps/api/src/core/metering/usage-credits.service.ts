import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { MetersService } from './meters.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';

@Injectable()
export class UsageCreditsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly metersService: MetersService,
  ) {}

  async credit(user: AuthContext, dto: CreditWalletDto) {
    await this.metersService.findOne(dto.meter_id, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'credit_usage_wallet' as never,
      {
        p_meter_id: dto.meter_id,
        p_customer_id: dto.customer_id,
        p_units: dto.units,
        p_reason: dto.reason ?? 'top_up',
      } as never,
    );

    if (error) throw new Error(error.message);
    return data;
  }
}
