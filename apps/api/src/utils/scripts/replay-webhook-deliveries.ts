/**
 * Ops script: replay failed webhook deliveries using production-safe outbound logic.
 *
 * Usage:
 *   pnpx tsx src/utils/scripts/replay-webhook-deliveries.ts /path/to/replay.json
 *
 * replay.json shape:
 * {
 *   "webhook_id": "uuid",
 *   "merchant_id": "uuid",
 *   "organization_id": "uuid",
 *   "url": "https://...",
 *   "secret": "whsec_...",
 *   "deliveries": [
 *     { "log_id": "uuid", "attempt_number": 4, "payload": { ... } }
 *   ]
 * }
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import { deliverMerchantWebhook } from '../../webhooks/merchant-webhook-url';

interface ReplayConfig {
  webhook_id: string;
  merchant_id: string;
  organization_id: string;
  url: string;
  secret: string;
  deliveries: Array<{
    log_id: string;
    attempt_number: number;
    payload: Record<string, unknown> & { event: string };
  }>;
}

function sign(payloadString: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}

async function deliver(
  url: string,
  secret: string,
  payload: Record<string, unknown> & { event: string },
) {
  const payloadString = JSON.stringify(payload);
  const result = await deliverMerchantWebhook(url, payloadString, {
    'Content-Type': 'application/json',
    'X-Lomi-Signature': sign(payloadString, secret),
    'X-Lomi-Event': payload.event,
    'User-Agent': 'Lomi-Webhook/1.0',
  });
  return {
    status: result.status,
    body:
      typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data),
    durationMs: 0,
    deliveredUrl: result.deliveredUrl,
    usedAlternateHost: result.usedAlternateHost,
  };
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: replay-webhook-deliveries.ts <replay.json>');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(file, 'utf8')) as ReplayConfig;
  let failed = 0;

  for (const delivery of config.deliveries) {
    const eventId =
      typeof delivery.payload.id === 'string'
        ? delivery.payload.id
        : delivery.log_id;
    process.stdout.write(`Replaying ${delivery.log_id} (event ${eventId})... `);
    try {
      const result = await deliver(config.url, config.secret, delivery.payload);
      const via = result.usedAlternateHost ? ' (www/apex fallback)' : '';
      console.log(`OK HTTP ${result.status}${via} -> ${result.deliveredUrl}`);
    } catch (error: any) {
      failed += 1;
      const status = error.response?.status;
      const body = error.response?.data ?? error.message;
      console.log(
        `FAIL HTTP ${status ?? 0}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
      );
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

void main();
