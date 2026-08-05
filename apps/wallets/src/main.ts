import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PORT, PUBLIC_BASE_URL } from './config.js';
import { AppModule } from './http/app.module.js';
import { WalletsExceptionFilter } from './http/wallets-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new WalletsExceptionFilter());
  const publicDir = join(process.cwd(), 'public');
  app.useStaticAssets(publicDir, { index: 'index.html' });
  await app.listen(PORT, '0.0.0.0');
  console.log(
    `lomi. wallets listening on http://0.0.0.0:${PORT} (${PUBLIC_BASE_URL})`,
  );
}

bootstrap();
