import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { buildSwaggerDocumentBase } from './swagger.config';

async function bootstrap() {
  const expressApp = express();
  const isProduction = process.env.NODE_ENV === 'production';

  expressApp.use((req: express.Request & { id?: string }, res, next) => {
    const id =
      (req.headers['x-request-id'] as string | undefined) || randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  expressApp.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    next();
  });

  // Middleware to capture raw body for webhook signature verification
  expressApp.use(
    '/webhooks',
    express.raw({ type: 'application/json', limit: '10mb' }),
    (req, res, next) => {
      (req as any).rawBody = req.body;
      next();
    },
  );

  // Regular JSON body parser for API routes
  expressApp.use(express.json({ limit: '10mb' }));

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      bodyParser: false, // We're handling body parsing with Express middleware
    },
  );

  // Enable CORS
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : isProduction
      ? [
          'https://lomi.africa',
          'https://www.lomi.africa',
          'https://dashboard.lomi.africa',
          'https://api.lomi.africa',
        ]
      : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'X-API-KEY,X-Lomi-API-Key,Lomi-Account,X-Request-Id,Idempotency-Key,X-Lomi-Signature,X-Lomi-Event,X-Webhook-ID,X-Merchant-Signature,Content-Type,Authorization,X-Organization-Id,X-Environment',
    exposedHeaders:
      'X-Request-Id,Retry-After,X-RateLimit-Limit,X-RateLimit-Policy,X-RateLimit-Window-Seconds',
  });

  const document = SwaggerModule.createDocument(
    app,
    buildSwaggerDocumentBase(),
  );
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
