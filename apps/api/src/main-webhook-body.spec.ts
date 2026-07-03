import express from 'express';
import request from 'supertest';

/** Mirrors apps/api/src/main.ts webhook body parsing (merchant CRUD vs provider ingress). */
function createWebhookBodyTestApp() {
  const app = express();
  const providerWebhookPaths = [
    '/webhooks/stripe',
    '/webhooks/wave',
    '/webhooks/mtn',
    '/webhooks/spi',
  ];

  for (const path of providerWebhookPaths) {
    app.use(
      path,
      express.raw({ type: 'application/json', limit: '10mb' }),
      (req, res, next) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody =
          req.body as Buffer;
        next();
      },
    );
  }

  app.use(express.json({ limit: '10mb' }));

  app.post('/webhooks', (req, res) => {
    res.status(201).json({
      parsed: {
        isBuffer: Buffer.isBuffer(req.body),
        url: (req.body as { url?: string })?.url,
        events: (req.body as { authorized_events?: string[] })
          ?.authorized_events,
      },
    });
  });

  app.post('/webhooks/stripe', (req, res) => {
    res.status(200).json({
      path: 'stripe',
      isBuffer: Buffer.isBuffer(req.body),
      hasRawBody: Buffer.isBuffer(
        (req as express.Request & { rawBody?: Buffer }).rawBody,
      ),
    });
  });

  app.post('/webhooks/wave', (req, res) => {
    res.status(200).json({
      path: 'wave',
      isBuffer: Buffer.isBuffer(req.body),
      hasRawBody: Buffer.isBuffer(
        (req as express.Request & { rawBody?: Buffer }).rawBody,
      ),
    });
  });

  app.post('/webhooks/mtn', (req, res) => {
    res.status(200).json({
      path: 'mtn',
      isBuffer: Buffer.isBuffer(req.body),
      hasRawBody: Buffer.isBuffer(
        (req as express.Request & { rawBody?: Buffer }).rawBody,
      ),
    });
  });

  app.post('/webhooks/spi', (req, res) => {
    res.status(200).json({
      path: 'spi',
      isBuffer: Buffer.isBuffer(req.body),
      hasRawBody: Buffer.isBuffer(
        (req as express.Request & { rawBody?: Buffer }).rawBody,
      ),
    });
  });

  return app;
}

describe('webhook body parsing middleware', () => {
  const app = createWebhookBodyTestApp();

  it('parses merchant POST /webhooks as JSON (not raw Buffer)', async () => {
    const res = await request(app)
      .post('/webhooks')
      .set('Content-Type', 'application/json')
      .send({
        url: 'https://example.com/hooks/test',
        authorized_events: ['PAYMENT_SUCCEEDED'],
      });

    expect(res.status).toBe(201);
    expect(res.body.parsed.isBuffer).toBe(false);
    expect(res.body.parsed.url).toBe('https://example.com/hooks/test');
    expect(res.body.parsed.events).toEqual(['PAYMENT_SUCCEEDED']);
  });

  it('keeps provider POST /webhooks/stripe as raw bytes for signature verify', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });
    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.path).toBe('stripe');
    expect(res.body.isBuffer).toBe(true);
    expect(res.body.hasRawBody).toBe(true);
  });

  it.each(['wave', 'mtn', 'spi'] as const)(
    'keeps provider POST /webhooks/%s as raw bytes for signature verify',
    async (provider) => {
      const payload = JSON.stringify({ event: 'test', provider });
      const res = await request(app)
        .post(`/webhooks/${provider}`)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.path).toBe(provider);
      expect(res.body.isBuffer).toBe(true);
      expect(res.body.hasRawBody).toBe(true);
    },
  );
});
