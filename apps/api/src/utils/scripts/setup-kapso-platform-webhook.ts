/**
 * Ops: configure Kapso + Supabase WhatsApp webhooks for Commerce onboarding and inbound Meta traffic.
 *
 * 1. Project webhook → `kapso-platform-webhook` (`whatsapp.phone_number.created`)
 * 2. Platform number meta webhook → `whatsapp-webhook` (catalog orders / inquiries)
 * 3. Supabase secrets: `KAPSO_WEBHOOK_SECRET`, `DASHBOARD_URL`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, optional `META_APP_SECRET`
 *
 * Usage:
 *   source apps/dashboard/supabase/.env
 *   pnpx tsx src/utils/scripts/setup-kapso-platform-webhook.ts --apply-secrets --project-ref mdswvokxrnfggrujsfjd
 *
 * Env:
 *   KAPSO_API_KEY                 (required)
 *   PHONE_NUMBER_ID               platform Meta phone id (default: resolved from Kapso)
 *   META_APP_SECRET               optional; Meta app secret for inbound signature verification
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN optional; generated when omitted
 *   KAPSO_WEBHOOK_SECRET          optional; generated when omitted (platform onboarding webhook)
 */
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';
import * as path from 'path';

const KAPSO_BASE = 'https://api.kapso.ai/platform/v1';
const DEFAULT_SUPABASE_URL = 'https://mdswvokxrnfggrujsfjd.supabase.co';
const DEFAULT_DASHBOARD_URL = 'https://dashboard.lomi.africa';
const WEBHOOK_EVENT = 'whatsapp.phone_number.created';
const DEFAULT_PHONE_NUMBER_ID = '1007853535737334';

type KapsoWebhook = {
  id: string;
  url: string;
  kind: string;
  events: string[];
  active: boolean;
  phone_number_id: string | null;
  secret_key?: string | null;
  payload_version?: string | null;
};

type Args = {
  dryRun: boolean;
  applySecrets: boolean;
  projectRef: string;
  kapsoWebhookSecret?: string;
  supabaseUrl: string;
  dashboardUrl: string;
};

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes('--dry-run');
  const applySecrets = argv.includes('--apply-secrets');
  const projectRefIdx = argv.indexOf('--project-ref');
  const secretIdx = argv.indexOf('--secret');
  const supabaseUrlIdx = argv.indexOf('--supabase-url');
  const dashboardUrlIdx = argv.indexOf('--dashboard-url');
  const explicitSecret =
    secretIdx >= 0
      ? argv[secretIdx + 1]
      : process.env.KAPSO_WEBHOOK_SECRET?.trim();

  return {
    dryRun,
    applySecrets,
    projectRef:
      projectRefIdx >= 0
        ? (argv[projectRefIdx + 1] ?? 'mdswvokxrnfggrujsfjd')
        : 'mdswvokxrnfggrujsfjd',
    kapsoWebhookSecret: explicitSecret || undefined,
    supabaseUrl:
      (supabaseUrlIdx >= 0 ? argv[supabaseUrlIdx + 1] : undefined) ??
      process.env.SUPABASE_PROJECT_URL ??
      DEFAULT_SUPABASE_URL,
    dashboardUrl:
      (dashboardUrlIdx >= 0 ? argv[dashboardUrlIdx + 1] : undefined) ??
      process.env.DASHBOARD_URL ??
      DEFAULT_DASHBOARD_URL,
  };
}

function kapsoApiKey(): string {
  const key = process.env.KAPSO_API_KEY?.trim();
  if (!key) {
    console.error('KAPSO_API_KEY is required');
    process.exit(1);
  }
  return key;
}

async function kapsoFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${KAPSO_BASE}${path}`, {
    ...init,
    headers: {
      'X-API-Key': kapsoApiKey(),
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: T;
  try {
    body = (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new Error(
      `Kapso API ${response.status}: invalid JSON: ${text.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : text || response.statusText;
    throw new Error(`Kapso API ${response.status}: ${message}`);
  }

  return { status: response.status, body };
}

