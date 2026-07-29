import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';

@Injectable()
export class EntitlementsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(
    user: AuthContext,
    body: { feature_key: string; name: string; description?: string },
  ) {
    const { data, error } = await this.supabase.getClient().rpc(
      'create_entitlement' as never,
      {
        p_organization_id: user.organizationId,
        p_feature_key: body.feature_key,
        p_name: body.name,
        p_description: body.description ?? null,
      } as never,
    );

    if (error) throw new Error(error.message);
    return { entitlement_id: data };
  }

  async check(user: AuthContext, customerId: string, featureKey: string) {
    const { data, error } = await this.supabase.getClient().rpc(
      'check_entitlement' as never,
      {
        p_organization_id: user.organizationId,
        p_customer_id: customerId,
        p_feature_key: featureKey,
      } as never,
    );

    if (error) throw new Error(error.message);
    return data;
  }
}
