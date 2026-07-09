import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthRepository } from './oauth.repository';
import {
  isMerchantOAuthEnabled,
  isMerchantScopeRequest,
  normalizeMerchantScope,
  resolveMerchantAccessLevel,
} from './merchant-oauth';

export interface OAuthAuthorizeParams {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope?: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod?: string;
  resource?: string;
}

export interface OAuthConsentParams extends OAuthAuthorizeParams {
  userId: string;
  email?: string;
  approved: boolean;
  organizationId?: string;
  accessLevel?: 'read' | 'write';
  environment?: 'test' | 'live';
}

@Injectable()
export class OAuthService {
  constructor(private readonly repository: OAuthRepository) {}

  getAuthorizationServerMetadata(issuer: string) {
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      introspection_endpoint: `${issuer}/oauth/introspect`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      scopes_supported: isMerchantOAuthEnabled()
        ? ['provisioning.onboard', 'merchant.read', 'merchant.write']
        : ['provisioning.onboard'],
    };
  }

  async registerClient(body: {
    client_name: string;
    redirect_uris: string[];
    grant_types?: string[];
    response_types?: string[];
    token_endpoint_auth_method?: string;
    scope?: string;
  }) {
    if (!body.client_name?.trim() || !body.redirect_uris?.length) {
      throw new BadRequestException(
        'client_name and redirect_uris are required',
      );
    }
    const scopes = body.scope
      ? body.scope.split(' ').filter(Boolean)
      : ['provisioning.onboard'];
    return this.repository.registerClient({
      clientName: body.client_name.trim(),
      redirectUris: body.redirect_uris,
      grantTypes: body.grant_types,
      responseTypes: body.response_types,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method,
      scopes,
    });
  }

  buildAuthorizeRedirect(
    dashboardBaseUrl: string,
    params: OAuthAuthorizeParams,
  ): string {
    this.assertAuthorizeParams(params);
    const url = new URL('/connect/agent-connect', dashboardBaseUrl);
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', params.responseType);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set(
      'code_challenge_method',
      params.codeChallengeMethod ?? 'S256',
    );
    if (params.scope) url.searchParams.set('scope', params.scope);
    if (params.state) url.searchParams.set('state', params.state);
    if (params.resource) url.searchParams.set('resource', params.resource);
    return url.toString();
  }

  async validateAuthorizeParams(params: OAuthAuthorizeParams): Promise<void> {
    this.assertAuthorizeParams(params);
    const client = await this.repository.getClient(params.clientId);
    if (!client) {
      throw new BadRequestException('Unknown client_id');
    }
    const redirectUris = client.redirect_uris as string[];
    if (!redirectUris.includes(params.redirectUri)) {
      throw new BadRequestException('Invalid redirect_uri');
    }
  }

  async handleConsent(params: OAuthConsentParams) {
    await this.validateAuthorizeParams(params);

    if (!params.approved) {
      const url = new URL(params.redirectUri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'User denied consent');
      if (params.state) url.searchParams.set('state', params.state);
      return { redirect_url: url.toString() };
    }

    const verified = await this.repository.isEmailVerified(params.userId);
    if (!verified) {
      throw new ForbiddenException(
        'Verified email required before connecting an agent',
      );
    }

    const merchantGrant = isMerchantScopeRequest(params.scope);

    if (merchantGrant) {
      if (!isMerchantOAuthEnabled()) {
        throw new BadRequestException('Merchant OAuth connections are disabled');
      }
      if (!params.organizationId) {
        throw new BadRequestException('organization_id is required');
      }

      const client = await this.repository.getClient(params.clientId);
      const clientName =
        typeof client?.client_name === 'string'
          ? client.client_name
          : 'MCP client';
      const accessLevel =
        params.accessLevel ?? resolveMerchantAccessLevel(params.scope);
      const environment = params.environment === 'live' ? 'live' : 'test';
      const connectionKey = await this.repository.mintMerchantConnectionKey({
        merchantId: params.userId,
        organizationId: params.organizationId,
        clientName,
        accessLevel,
        environment,
      });

      const codeRow = await this.repository.createAuthorizationCode({
        clientId: params.clientId,
        userId: params.userId,
        redirectUri: params.redirectUri,
        scope: normalizeMerchantScope(accessLevel),
        resource: params.resource,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod ?? 'S256',
        grantType: 'merchant',
        organizationId: params.organizationId,
        apiKey: connectionKey,
      });

      const redirectUrl = new URL(params.redirectUri);
      redirectUrl.searchParams.set('code', codeRow.code);
      if (params.state) redirectUrl.searchParams.set('state', params.state);
      return { redirect_url: redirectUrl.toString() };
    }

    const partnerId = await this.repository.getOrCreateSelfServicePartner(
      params.userId,
      params.email ?? '',
    );

    let provisioningKey = await this.repository.findActiveSelfServiceKey(
      partnerId,
      params.userId,
    );
    if (!provisioningKey) {
      provisioningKey = await this.repository.mintSelfServiceProvisioningKey(
        partnerId,
        params.userId,
      );
    }

    const codeRow = await this.repository.createAuthorizationCode({
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      scope: params.scope ?? 'provisioning.onboard',
      resource: params.resource,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod ?? 'S256',
      provisioningKeyId: provisioningKey.provisioning_key_id,
      grantType: 'provisioning',
    });

    const redirectUrl = new URL(params.redirectUri);
    redirectUrl.searchParams.set('code', codeRow.code);
    if (params.state) redirectUrl.searchParams.set('state', params.state);

    return { redirect_url: redirectUrl.toString() };
  }

  async token(body: Record<string, string>) {
    const grantType = body.grant_type;
    if (grantType === 'authorization_code') {
      if (
        !body.code ||
        !body.client_id ||
        !body.redirect_uri ||
        !body.code_verifier
      ) {
        throw new BadRequestException('Missing token request parameters');
      }
      try {
        return await this.repository.exchangeAuthorizationCode({
          code: body.code,
          clientId: body.client_id,
          redirectUri: body.redirect_uri,
          codeVerifier: body.code_verifier,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Token exchange failed';
        throw new BadRequestException(message);
      }
    }

    if (grantType === 'refresh_token') {
      if (!body.refresh_token || !body.client_id) {
        throw new BadRequestException('Missing refresh token parameters');
      }
      try {
        return await this.repository.refreshAccessToken(
          body.refresh_token,
          body.client_id,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Refresh failed';
        throw new BadRequestException(message);
      }
    }

    throw new BadRequestException('Unsupported grant_type');
  }

  async introspect(body: {
    token?: string;
    client_id?: string;
    client_secret?: string;
  }) {
    if (!body.token) {
      throw new BadRequestException('token is required');
    }
    if (!body.client_id) {
      throw new BadRequestException('client_id is required');
    }

    await this.assertClientAuthenticated(body.client_id, body.client_secret);

    const row = await this.repository.introspectToken(body.token);
    if (!row?.active) {
      return { active: false };
    }

    if (row.client_id !== body.client_id) {
      throw new ForbiddenException('client_id does not match token');
    }

    return {
      active: true,
      scope: row.scope,
      exp: row.exp,
      client_id: row.client_id,
      sub: row.sub,
      provisioning_key_id: row.provisioning_key_id,
      token_type: row.token_type,
    };
  }

  /** Trusted MCP server only, returns provisioning_key or merchant connection_key. */
  async introspectMcp(body: { token?: string }) {
    if (!body.token) {
      throw new BadRequestException('token is required');
    }
    const row = await this.repository.introspectToken(body.token);
    if (!row?.active) {
      return { active: false };
    }
    return {
      active: true,
      scope: row.scope,
      exp: row.exp,
      grant_type: row.grant_type,
      organization_id: row.organization_id,
      access_level: row.access_level,
      connection_key: row.connection_key,
      provisioning_key: row.provisioning_key,
      provisioning_key_id: row.provisioning_key_id,
    };
  }

  private async assertClientAuthenticated(
    clientId: string,
    clientSecret?: string,
  ): Promise<void> {
    const client = await this.repository.getClient(clientId);
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const authMethod = String(client.token_endpoint_auth_method ?? 'none');
    if (authMethod === 'none') {
      return;
    }

    if (!clientSecret) {
      throw new UnauthorizedException('client_secret is required');
    }

    const valid = await this.repository.verifyClientSecret(
      clientId,
      clientSecret,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid client credentials');
    }
  }

  async revoke(body: { token?: string }) {
    if (!body.token) {
      throw new BadRequestException('token is required');
    }
    await this.repository.revokeToken(body.token);
    return { revoked: true };
  }

  private assertAuthorizeParams(params: OAuthAuthorizeParams): void {
    if (params.responseType !== 'code') {
      throw new BadRequestException('Only response_type=code is supported');
    }
    if (!params.clientId || !params.redirectUri || !params.codeChallenge) {
      throw new BadRequestException('Missing required OAuth parameters');
    }
    if ((params.codeChallengeMethod ?? 'S256') !== 'S256') {
      throw new BadRequestException('Only S256 code challenge is supported');
    }
  }
}
