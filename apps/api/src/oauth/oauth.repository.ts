import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';

@Injectable()
export class OAuthRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async registerClient(input: {
    clientName: string;
    redirectUris: string[];
    grantTypes?: string[];
    responseTypes?: string[];
    tokenEndpointAuthMethod?: string;
    scopes?: string[];
  }) {
    const { data, error } = await this.supabase.rpc(
      'oauth_register_client' as never,
      {
        p_client_name: input.clientName,
        p_redirect_uris: input.redirectUris,
        p_grant_types: input.grantTypes ?? [
          'authorization_code',
          'refresh_token',
        ],
        p_response_types: input.responseTypes ?? ['code'],
        p_token_endpoint_auth_method: input.tokenEndpointAuthMethod ?? 'none',
        p_scopes: input.scopes ?? ['provisioning.onboard'],
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as Record<
      string,
      unknown
    >;
    if (!row) throw new Error('Failed to register OAuth client');
    return row;
  }

  async getClient(clientId: string) {
    const { data, error } = await this.supabase.rpc(
      'oauth_get_client' as never,
      { p_client_id: clientId } as never,
    );
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) as Record<
      string,
      unknown
    > | null;
  }

  async getOrCreateSelfServicePartner(userId: string, email: string) {
    const { data, error } = await this.supabase.rpc(
      'get_or_create_self_service_partner' as never,
      { p_user_id: userId, p_email: email } as never,
    );
    if (error) throw error;
    if (!data) throw new Error('Failed to create self-service partner');
    return data as string;
  }

  async mintSelfServiceProvisioningKey(partnerId: string, userId: string) {
    const { data, error } = await this.supabase.rpc(
      'partner_mint_provisioning_key' as never,
      {
        p_partner_id: partnerId,
        p_name: 'Agent self-service',
        p_external_user_ref: userId,
        p_environment: 'test',
        p_key_kind: 'self_service',
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as
      | { provisioning_key_id: string; provisioning_key: string }
      | undefined;
    if (!row) throw new Error('Failed to mint self-service provisioning key');
    return row;
  }

  async findActiveSelfServiceKey(partnerId: string, userId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_active_partner_provisioning_key' as never,
      {
        p_partner_id: partnerId,
        p_external_user_ref: userId,
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as
      | { provisioning_key_id: string; provisioning_key: string }
      | undefined;
    return row ?? null;
  }

  async createAuthorizationCode(input: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    resource?: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    provisioningKeyId: string;
  }) {
    const { data, error } = await this.supabase.rpc(
      'oauth_create_authorization_code' as never,
      {
        p_client_id: input.clientId,
        p_user_id: input.userId,
        p_redirect_uri: input.redirectUri,
        p_scope: input.scope,
        p_resource: input.resource ?? null,
        p_code_challenge: input.codeChallenge,
        p_code_challenge_method: input.codeChallengeMethod,
        p_provisioning_key_id: input.provisioningKeyId,
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as
      | { code: string; expires_at: string }
      | undefined;
    if (!row) throw new Error('Failed to create authorization code');
    return row;
  }

  async exchangeAuthorizationCode(input: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
  }) {
    const { data, error } = await this.supabase.rpc(
      'oauth_exchange_authorization_code' as never,
      {
        p_code: input.code,
        p_client_id: input.clientId,
        p_redirect_uri: input.redirectUri,
        p_code_verifier: input.codeVerifier,
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as Record<
      string,
      unknown
    >;
    if (!row) throw new Error('Failed to exchange authorization code');
    return row;
  }

  async refreshAccessToken(refreshToken: string, clientId: string) {
    const { data, error } = await this.supabase.rpc(
      'oauth_refresh_access_token' as never,
      {
        p_refresh_token: refreshToken,
        p_client_id: clientId,
      } as never,
    );
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as unknown as Record<
      string,
      unknown
    >;
    if (!row) throw new Error('Failed to refresh token');
    return row;
  }

  async introspectToken(token: string) {
    const { data, error } = await this.supabase.rpc(
      'oauth_introspect_token' as never,
      { p_token: token } as never,
    );
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) as Record<
      string,
      unknown
    > | null;
  }

  async verifyClientSecret(
    clientId: string,
    clientSecret: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      'oauth_verify_client_secret' as never,
      {
        p_client_id: clientId,
        p_client_secret: clientSecret,
      } as never,
    );
    if (error) throw error;
    return data === true;
  }

  async revokeToken(token: string) {
    const { data, error } = await this.supabase.rpc(
      'oauth_revoke_token' as never,
      { p_token: token } as never,
    );
    if (error) throw error;
    return data === true;
  }

  async isEmailVerified(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('merchants')
      .select('email')
      .eq('merchant_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.email) {
      const admin = this.supabase.getClient();
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      return Boolean(userData.user?.email_confirmed_at);
    }
    const { data: userData, error: userError } = await this.supabase
      .getClient()
      .auth.admin.getUserById(userId);
    if (userError) return false;
    return Boolean(userData.user?.email_confirmed_at);
  }
}
