import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';

@Injectable()
export class PartnersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async mintProvisioningKey(input: {
    partnerId: string;
    name: string;
    externalUserRef?: string;
    environment: 'test' | 'live';
  }) {
    const { data, error } = await this.supabase.rpc(
      'partner_mint_provisioning_key' as never,
      {
        p_partner_id: input.partnerId,
        p_name: input.name,
        p_external_user_ref: input.externalUserRef ?? null,
        p_environment: input.environment,
        p_key_kind: 'partner_subkey',
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as
      | {
          provisioning_key_id: string;
          provisioning_key: string;
          name: string;
          partner_name: string;
          environment: string;
          external_user_ref: string | null;
          key_kind: string;
        }
      | undefined;
    if (!row) throw new Error('Failed to mint provisioning key');
    return row;
  }

  async listProvisioningKeys(
    partnerId: string,
    limit: number,
    offset: number,
    includeInactive: boolean,
  ) {
    const { data, error } = await this.supabase.rpc(
      'partner_list_provisioning_keys' as never,
      {
        p_partner_id: partnerId,
        p_limit: limit,
        p_offset: offset,
        p_include_inactive: includeInactive,
      } as never,
    );
    if (error) throw error;
    return (data ?? []) as Array<Record<string, unknown>>;
  }

  async revokeProvisioningKey(
    partnerId: string,
    provisioningKeyId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      'partner_revoke_provisioning_key' as never,
      {
        p_partner_id: partnerId,
        p_provisioning_key_id: provisioningKeyId,
      } as never,
    );
    if (error) throw error;
    return data === true;
  }

  async getUsageSummary(partnerId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_partner_usage_summary' as never,
      { p_partner_id: partnerId } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as
      Record<string, unknown> | undefined;
    if (!row) throw new Error('Failed to load partner usage');
    return row;
  }
}
