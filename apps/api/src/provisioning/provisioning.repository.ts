import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { CompleteProvisioningOnboardingDto } from './dto/complete-provisioning-onboarding.dto';

type QuotaRow = {
  allowed: boolean;
  accounts_created_today: number;
  daily_limit: number;
  message: string;
};

@Injectable()
export class ProvisioningRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async checkDailyQuota(provisioningKeyId: string): Promise<QuotaRow> {
    const { data, error } = await this.supabase.rpc(
      'check_provisioning_daily_quota' as never,
      { p_provisioning_key_id: provisioningKeyId } as never,
    );
    if (error) {
      throw error;
    }
    const row = (Array.isArray(data) ? data[0] : data) as
      | QuotaRow
      | null
      | undefined;
    if (!row) {
      throw new Error('Failed to check provisioning quota');
    }
    return row;
  }

  async incrementDailyUsage(provisioningKeyId: string): Promise<void> {
    const { error } = await this.supabase.rpc(
      'increment_provisioning_daily_usage' as never,
      { p_provisioning_key_id: provisioningKeyId } as never,
    );
    if (error) {
      throw error;
    }
  }

  async logAudit(input: {
    provisioningKeyId: string;
    action: string;
    merchantId?: string;
    organizationId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.supabase.rpc(
      'log_provisioning_audit' as never,
      {
        p_provisioning_key_id: input.provisioningKeyId,
        p_action: input.action,
        p_merchant_id: input.merchantId ?? null,
        p_organization_id: input.organizationId ?? null,
        p_ip_address: input.ipAddress ?? null,
        p_metadata: input.metadata ?? {},
      } as never,
    );
    if (error) {
      throw error;
    }
  }

  async registerMerchantAccount(input: {
    provisioningKeyId: string;
    merchantId: string;
    termsAcceptedAt: string;
    termsVersion: string;
  }): Promise<void> {
    const { error } = await this.supabase.rpc(
      'register_provisioning_merchant_account' as never,
      {
        p_provisioning_key_id: input.provisioningKeyId,
        p_merchant_id: input.merchantId,
        p_terms_accepted_at: input.termsAcceptedAt,
        p_terms_version: input.termsVersion,
      } as never,
    );
    if (error) {
      throw error;
    }
  }

  async verifyMerchantAccess(
    provisioningKeyId: string,
    merchantId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      'verify_provisioning_merchant_access' as never,
      {
        p_provisioning_key_id: provisioningKeyId,
        p_merchant_id: merchantId,
      } as never,
    );
    if (error) {
      throw error;
    }
    return data === true;
  }

  async linkOrganization(
    merchantId: string,
    organizationId: string,
  ): Promise<void> {
    const { error } = await this.supabase.rpc(
      'provisioning_link_organization' as never,
      {
        p_merchant_id: merchantId,
        p_organization_id: organizationId,
      } as never,
    );
    if (error) {
      throw error;
    }
  }

  async getOnboardingStatus(
    provisioningKeyId: string,
    merchantId: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.rpc(
      'provisioning_get_onboarding_status' as never,
      {
        p_provisioning_key_id: provisioningKeyId,
        p_merchant_id: merchantId,
      } as never,
    );
    if (error) {
      throw error;
    }
    return (data ?? {}) as Record<string, unknown>;
  }

  async fetchApiKeys(provisioningKeyId: string, merchantId: string) {
    const { data, error } = await this.supabase.rpc(
      'provisioning_fetch_api_keys' as never,
      {
        p_provisioning_key_id: provisioningKeyId,
        p_merchant_id: merchantId,
      } as never,
    );
    if (error) {
      throw error;
    }
    return (data ?? []) as Array<{
      name: string;
      api_key: string;
      key_type: string;
      environment: string;
      is_active: boolean;
    }>;
  }

  async completeOnboarding(
    merchantId: string,
    dto: CompleteProvisioningOnboardingDto,
  ): Promise<void> {
    const { error } = await this.supabase.rpc(
      'complete_onboarding' as never,
      {
        p_merchant_id: merchantId,
        p_first_name: dto.first_name,
        p_last_name: dto.last_name,
        p_phone_number: dto.phone_number,
        p_country: dto.country,
        p_org_name: dto.org_name,
        p_org_email: dto.org_email,
        p_org_phone_number: dto.org_phone_number ?? dto.phone_number,
        p_org_country: dto.org_country,
        p_org_region: dto.org_region,
        p_org_city: dto.org_city,
        p_org_street: dto.org_street ?? '',
        p_org_district: dto.org_district ?? '',
        p_org_postal_code: dto.org_postal_code ?? '',
        p_org_industry: dto.org_industry,
        p_org_website_url: dto.org_website_url ?? '',
        p_org_employee_number: dto.org_employee_number ?? '',
        p_preferred_language: dto.preferred_language ?? 'fr',
        p_avatar_url: dto.avatar_url ?? '',
        p_logo_url: dto.logo_url ?? '',
        p_organization_position: dto.organization_position,
        p_is_starter_business: dto.is_starter_business,
        p_is_authorized_signatory: dto.is_authorized_signatory ?? true,
        p_proof_of_business: dto.proof_of_business ?? null,
        p_proof_of_business_url: dto.proof_of_business_url ?? null,
        p_identity_proof_url: dto.identity_proof_url ?? null,
        p_signatory_name: dto.signatory_name ?? null,
        p_signatory_email: dto.signatory_email ?? null,
        p_address_proof_url: dto.address_proof_url ?? null,
        p_business_registration_url: dto.business_registration_url ?? null,
        p_tax_number: dto.tax_number ?? null,
        p_business_description: dto.business_description ?? null,
        p_legal_country: dto.legal_country ?? null,
        p_legal_region: dto.legal_region ?? null,
        p_legal_city: dto.legal_city ?? null,
        p_legal_street: dto.legal_street ?? null,
        p_legal_postal_code: dto.legal_postal_code ?? null,
        p_legal_organization_name: dto.legal_organization_name ?? null,
        p_document_extraction: dto.document_extraction ?? null,
        p_id_document_number: dto.id_document_number ?? null,
      } as never,
    );
    if (error) {
      throw error;
    }
  }

  async findOrganizationIdForMerchant(
    merchantId: string,
  ): Promise<string | null> {
    const { data, error } = await this.supabase.rpc(
      'get_active_merchant_organization' as never,
      { p_merchant_id: merchantId } as never,
    );
    if (error) {
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return (
      (row as { organization_id?: string } | null)?.organization_id ?? null
    );
  }

  async getOrganizationVerification(
    organizationId: string,
  ): Promise<{
    verification_status: string;
    is_starter_business: boolean;
  } | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('verification_status, is_starter_business')
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    return {
      verification_status: data.verification_status,
      is_starter_business: data.is_starter_business,
    };
  }

  async getKycStatus(
    merchantId: string,
    organizationId: string,
  ): Promise<string | null> {
    const { data, error } = await this.supabase.rpc(
      'get_organization_kyc_status' as never,
      {
        p_organization_id: organizationId,
        p_merchant_id: merchantId,
      } as never,
    );
    if (error) {
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return (row as { status?: string } | null)?.status ?? null;
  }

  async requestLiveActivation(
    provisioningKeyId: string,
    merchantId: string,
    metadata?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.rpc(
      'request_live_activation' as never,
      {
        p_provisioning_key_id: provisioningKeyId,
        p_merchant_id: merchantId,
        p_metadata: metadata ?? {},
      } as never,
    );
    if (error) {
      throw error;
    }
    return (data ?? {}) as Record<string, unknown>;
  }

  async getLiveActivationStatus(
    provisioningKeyId: string,
    merchantId: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.rpc(
      'get_live_activation_status' as never,
      {
        p_provisioning_key_id: provisioningKeyId,
        p_merchant_id: merchantId,
      } as never,
    );
    if (error) {
      throw error;
    }
    return (data ?? {}) as Record<string, unknown>;
  }
}
