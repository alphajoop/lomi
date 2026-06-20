import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SpiWebhookService } from './spi-webhook.service';

@ApiExcludeController()
@ApiTags('Webhooks - Fournisseurs')
@Controller('webhooks/spi')
export class SpiWebhookController {
  private readonly logger = new Logger(SpiWebhookController.name);

  constructor(private readonly spiWebhookService: SpiWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Request>,
  ) {
    this.logger.log('Received SPI webhook request');

    const rawBodyData = (request as { rawBody?: Buffer | string }).rawBody;
    const rawBody = rawBodyData
      ? Buffer.isBuffer(rawBodyData)
        ? rawBodyData.toString('utf8')
        : rawBodyData
      : JSON.stringify(body ?? {});

    const parsedBody = (
      typeof body === 'object' && body !== null
        ? body
        : JSON.parse(rawBody)
    ) as Record<string, unknown>;

    const result = await this.spiWebhookService.handleWebhook(
      headers,
      parsedBody,
      rawBody,
    );

    return { received: true, ...result };
  }
}
