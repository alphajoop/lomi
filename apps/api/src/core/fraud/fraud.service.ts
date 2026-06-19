import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { UpdateFraudAlertDto, UpdateFraudRuleDto } from './dto/fraud.dto';

@Injectable()
export class FraudService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listRules(user: AuthContext) {
    const { data, error } = await this.supabaseService.rpc(
      'fetch_fraud_rules_for_org' as never,
      { p_organization_id: user.organizationId } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, data: data ?? [] };
  }

  async updateRule(
    user: AuthContext,
    ruleId: string,
    dto: UpdateFraudRuleDto,
  ) {
    const { data, error } = await this.supabaseService.rpc(
      'upsert_organization_fraud_setting' as never,
      {
        p_organization_id: user.organizationId,
        p_rule_id: ruleId,
        p_is_enabled: dto.is_enabled ?? true,
        p_custom_threshold: dto.custom_threshold ?? null,
        p_custom_action: dto.custom_action ?? null,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.success === false) {
      throw new BadRequestException(result.error ?? 'Failed to update rule');
    }

    return { success: true, data: result };
  }

  async listAlerts(
    user: AuthContext,
    status?: string,
    page = 1,
    pageSize = 50,
  ) {
    const { data, error } = await this.supabaseService.rpc(
      'fetch_fraud_alerts' as never,
      {
        p_organization_id: user.organizationId,
        p_page: page,
        p_page_size: pageSize,
        p_status: status ?? null,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, data: data ?? [] };
  }

  async updateAlert(
    user: AuthContext,
    alertId: string,
    dto: UpdateFraudAlertDto,
  ) {
    const { data, error } = await this.supabaseService.rpc(
      'update_fraud_alert_status' as never,
      {
        p_alert_id: alertId,
        p_organization_id: user.organizationId,
        p_status: dto.status,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.success === false) {
      throw new NotFoundException(result.error ?? 'Alert not found');
    }

    return { success: true, data: result };
  }
}
