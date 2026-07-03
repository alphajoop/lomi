import { pickString, unwrapData, validateMerchantFacingError } from '../assert';
import type { CheckDefinition, SuiteContext } from '../types';

/** Minimal 1×1 PNG for KYC document upload synthetics. */
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function provisioningKey(): string | undefined {
  return process.env.LOMI_PROVISIONING_KEY?.trim() || undefined;
}

function partnerKey(): string | undefined {
  return process.env.LOMI_PARTNER_KEY?.trim() || undefined;
}

function provisioningHeaders(): Record<string, string> {
  const key = provisioningKey();
  if (!key) return {};
  return { 'x-lomi-provisioning-key': key };
}

function partnerHeaders(): Record<string, string> {
  const key = partnerKey();
  if (!key) return {};
  return { 'x-lomi-partner-key': key };
}

function mintedProvisioningHeaders(ctx: SuiteContext): Record<string, string> {
  const key =
    typeof ctx.mintedProvisioningKey === 'string'
      ? ctx.mintedProvisioningKey
      : undefined;
  if (!key) return {};
  return { 'x-lomi-provisioning-key': key };
}

function synthProvisioningEmail(ctx: SuiteContext): string {
  return `agent-synth+${ctx.runId}@lomi.test`;
}

function skipWithoutProvisioningKey(): string | null {
  return provisioningKey()
    ? null
    : 'LOMI_PROVISIONING_KEY not set (lomi_prov_* for agent flow synthetics)';
}

function skipWithoutPartnerKey(): string | null {
  return partnerKey()
    ? null
    : 'LOMI_PARTNER_KEY not set (lomi_partner_* for partner flow synthetics)';
}

function assertNoLiveSecretsInKeys(body: unknown): string | null {
  const data = unwrapData(body);
  const items = Array.isArray(data) ? data : [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const env = row.environment;
    const keyType = row.key_type;
    const apiKey = row.api_key;
    if (keyType === 'secret' && env === 'live') {
      return 'Provisioning API must not return live secret keys';
    }
    if (typeof apiKey === 'string' && apiKey.includes('lomi_sk_live_')) {
      return 'Provisioning API must not return lomi_sk_live_* secrets';
    }
  }
  return null;
}

