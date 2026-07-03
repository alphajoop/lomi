import type { CheckDefinition } from '../types';

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
      name: 'provisioning rejects missing key',
      service: 'provisioning',
      method: 'GET',
      path: '/provisioning/v1/merchants/00000000-0000-0000-0000-000000000001/onboarding/status',
      auth: false,
      expectStatus: 401,
    },
    {
      name: 'partners rejects missing key',
      service: 'partners',
      method: 'GET',
      path: '/partners/v1/usage',
      auth: false,
      expectStatus: 401,
    },
    {
      name: 'agent capabilities',
      service: 'agent',
      method: 'GET',
      path: '/agent/capabilities',
      auth: false,
      expectStatus: 200,
    },
  ];
}
