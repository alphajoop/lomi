import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { UpdateRadarSettingsDto } from './dto/radar.dto';

@Injectable()
export class RadarService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async assertChargeAllowed(
    user: AuthContext,
    params: {
      amount: number;
      currencyCode: string;
      rail: 'card' | 'mtn' | 'wave';
      customerId: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    const { data, error } = await this.supabaseService.rpc(
      'evaluate_radar_for_charge' as never,
      {
        p_organization_id: user.organizationId,
        p_amount: params.amount,
        p_currency_code: params.currencyCode,
        p_rail: params.rail,
        p_customer_id: params.customerId,
        p_metadata: params.metadata ?? {},
        p_transaction_id: null,
        p_environment: user.environment ?? 'live',
      } as never,
    );

    if (error) {
      if (error.message.includes('radar_charge_blocked')) {
        throw new ForbiddenException('Charge blocked by lomi. Radar');
      }
      throw new BadRequestException(error.message);
    }

    if (
      data &&
      typeof data === 'object' &&
      (data as { allowed?: boolean }).allowed === false
    ) {
      throw new ForbiddenException('Charge blocked by lomi. Radar');
    }
  }

  async listAssessments(
    user: AuthContext,
    decision?: string,
    rail?: string,
    page = 1,
    pageSize = 50,
    startDate?: string,
    endDate?: string,
  ) {
    const { data, error } = await this.supabaseService.rpc(
      'fetch_risk_assessments' as never,
      {
        p_organization_id: user.organizationId,
        p_page: page,
        p_page_size: pageSize,
        p_decision: decision ?? null,
        p_rail: rail ?? null,
        p_start_date: startDate ?? null,
        p_end_date: endDate ?? null,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, data: data ?? [] };
  }

  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabaseService.rpc(
      'get_risk_assessment_api' as never,
      {
        p_assessment_id: id,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      throw new NotFoundException('Risk assessment not found');
    }

    return { success: true, data: rows[0] };
  }

  async getSettings(user: AuthContext) {
    const { data, error } = await this.supabaseService.rpc(
      'get_organization_radar_settings_api' as never,
      {
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    return { success: true, data: rows[0] ?? null };
  }

  async updateSettings(user: AuthContext, dto: UpdateRadarSettingsDto) {
    const { data, error } = await this.supabaseService.rpc(
      'update_organization_radar_settings_api' as never,
      {
        p_organization_id: user.organizationId,
        p_enabled: dto.enabled ?? null,
        p_mode: dto.mode ?? null,
        p_stripe_radar_passthrough: dto.stripe_radar_passthrough ?? null,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    return { success: true, data: rows[0] ?? null };
  }
}
