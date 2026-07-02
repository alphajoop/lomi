import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/utils/supabase/supabase.service';

function createSupabaseE2eMock() {
  const rpc = jest.fn(async (fn: string, args: Record<string, unknown>) => {
    if (fn === 'verify_api_key') {
      const key = args.p_api_key as string;
      if (key !== 'valid_e2e_key') {
        return {
          data: [{ is_valid: false }],
          error: null,
        };
      }
      return {
        data: [
          {
            is_valid: true,
            merchant_id: 'merch_e2e',
            organization_id: 'org_e2e',
            environment: 'test',
          },
        ],
        error: null,
      };
    }

    if (fn === 'fetch_transactions') {
      return { data: [{ transaction_id: 'txn_e2e' }], error: null };
    }

    if (fn === 'list_payment_links') {
      return {
        data: [{ link_id: 'plink_e2e', title: 'E2E link' }],
        error: null,
      };
    }

    if (fn === 'create_payment_request_api') {
      return {
        data: {
          request_id: 'pr_e2e',
          amount: args.p_amount,
          currency_code: args.p_currency_code,
        },
        error: null,
      };
    }

    if (fn === 'create_checkout_session') {
      return {
        data: {
          checkout_session_id: 'cs_e2e',
          checkout_url: 'https://checkout.lomi.africa/checkout/cs_e2e',
          amount: args.p_amount ?? 5000,
          currency_code: 'XOF',
          expires_at: '2099-01-01T00:00:00.000Z',
          environment: 'test',
        },
        error: null,
      };
    }

    if (fn === 'create_checkout_session_with_line_items') {
      const lineItems = args.p_line_items as
        | Array<{ price_id?: string }>
        | undefined;
      if (
        lineItems?.some(
          (item) => item.price_id === '44444444-4444-4444-4444-444444444444',
        )
      ) {
        return {
          data: null,
          error: { message: 'line_items_recurring_not_supported' },
        };
      }

      return {
        data: {
          checkout_session_id: 'cs_cart_e2e',
          checkout_url: 'https://checkout.lomi.africa/checkout/cs_cart_e2e',
          amount: 3000,
          currency_code: args.p_currency_code,
          expires_at: '2099-01-01T00:00:00.000Z',
          environment: args.p_environment,
          line_item_count: 1,
        },
        error: null,
      };
    }

    if (fn === 'list_checkout_sessions') {
      return {
        data: [
          {
            checkout_session_id: 'cs_list_1',
            merchant_id: args.p_merchant_id,
            currency_code: 'XOF',
          },
        ],
        error: null,
      };
    }

    return { data: null, error: null };
  });

  function checkoutSessionsFrom() {
    return {
      select: () => ({
        eq: (col1: string, val1: string) => ({
          eq: (col2: string, val2: string) => ({
            single: async () => {
              if (
                col1 === 'checkout_session_id' &&
                val1 === 'cs_found' &&
                col2 === 'organization_id' &&
                val2 === 'org_e2e'
              ) {
                return {
                  data: {
                    checkout_session_id: 'cs_found',
                    organization_id: 'org_e2e',
                    currency_code: 'XOF',
                  },
                  error: null,
                };
              }
              return {
                data: null,
                error: { message: 'not found' },
              };
            },
          }),
        }),
      }),
    };
  }

  return {
    onModuleInit: () => {},
    rpc,
    getClient: () => ({
      rpc,
      from: (table: string) => {
        if (table === 'checkout_sessions') {
          return checkoutSessionsFrom();
        }
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: null,
                  error: { message: 'not found' },
                }),
              }),
              single: async () => ({
                data: null,
                error: { message: 'not found' },
              }),
            }),
          }),
        };
      },
    }),
  };
}

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let supabaseMock: ReturnType<typeof createSupabaseE2eMock>;

  beforeAll(async () => {
    supabaseMock = createSupabaseE2eMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / is public', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('▲');
    expect(res.text).toContain('Open Source');
    expect(res.text).toContain('https://github.com/lomiafrica/lomi.');
  });

  it('GET /agent/capabilities is public (L5 negotiation surface)', async () => {
    const res = await request(app.getHttpServer())
      .get('/agent/capabilities')
      .expect(200);
    expect(res.body).toMatchObject({
      name: 'lomi.',
      features: expect.objectContaining({
        server_sent_events: '/agent/events',
      }),
    });
  });

  it('GET /agent/subscriptions returns 401 without API key (JSON envelope)', async () => {
    const res = await request(app.getHttpServer())
      .get('/agent/subscriptions')
      .expect(401);
    expect(res.body).toMatchObject({
      error: expect.objectContaining({ code: 'unauthorized' }),
      request_id: expect.any(String),
    });
  });

  it('GET /agent/subscriptions returns empty list with valid API key', async () => {
    const res = await request(app.getHttpServer())
      .get('/agent/subscriptions')
      .set('X-API-KEY', 'valid_e2e_key')
      .expect(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('GET /transactions rejects without API key (401 + JSON shape)', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .expect(401);

    expect(res.body).toMatchObject({
      error: expect.objectContaining({
        code: 'unauthorized',
        message: 'API Key is missing',
      }),
      request_id: expect.any(String),
    });
  });

  it('GET /transactions rejects invalid API key', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('X-API-KEY', 'nope')
      .expect(401);

    expect(res.body).toMatchObject({
      error: expect.objectContaining({
        code: 'unauthorized',
        message: 'Invalid API Key',
      }),
      request_id: expect.any(String),
    });
  });

  it('GET /transactions returns data with valid API key (Tier-1 read smoke)', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('X-API-KEY', 'valid_e2e_key')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toEqual(
      expect.objectContaining({ transaction_id: 'txn_e2e' }),
    );
  });

  it('GET /payment-links returns paginated payload with valid API key (Tier-1 read smoke)', async () => {
    const res = await request(app.getHttpServer())
      .get('/payment-links')
      .set('X-API-KEY', 'valid_e2e_key')
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        data: [expect.objectContaining({ link_id: 'plink_e2e' })],
        limit: 20,
        offset: 0,
      }),
    );
  });

  it('POST /payment-requests creates with valid API key (Tier-1 write smoke)', async () => {
    const res = await request(app.getHttpServer())
      .post('/payment-requests')
      .set('X-API-KEY', 'valid_e2e_key')
      .send({
        amount: 1000,
        currency_code: 'XOF',
        expiry_date: '2026-12-31T23:59:59.000Z',
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        request_id: 'pr_e2e',
        amount: 1000,
        currency_code: 'XOF',
      }),
    );
  });

  it('POST /checkout-sessions creates with valid API key (Tier-1 write smoke)', async () => {
    const res = await request(app.getHttpServer())
      .post('/checkout-sessions')
      .set('X-API-KEY', 'valid_e2e_key')
      .send({
        currency_code: 'XOF',
        amount: 5000,
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        checkout_session_id: 'cs_e2e',
        checkout_url: 'https://checkout.lomi.africa/checkout/cs_e2e',
        currency_code: 'XOF',
        amount: 5000,
        expires_at: expect.any(String),
        environment: 'test',
      }),
    );
  });

  it('POST /checkout-sessions forwards trimmed Idempotency-Key to RPC', async () => {
    await request(app.getHttpServer())
      .post('/checkout-sessions')
      .set('X-API-KEY', 'valid_e2e_key')
      .set('Idempotency-Key', '  e2e-idem-7  ')
      .send({
        currency_code: 'XOF',
        amount: 5000,
      })
      .expect(201);

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'create_checkout_session',
      expect.objectContaining({
        p_idempotency_key: 'e2e-idem-7',
        p_idempotency_body_hash: expect.any(String),
      }),
    );
  });

  it('POST /payment-requests forwards Idempotency-Key to RPC', async () => {
    await request(app.getHttpServer())
      .post('/payment-requests')
      .set('X-API-KEY', 'valid_e2e_key')
      .set('Idempotency-Key', 'pr-idem-1')
      .send({
        amount: 1000,
        currency_code: 'XOF',
        expiry_date: '2026-12-31T23:59:59.000Z',
      })
      .expect(201);

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'create_payment_request_api',
      expect.objectContaining({
        p_idempotency_key: 'pr-idem-1',
        p_idempotency_body_hash: expect.any(String),
      }),
    );
  });

  it('POST /checkout-sessions with line_items uses cart RPC (Tier-1 write)', async () => {
    const priceId = '33333333-3333-3333-3333-333333333333';
    const res = await request(app.getHttpServer())
      .post('/checkout-sessions')
      .set('X-API-KEY', 'valid_e2e_key')
      .send({
        currency_code: 'XOF',
        line_items: [{ price_id: priceId, quantity: 1 }],
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        checkout_session_id: 'cs_cart_e2e',
        checkout_url: 'https://checkout.lomi.africa/checkout/cs_cart_e2e',
        line_item_count: 1,
      }),
    );
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'create_checkout_session_with_line_items',
      expect.objectContaining({
        p_line_items: [{ price_id: priceId, quantity: 1 }],
      }),
    );
  });

  it('POST /checkout-sessions with invalid line_items returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/checkout-sessions')
      .set('X-API-KEY', 'valid_e2e_key')
      .send({
        currency_code: 'XOF',
        line_items: [
          {
            price_id: '44444444-4444-4444-4444-444444444444',
            quantity: 1,
          },
        ],
      })
      .expect(400);

    expect(res.body).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'bad_request',
          message: expect.stringContaining('recurring'),
        }),
      }),
    );
  });

  it('GET /checkout-sessions returns 401 without API key', async () => {
    const res = await request(app.getHttpServer())
      .get('/checkout-sessions')
      .expect(401);
    expect(res.body).toMatchObject({
      error: expect.objectContaining({
        code: 'unauthorized',
        message: 'API Key is missing',
      }),
      request_id: expect.any(String),
    });
  });

  it('GET /checkout-sessions returns list with valid API key', async () => {
    const res = await request(app.getHttpServer())
      .get('/checkout-sessions')
      .set('X-API-KEY', 'valid_e2e_key')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        checkout_session_id: 'cs_list_1',
        currency_code: 'XOF',
      }),
    );
  });

  it('GET /checkout-sessions/:id returns session when found', async () => {
    const res = await request(app.getHttpServer())
      .get('/checkout-sessions/cs_found')
      .set('X-API-KEY', 'valid_e2e_key')
      .expect(200);

    expect(res.body).toMatchObject({
      checkout_session_id: 'cs_found',
      organization_id: 'org_e2e',
    });
  });

  it('GET /checkout-sessions/:id returns 404 when not found', async () => {
    const res = await request(app.getHttpServer())
      .get('/checkout-sessions/missing-id')
      .set('X-API-KEY', 'valid_e2e_key')
      .expect(404);

    expect(res.body).toMatchObject({
      error: expect.objectContaining({ code: 'not_found' }),
      request_id: expect.any(String),
    });
  });
});