/** Unauthenticated smoke checks for agent onboarding surfaces (no secrets required). */
export function createAgentOnboardingChecks(): CheckDefinition[] {
  return [
    {
      name: 'oauth authorization server metadata',
      service: 'oauth',
      method: 'GET',
      path: '/.well-known/oauth-authorization-server',
      auth: false,
      expectStatus: 200,
      validate: (_ctx, res) => {
        const body = res.data as Record<string, unknown>;
        return body?.issuer && body?.authorization_endpoint
          ? null
          : 'Expected OAuth AS metadata fields';
      },
    },
    {
      name: 'oauth dynamic client registration',
      service: 'oauth',
      method: 'POST',
      path: '/oauth/register',
      auth: false,
      expectStatus: [200, 201],
      body: (ctx) => ({
        client_name: `API synthetics ${ctx.runId}`,
        redirect_uris: ['https://dashboard.lomi.africa/connect/agent-connect'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        scope: 'provisioning.onboard',
      }),
      validate: (_ctx, res) => {
        const body = res.data as Record<string, unknown>;
        return typeof body?.client_id === 'string' && body.client_id.length > 0
          ? null
          : 'Expected client_id from DCR';
      },
    },
    {
      name: 'oauth introspect rejects missing token',
      service: 'oauth',
      method: 'POST',
      path: '/oauth/introspect',
      auth: false,
      expectStatus: [400, 401],
      body: {},
      validate: (_ctx, res) => validateMerchantFacingError(res.data),
    },
    {
      name: 'provisioning rejects missing key',
      service: 'provisioning',
      method: 'GET',
      path: '/provisioning/v1/merchants/00000000-0000-0000-0000-000000000001/onboarding/status',
      auth: false,
      expectStatus: 401,
      validate: (_ctx, res) => validateMerchantFacingError(res.data),
    },
    {
      name: 'partners rejects missing key',
      service: 'partners',
      method: 'GET',
      path: '/partners/v1/usage',
      auth: false,
      expectStatus: 401,
      validate: (_ctx, res) => validateMerchantFacingError(res.data),
    },
    {
      name: 'agent capabilities',
      service: 'agent',
      method: 'GET',
      path: '/agent/capabilities',
      auth: false,
      expectStatus: 200,
      validate: (_ctx, res) => {
        const body = res.data as Record<string, unknown>;
        const features = body?.features as Record<string, unknown> | undefined;
        return features?.provisioning_api ? null : 'Expected features.provisioning_api';
      },
    },
  ];
}

/** Partner API flow: mint → list → usage (requires LOMI_PARTNER_KEY). */
export function createPartnerFlowChecks(): CheckDefinition[] {
  return [
    {
      name: 'partner usage summary',
      service: 'partners',
      method: 'GET',
      path: '/partners/v1/usage',
      auth: false,
      headers: partnerHeaders,
      skipIf: skipWithoutPartnerKey,
      expectStatus: 200,
      validate: (_ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        return data && typeof data === 'object' ? null : 'Expected usage summary object';
      },
    },
    {
      name: 'partner mint provisioning key',
      service: 'partners',
      method: 'POST',
      path: '/partners/v1/provisioning-keys',
      auth: false,
      headers: partnerHeaders,
      skipIf: skipWithoutPartnerKey,
      expectStatus: 201,
      body: (ctx) => ({
        name: `Synthetics ${ctx.runId}`,
        external_user_ref: `synth-${ctx.runId}`,
        environment: 'test',
      }),
      capture: (ctx, res) => {
        const key = pickString(res.data, 'provisioning_key');
        const id = pickString(res.data, 'provisioning_key_id');
        if (key) ctx.mintedProvisioningKey = key;
        if (id) ctx.mintedProvisioningKeyId = id;
      },
      validate: (_ctx, res) => {
        const key = pickString(res.data, 'provisioning_key');
        return key?.startsWith('lomi_prov_')
          ? null
          : 'Expected lomi_prov_* from partner mint';
      },
    },
    {
      name: 'partner list provisioning keys',
      service: 'partners',
      method: 'GET',
      path: '/partners/v1/provisioning-keys?limit=10',
      auth: false,
      headers: partnerHeaders,
      skipIf: skipWithoutPartnerKey,
      expectStatus: 200,
      validate: (ctx, res) => {
        const data = unwrapData(res.data);
        if (!Array.isArray(data)) {
          return 'Expected array of provisioning keys';
        }
        if (ctx.mintedProvisioningKeyId) {
          const found = data.some(
            (row) =>
              row &&
              typeof row === 'object' &&
              (row as Record<string, unknown>).provisioning_key_id ===
                ctx.mintedProvisioningKeyId,
          );
          if (!found) {
            return 'Minted provisioning key not found in partner list';
          }
        }
        return null;
      },
    },
    {
      name: 'partner-minted provisioning create account',
      service: 'provisioning',
      method: 'POST',
      path: '/provisioning/v1/accounts',
      auth: false,
      headers: mintedProvisioningHeaders,
      skipIf: (ctx) => {
        const partnerSkip = skipWithoutPartnerKey();
        if (partnerSkip) return partnerSkip;
        return typeof ctx.mintedProvisioningKey === 'string'
          ? null
          : 'mintedProvisioningKey not captured from partner mint';
      },
      expectStatus: 201,
      body: (ctx) => ({
        email: `partner-synth+${ctx.runId}@lomi.test`,
        password: 'SynthPass123!',
        full_name: 'Partner Synth Merchant',
        terms_accepted_at: new Date().toISOString(),
        terms_version: '2026-07-01',
        preferred_language: 'en',
      }),
      capture: (ctx, res) => {
        const merchantId = pickString(res.data, 'merchant_id');
        if (merchantId) ctx.partnerMerchantId = merchantId;
      },
      validate: (_ctx, res) =>
        pickString(res.data, 'merchant_id') ? null : 'Expected merchant_id',
    },
    {
      name: 'partner revoke minted provisioning key',
      service: 'partners',
      method: 'DELETE',
      path: (ctx) =>
        `/partners/v1/provisioning-keys/${ctx.mintedProvisioningKeyId}`,
      auth: false,
      headers: partnerHeaders,
      skipIf: (ctx) => {
        const partnerSkip = skipWithoutPartnerKey();
        if (partnerSkip) return partnerSkip;
        return typeof ctx.mintedProvisioningKeyId === 'string'
          ? null
          : 'mintedProvisioningKeyId not captured';
      },
      expectStatus: 200,
    },
  ];
}

/**
 * Full agent provisioning flow (requires LOMI_PROVISIONING_KEY):
 * account → KYC upload → complete → test keys → live activation request/status.
 */
export function createAgentProvisioningFlowChecks(): CheckDefinition[] {
  return [
    {
      name: 'provisioning create account',
      service: 'provisioning',
      method: 'POST',
      path: '/provisioning/v1/accounts',
      auth: false,
      headers: provisioningHeaders,
      skipIf: skipWithoutProvisioningKey,
      expectStatus: 201,
      body: (ctx) => ({
        email: synthProvisioningEmail(ctx),
        password: 'SynthPass123!',
        full_name: 'Agent Synth Merchant',
        terms_accepted_at: new Date().toISOString(),
        terms_version: '2026-07-01',
        preferred_language: 'en',
      }),
      capture: (ctx, res) => {
        const merchantId = pickString(res.data, 'merchant_id');
        if (merchantId) ctx.provisionedMerchantId = merchantId;
      },
      validate: (_ctx, res) => {
        const merchantId = pickString(res.data, 'merchant_id');
        const env = pickString(res.data, 'environment');
        if (!merchantId) return 'Expected merchant_id';
        return env === 'test' ? null : 'Expected test environment for provisioning account';
      },
    },
    {
      name: 'provisioning upload identity document',
      service: 'provisioning',
      method: 'POST',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/onboarding/documents`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return ctx.provisionedMerchantId
          ? null
          : 'provisionedMerchantId not captured';
      },
      expectStatus: 201,
      body: {
        document_type: 'identity',
        content_base64: TINY_PNG_BASE64,
        content_type: 'image/png',
        file_name: 'synthetics-id.png',
      },
      capture: (ctx, res) => {
        const url = pickString(res.data, 'public_url');
        const path = pickString(res.data, 'storage_path');
        if (url) ctx.provisionedIdentityUrl = url;
        if (path) ctx.provisionedIdentityPath = path;
      },
      validate: (_ctx, res) =>
        pickString(res.data, 'public_url') ? null : 'Expected public_url for uploaded document',
    },
    {
      name: 'provisioning complete onboarding',
      service: 'provisioning',
      method: 'POST',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/onboarding/complete`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        if (!ctx.provisionedMerchantId) return 'provisionedMerchantId not captured';
        if (!ctx.provisionedIdentityUrl) return 'provisionedIdentityUrl not captured';
        return null;
      },
      expectStatus: 201,
      body: (ctx) => ({
        first_name: 'Agent',
        last_name: 'Synth',
        phone_number: `+22170${ctx.runId.replace(/-/g, '').slice(0, 7)}`,
        country: 'SN',
        org_name: `Synth Org ${ctx.runId.slice(0, 8)}`,
        org_email: synthProvisioningEmail(ctx),
        org_country: 'SN',
        org_region: 'Dakar',
        org_city: 'Dakar',
        org_industry: 'technology',
        organization_position: 'founder',
        is_starter_business: true,
        identity_proof_url: ctx.provisionedIdentityUrl,
      }),
      capture: (ctx, res) => {
        const orgId = pickString(res.data, 'organization_id');
        const testKey = pickString(res.data, 'test_secret_key');
        if (orgId) ctx.provisionedOrganizationId = orgId;
        if (testKey) ctx.provisionedTestKey = testKey;
      },
      validate: (_ctx, res) => {
        const status = pickString(res.data, 'onboarding_status');
        const testKey = pickString(res.data, 'test_secret_key');
        if (status !== 'completed') return 'Expected onboarding_status completed';
        if (!testKey?.startsWith('lomi_sk_test_')) {
          return 'Expected lomi_sk_test_* from complete onboarding';
        }
        return null;
      },
    },
    {
      name: 'provisioning onboarding status',
      service: 'provisioning',
      method: 'GET',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/onboarding/status`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return ctx.provisionedMerchantId ? null : 'provisionedMerchantId not captured';
      },
      expectStatus: 200,
      validate: (_ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        if (!data?.onboarded) return 'Expected onboarded true';
        if (data.can_use_live_mode === true) {
          return 'Provisioned merchant should not have live mode before go-live approval';
        }
        return null;
      },
    },
    {
      name: 'provisioning fetch api keys (test only)',
      service: 'provisioning',
      method: 'GET',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/api-keys`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return ctx.provisionedMerchantId ? null : 'provisionedMerchantId not captured';
      },
      expectStatus: 200,
      validate: (_ctx, res) => assertNoLiveSecretsInKeys(res.data),
    },
    {
      name: 'provisioned merchant identity (/me)',
      service: 'provisioning',
      method: 'GET',
      path: '/me',
      auth: false,
      headers: (ctx): Record<string, string> => {
        const testKey =
          typeof ctx.provisionedTestKey === 'string'
            ? ctx.provisionedTestKey
            : '';
        if (!testKey) return {};
        return { 'X-API-KEY': testKey };
      },
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return typeof ctx.provisionedTestKey === 'string'
          ? null
          : 'provisionedTestKey not captured';
      },
      expectStatus: 200,
      validate: (ctx, res) => {
        const merchantId = pickString(res.data, 'merchant_id');
        if (merchantId !== ctx.provisionedMerchantId) {
          return 'Expected /me to return provisioned merchant_id';
        }
        const env = pickString(res.data, 'environment');
        return env === 'test' ? null : 'Expected test environment on provisioned /me';
      },
    },
    {
      name: 'provisioning request live activation',
      service: 'provisioning',
      method: 'POST',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/live-activation/request`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return ctx.provisionedMerchantId ? null : 'provisionedMerchantId not captured';
      },
      expectStatus: 201,
      body: (ctx) => ({
        metadata: { synthetics_run_id: ctx.runId, source: 'api-synthetics' },
      }),
      capture: (ctx, res) => {
        const requestId = pickString(res.data, 'request_id');
        const approvalPath = pickString(res.data, 'merchant_approval_path');
        if (requestId) ctx.liveActivationRequestId = requestId;
        if (approvalPath) ctx.liveActivationApprovalPath = approvalPath;
      },
      validate: (_ctx, res) => {
        const status = pickString(res.data, 'status');
        const path = pickString(res.data, 'merchant_approval_path');
        if (!status) return 'Expected live activation status';
        if (!path?.includes('/connect/go-live')) {
          return 'Expected merchant_approval_path to /connect/go-live';
        }
        return null;
      },
    },
    {
      name: 'provisioning live activation status (pending merchant)',
      service: 'provisioning',
      method: 'GET',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/live-activation/status`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return ctx.provisionedMerchantId ? null : 'provisionedMerchantId not captured';
      },
      expectStatus: 200,
      validate: (_ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        if (data.can_use_live_mode === true) {
          return 'Live mode must stay false until merchant approves go-live';
        }
        const request = data.request as Record<string, unknown> | null;
        if (!request?.status) {
          return 'Expected pending live activation request in status payload';
        }
        const status = String(request.status);
        if (status !== 'pending_merchant' && status !== 'pending_review') {
          return `Unexpected live activation status: ${status}`;
        }
        return null;
      },
    },
    {
      name: 'provisioning live activation idempotent request',
      service: 'provisioning',
      method: 'POST',
      path: (ctx) =>
        `/provisioning/v1/merchants/${ctx.provisionedMerchantId}/live-activation/request`,
      auth: false,
      headers: provisioningHeaders,
      skipIf: (ctx) => {
        const keySkip = skipWithoutProvisioningKey();
        if (keySkip) return keySkip;
        return ctx.liveActivationRequestId
          ? null
          : 'liveActivationRequestId not captured';
      },
      expectStatus: 201,
      body: {},
      validate: (_ctx, res) => {
        const already = (unwrapData(res.data) as Record<string, unknown>)
          ?.already_pending;
        return already === true ? null : 'Expected already_pending on duplicate request';
      },
    },
  ];
}
