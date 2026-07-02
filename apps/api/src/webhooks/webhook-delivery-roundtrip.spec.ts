import * as crypto from 'crypto';
import { WebhookSenderService } from './webhook-sender.service';
import type { WebhookEvent } from '../utils/types/api';
import {
  deliverMerchantWebhook,
  type MerchantWebhookDelivery,
} from './merchant-webhook-url';

jest.mock('./merchant-webhook-url', () => ({
  ...jest.requireActual('./merchant-webhook-url'),
  deliverMerchantWebhook: jest.fn(),
}));

const mockedDeliver = deliverMerchantWebhook as jest.MockedFunction<
  typeof deliverMerchantWebhook
>;

/**
 * The full webhook event catalog. This MUST stay in sync with
 * Database['public']['Enums']['webhook_event'] in ../utils/types/api.ts.
 * The `satisfies` + `Exclude` assertion below fails to compile if the enum
 * gains or renames a member, so a stale list cannot silently pass.
 */
const ALL_WEBHOOK_EVENTS = [
  'PAYMENT_CREATED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'REFUND_CREATED',
  'REFUND_COMPLETED',
  'REFUND_FAILED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_CANCELLED',
  'USAGE_RECORDED',
  'USAGE_INVOICE_CREATED',
  'USAGE_INVOICE_PAID',
  'USAGE_INVOICE_OVERDUE',
  'SUBSCRIPTION_USAGE_PERIOD_CLOSED',
  'DISPUTE_CREATED',
  'DISPUTE_UPDATED',
  'DISPUTE_CLOSED',
] as const satisfies readonly WebhookEvent[];

// Compile-time exhaustiveness: errors if the enum has events not listed above.
type MissingEvents = Exclude<WebhookEvent, (typeof ALL_WEBHOOK_EVENTS)[number]>;
const _exhaustiveEventCatalog: MissingEvents extends never ? true : false = true;
void _exhaustiveEventCatalog;

/** Merchant-side verification of outbound lomi. webhooks (X-Lomi-Signature). */
function verifyOutboundLomiWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return (
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  );
}

function captureDelivery() {
  const captured = { body: '', signature: '', event: '', url: '' };
  mockedDeliver.mockImplementation(
    async (url, body, headers): Promise<MerchantWebhookDelivery> => {
      captured.url = url;
      captured.body = body;
      captured.signature = String(headers['X-Lomi-Signature'] ?? '');
      captured.event = String(headers['X-Lomi-Event'] ?? '');
      return {
        status: 200,
        data: 'OK',
        deliveredUrl: url,
        usedAlternateHost: false,
      };
    },
  );
  return captured;
}

describe('webhook delivery roundtrip (sender → merchant receiver)', () => {
  let sender: WebhookSenderService;

  beforeEach(() => {
    sender = new WebhookSenderService({
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    } as never);
    jest.clearAllMocks();
  });

  it.each(ALL_WEBHOOK_EVENTS)(
    'signs and delivers %s so a merchant can verify X-Lomi-Signature',
    async (event) => {
      const webhook = {
        id: 'wh_roundtrip',
        url: 'https://example.com/hook',
        // Subscribe to the ENTIRE catalog so this proves signing/verify, not
        // self-referential routing (routing is asserted separately below).
        events: [...ALL_WEBHOOK_EVENTS],
        secret: 'whsec_roundtrip',
        active: true,
        organization_id: 'org_1',
      };
      const data = { id: 'obj_1', amount: 1000, currency: 'XOF' };
      const captured = captureDelivery();

      const ok = await sender.sendWebhook(webhook, event, data);
      expect(ok).toBe(true);

      expect(captured.signature).toMatch(/^[a-f0-9]{64}$/);
      expect(captured.event).toBe(event);
      expect(
        verifyOutboundLomiWebhook(
          captured.body,
          captured.signature,
          webhook.secret,
        ),
      ).toBe(true);

      const parsed = JSON.parse(captured.body) as Record<string, unknown>;
      expect(parsed.event).toBe(event);
      expect(parsed.data).toEqual(data);
    },
  );

  it('does NOT deliver events the merchant is not subscribed to (real routing)', async () => {
    const webhook = {
      id: 'wh_scoped',
      url: 'https://example.com/hook',
      events: ['PAYMENT_SUCCEEDED'] as WebhookEvent[],
      secret: 'whsec_roundtrip',
      active: true,
      organization_id: 'org_1',
    };
    captureDelivery();

    const delivered = await sender.sendWebhook(
      webhook,
      'DISPUTE_CREATED',
      { id: 'dsp_1' },
    );

    expect(delivered).toBe(false);
    expect(mockedDeliver).not.toHaveBeenCalled();
  });

  it('does NOT deliver to inactive webhooks', async () => {
    const webhook = {
      id: 'wh_inactive',
      url: 'https://example.com/hook',
      events: [...ALL_WEBHOOK_EVENTS],
      secret: 'whsec_roundtrip',
      active: false,
      organization_id: 'org_1',
    };
    captureDelivery();

    const delivered = await sender.sendWebhook(
      webhook,
      'PAYMENT_SUCCEEDED',
      { id: 'tx_1' },
    );

    expect(delivered).toBe(false);
    expect(mockedDeliver).not.toHaveBeenCalled();
  });

  it('rejects tampered payloads at the merchant receiver', () => {
    const payload = JSON.stringify({
      id: 'evt_1',
      event: 'PAYMENT_SUCCEEDED',
      data: { amount: 1000 },
    });
    const secret = 'whsec_roundtrip';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    const tampered = payload.replace('1000', '9999');
    expect(verifyOutboundLomiWebhook(tampered, signature, secret)).toBe(false);
  });

  it('rejects a valid signature checked against the wrong secret', () => {
    const payload = JSON.stringify({ id: 'evt_1', event: 'PAYMENT_SUCCEEDED' });
    const signature = crypto
      .createHmac('sha256', 'whsec_real')
      .update(payload)
      .digest('hex');
    expect(verifyOutboundLomiWebhook(payload, signature, 'whsec_wrong')).toBe(
      false,
    );
  });

  it('prepareWebhookPayload includes stable id when provided', () => {
    const payload = sender.prepareWebhookPayload(
      'PAYMENT_SUCCEEDED',
      { id: 'tx_1' },
      'evt_stable_1',
    );
    expect(payload.id).toBe('evt_stable_1');
    expect(payload.event).toBe('PAYMENT_SUCCEEDED');
    expect(payload.data).toEqual({ id: 'tx_1' });
    expect(typeof payload.timestamp).toBe('string');
  });
});