function webhookEndpoint(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/kapso-platform-webhook`;
}

async function listProjectWebhooks(): Promise<KapsoWebhook[]> {
  const { body } = await kapsoFetch<{ data?: KapsoWebhook[] }>(
    '/whatsapp/webhooks?per_page=100',
  );
  return body.data ?? [];
}

function isLomiCommerceWebhook(
  webhook: KapsoWebhook,
  targetUrl: string,
): boolean {
  return (
    webhook.url === targetUrl &&
    !webhook.phone_number_id &&
    webhook.kind === 'kapso'
  );
}

async function createProjectWebhook(
  targetUrl: string,
  secret: string,
): Promise<KapsoWebhook> {
  const { body } = await kapsoFetch<{ data: KapsoWebhook }>(
    '/whatsapp/webhooks',
    {
      method: 'POST',
      body: JSON.stringify({
        whatsapp_webhook: {
          url: targetUrl,
          secret_key: secret,
          events: [WEBHOOK_EVENT],
          payload_version: 'v2',
          active: true,
        },
      }),
    },
  );
  return body.data;
}

async function updateProjectWebhook(
  webhookId: string,
  targetUrl: string,
  secret?: string,
): Promise<KapsoWebhook> {
  const whatsappWebhook: Record<string, unknown> = {
    url: targetUrl,
    events: [WEBHOOK_EVENT],
    payload_version: 'v2',
    active: true,
  };
  if (secret) whatsappWebhook.secret_key = secret;

  const { body } = await kapsoFetch<{ data: KapsoWebhook }>(
    `/whatsapp/webhooks/${encodeURIComponent(webhookId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ whatsapp_webhook: whatsappWebhook }),
    },
  );
  return body.data;
}

function inboundWebhookEndpoint(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/whatsapp-webhook`;
}

async function listPhoneNumberWebhooks(
  phoneNumberId: string,
): Promise<KapsoWebhook[]> {
  const { body } = await kapsoFetch<{ data?: KapsoWebhook[] }>(
    `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId)}/webhooks?per_page=100`,
  );
  return body.data ?? [];
}

async function registerInboundMetaWebhook(
  phoneNumberId: string,
  targetUrl: string,
  metaAppSecret?: string,
): Promise<KapsoWebhook> {
  const existing = await listPhoneNumberWebhooks(phoneNumberId);
  const match = existing.find((w) => w.kind === 'meta' && w.url === targetUrl);

  // Kapso requires secret_key on create; Meta signature verification uses META_APP_SECRET separately.
  const kapsoSecretKey =
    metaAppSecret || crypto.randomBytes(32).toString('hex');

  const payload = {
    whatsapp_webhook: {
      kind: 'meta' as const,
      url: targetUrl,
      active: true,
      secret_key: kapsoSecretKey,
    },
  };

  if (match) {
    const { body } = await kapsoFetch<{ data: KapsoWebhook }>(
      `/whatsapp/webhooks/${encodeURIComponent(match.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    return body.data;
  }

  const { body } = await kapsoFetch<{ data: KapsoWebhook }>(
    `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId)}/webhooks`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return body.data;
}

function resolvePhoneNumberId(): string {
  return process.env.PHONE_NUMBER_ID?.trim() || DEFAULT_PHONE_NUMBER_ID;
}

function applySupabaseSecrets(
  projectRef: string,
  entries: Record<string, string>,
  dryRun: boolean,
): void {
  const cmd = 'supabase';
  const args = [
    'secrets',
    'set',
    '--project-ref',
    projectRef,
    ...Object.entries(entries).map(([key, value]) => `${key}=${value}`),
  ];

  if (dryRun) {
    console.log(`[dry-run] would run: ${cmd} ${args.join(' ')}`);
    return;
  }

  execFileSync(cmd, args, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../../../../dashboard'),
  });
}

