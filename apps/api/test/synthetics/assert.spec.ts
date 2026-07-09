import {
  analyzeResponse,
  scanForLeaks,
  unwrapData,
  validateMerchantFacingError,
  validateUnavailableChargeResponse,
  validateWebhookCreateResponse,
  validateWebhookDeliveryLogs,
  validateWebhookListHasNoSecrets,
  validateWebhookTestDeliveryResponse,
} from './assert';

describe('synthetics assert', () => {
  it('flags Stripe secret env leak', () => {
    const leaks = scanForLeaks({
      error: {
        code: 'service_unavailable',
        message:
          'Stripe test mode is not configured (set STRIPE_SECRET_KEY_TEST)',
      },
    });
    expect(leaks.length).toBeGreaterThan(0);
    expect(leaks.some((l) => l.kind === 'leak')).toBe(true);
  });

  it('allows sanitized merchant-facing message', () => {
    const leaks = scanForLeaks({
      error: {
        code: 'service_unavailable',
        message:
          'Card payments are temporarily unavailable. Please use another payment method or try again later.',
      },
    });
    expect(leaks).toHaveLength(0);
  });

  it('flags generic internal_error copy', () => {
    expect(
      validateMerchantFacingError({
        error: {
          code: 'internal_error',
          message: 'An unexpected error occurred',
        },
      }),
    ).toMatch(/Generic internal_error/);
  });

  it('accepts structured service_unavailable for muted charges', () => {
    expect(
      validateUnavailableChargeResponse({
        error: {
          code: 'service_unavailable',
          message:
            'Switch card payments are temporarily unavailable. Please use hosted checkout or another payment method.',
        },
      }),
    ).toBeNull();
  });

  it('does not flag expected 503 as service_unavailable anomaly', () => {
    const anomalies = analyzeResponse(
      {
        status: 503,
        data: {
          error: {
            code: 'service_unavailable',
            message: 'Switch card payments are temporarily unavailable.',
          },
        },
        latencyMs: 1,
        headers: {},
      },
      503,
    );
    expect(anomalies).toHaveLength(0);
  });

  it('detects unexpected status', () => {
    const anomalies = analyzeResponse(
      {
        status: 503,
        data: { error: { message: 'unavailable' } },
        latencyMs: 1,
        headers: {},
      },
      [200, 201],
    );
    expect(anomalies.some((a) => a.kind === 'status')).toBe(true);
    expect(anomalies.some((a) => a.kind === 'service_unavailable')).toBe(true);
  });

  it('validates webhook create payload shape', () => {
    expect(
      validateWebhookCreateResponse({
        data: { id: 'wh_123', url: 'https://example.com/h' },
        secret: 'whsec_abc',
      }),
    ).toBeNull();
  });

  it('unwraps success envelopes', () => {
    expect(unwrapData({ success: true, data: { id: 'x' } })).toEqual({
      id: 'x',
    });
  });

  it('validates webhook test delivery response', () => {
    expect(
      validateWebhookTestDeliveryResponse({
        success: true,
        status: 200,
        delivered_url: 'https://example.com/hook',
      }),
    ).toBeNull();
  });

  it('validates webhook delivery logs after test send', () => {
    expect(
      validateWebhookDeliveryLogs([
        { event_type: 'test.webhook', response_status: 200 },
      ]),
    ).toBeNull();
  });

  it('rejects webhook list rows that expose secrets', () => {
    expect(
      validateWebhookListHasNoSecrets([
        { id: 'wh_1', url: 'https://example.com' },
      ]),
    ).toBeNull();
    expect(
      validateWebhookListHasNoSecrets([
        { id: 'wh_1', verification_token: 'whsec_leak' },
      ]),
    ).toMatch(/must not include/);
  });
});
