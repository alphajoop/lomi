/* eslint-env node */
/**
 * Verifies machine-readable agent assets for CI (Silicon-friendly / L5 runbook).
 * Run from repo root: node apps/docs/lib/scripts/verify-agent-contracts.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, '..', '..');
const monorepoRoot = join(__dirname, '..', '..', '..', '..');

const paths = {
  agentCard: join(monorepoRoot, 'apps/website/public/.well-known/agent.json'),
  merchantOpenApi: join(docsRoot, 'openapi.json'),
  agentOpenApi: join(docsRoot, 'agent-openapi.json'),
  expectedPartnerOps: join(
    docsRoot,
    'lib/scripts/manual-api/_expected-partner-operations.json',
  ),
  expectedProvisioningOps: join(
    docsRoot,
    'lib/scripts/manual-api/_expected-provisioning-operations.json',
  ),
};

function mustParseJson(label, filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath} (${label})`);
  }
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

const agent = mustParseJson('agent card', paths.agentCard);
if (typeof agent.name !== 'string' || !agent.endpoints?.openapi) {
  throw new Error('agent.json: expected name and endpoints.openapi');
}

if (!agent.endpoints.agent_openapi) {
  throw new Error(
    'agent.json: expected endpoints.agent_openapi (re-run agent OpenAPI export)',
  );
}

const merchantSpec = mustParseJson('merchant OpenAPI', paths.merchantOpenApi);
if (
  !merchantSpec.openapi ||
  !merchantSpec.paths ||
  typeof merchantSpec.paths !== 'object'
) {
  throw new Error('openapi.json: invalid OpenAPI document');
}

const agentSpec = mustParseJson('agent OpenAPI', paths.agentOpenApi);
if (
  !agentSpec.openapi ||
  !agentSpec.paths ||
  typeof agentSpec.paths !== 'object'
) {
  throw new Error(
    'agent-openapi.json: invalid OpenAPI document (run apps/api: pnpm run openapi:export:agent)',
  );
}

const requiredPaths = [
  '/agent/capabilities',
  '/agent/events',
  '/agent/subscriptions',
  '/agent/workflows',
  '/agent/handoff',
];

const requiredPartnerPaths = [
  '/partners/v1/provisioning-keys',
  '/partners/v1/usage',
];

for (const p of requiredPaths) {
  if (!agentSpec.paths[p]) {
    throw new Error(
      `agent-openapi.json must include path ${p} (re-run apps/api: pnpm run openapi:export:agent)`,
    );
  }
  if (merchantSpec.paths[p]) {
    throw new Error(
      `Merchant openapi.json must not include agent path ${p} (agent routes belong in agent-openapi.json)`,
    );
  }
}

for (const p of requiredPartnerPaths) {
  if (!agentSpec.paths[p]) {
    throw new Error(
      `agent-openapi.json must include path ${p} (re-run apps/api: pnpm run openapi:export:agent)`,
    );
  }
  if (merchantSpec.paths[p]) {
    throw new Error(
      `Merchant openapi.json must not include partner path ${p} (partner routes belong in agent-openapi.json)`,
    );
  }
}

const expectedPartnerOps = mustParseJson(
  'expected partner operations',
  paths.expectedPartnerOps,
);
if (!Array.isArray(expectedPartnerOps)) {
  throw new Error('_expected-partner-operations.json must be a JSON array');
}
for (const entry of expectedPartnerOps) {
  const [method, ...pathParts] = String(entry).split(/\s+/);
  const pathKey = pathParts.join(' ');
  const pathItem = agentSpec.paths[pathKey];
  const op = pathItem?.[method.toLowerCase()];
  if (!op) {
    throw new Error(
      `agent-openapi.json missing partner operation ${entry} (re-run openapi:export:agent)`,
    );
  }
}

const expectedProvisioningOps = mustParseJson(
  'expected provisioning operations',
  paths.expectedProvisioningOps,
);
if (!Array.isArray(expectedProvisioningOps)) {
  throw new Error(
    '_expected-provisioning-operations.json must be a JSON array',
  );
}
for (const entry of expectedProvisioningOps) {
  const [method, ...pathParts] = String(entry).split(/\s+/);
  const pathKey = pathParts.join(' ');
  const pathItem = agentSpec.paths[pathKey];
  const op = pathItem?.[method.toLowerCase()];
  if (!op) {
    throw new Error(
      `agent-openapi.json missing provisioning operation ${entry} (re-run openapi:export:agent)`,
    );
  }
}

globalThis.console.log('verify-agent-contracts: ok');