async function setupPlatformOnboardingWebhook(
  args: Args,
): Promise<{ webhook: KapsoWebhook; secret?: string }> {
  const targetUrl = webhookEndpoint(args.supabaseUrl);
  const existing = await listProjectWebhooks();
  const match = existing.find((w) => isLomiCommerceWebhook(w, targetUrl));
  const secret =
    args.kapsoWebhookSecret ??
    (match ? undefined : crypto.randomBytes(32).toString('hex'));

  let webhook: KapsoWebhook;
  if (match) {
    console.log(`Updating existing onboarding webhook ${match.id}`);
    webhook = args.dryRun
      ? { ...match, events: [WEBHOOK_EVENT] }
      : await updateProjectWebhook(match.id, targetUrl, secret);
  } else {
    const otherAtUrl = existing.find((w) => w.url === targetUrl);
    const createSecret = secret ?? crypto.randomBytes(32).toString('hex');
    if (otherAtUrl) {
      console.log(`Updating onboarding webhook at same URL (${otherAtUrl.id})`);
      webhook = args.dryRun
        ? { ...otherAtUrl, secret_key: createSecret, events: [WEBHOOK_EVENT] }
        : await updateProjectWebhook(otherAtUrl.id, targetUrl, createSecret);
    } else {
      console.log('Creating Kapso project onboarding webhook');
      webhook = args.dryRun
        ? {
            id: 'dry-run',
            url: targetUrl,
            kind: 'kapso',
            events: [WEBHOOK_EVENT],
            active: true,
            phone_number_id: null,
            secret_key: createSecret,
          }
        : await createProjectWebhook(targetUrl, createSecret);
    }
    return { webhook, secret: createSecret };
  }

  return { webhook, secret };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const verifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() ||
    crypto.randomBytes(24).toString('hex');
  const metaAppSecret = process.env.META_APP_SECRET?.trim();
  const phoneNumberId = resolvePhoneNumberId();
  const inboundUrl = inboundWebhookEndpoint(args.supabaseUrl);

  console.log('WhatsApp webhook setup');
  console.log(`  dashboard: ${args.dashboardUrl}`);
  if (args.dryRun) console.log('  mode: dry-run');

  console.log('\n[1/2] Kapso platform onboarding webhook');
  const { webhook: onboardingWebhook, secret: kapsoSecret } =
    await setupPlatformOnboardingWebhook(args);
  console.log(`  id:     ${onboardingWebhook.id}`);
  console.log(`  url:    ${onboardingWebhook.url}`);
  console.log(`  events: ${(onboardingWebhook.events ?? []).join(', ')}`);

  console.log('\n[2/2] Kapso inbound meta webhook (platform number)');
  console.log(`  phone_number_id: ${phoneNumberId}`);
  console.log(`  url:             ${inboundUrl}`);
  const inboundWebhook = args.dryRun
    ? {
        id: 'dry-run',
        url: inboundUrl,
        kind: 'meta',
        events: [],
        active: true,
        phone_number_id: phoneNumberId,
      }
    : await registerInboundMetaWebhook(
        phoneNumberId,
        inboundUrl,
        metaAppSecret,
      );
  console.log(`  id:     ${inboundWebhook.id}`);
  console.log(`  kind:   ${inboundWebhook.kind}`);
  console.log(`  active: ${inboundWebhook.active}`);

  const secretEntries: Record<string, string> = {
    DASHBOARD_URL: args.dashboardUrl,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: verifyToken,
  };
  if (kapsoSecret) {
    secretEntries.KAPSO_WEBHOOK_SECRET = kapsoSecret;
  }
  if (metaAppSecret) {
    secretEntries.META_APP_SECRET = metaAppSecret;
  }

  if (args.applySecrets) {
    console.log('\nSyncing Supabase edge secrets...');
    applySupabaseSecrets(args.projectRef, secretEntries, args.dryRun);
  } else {
    console.log('\nSet Supabase secrets (or re-run with --apply-secrets):');
    for (const [key, value] of Object.entries(secretEntries)) {
      console.log(`  ${key}=${value}`);
    }
  }

  if (!metaAppSecret) {
    console.warn(
      '\nMETA_APP_SECRET not set — inbound whatsapp-webhook will skip Meta signature verification until you add it.',
    );
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
