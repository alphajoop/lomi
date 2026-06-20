import {
  Controller,
  Post,
  Put,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { MtnWebhookService } from './mtn-webhook.service';
import type { Request } from 'express';

@ApiExcludeController()
@ApiTags('Webhooks - Fournisseurs')
@Controller('webhooks/mtn')
export class MtnWebhookController {
  private readonly logger = new Logger(MtnWebhookController.name);

  constructor(private readonly mtnWebhookService: MtnWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePostWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.processWebhook(headers, body, request);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async handlePutWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.processWebhook(headers, body, request);
  }

  private async processWebhook(
    headers: Record<string, string>,
    body: unknown,
    request: RawBodyRequest<Request>,
  ) {
    this.logger.log('Received MTN webhook request');

    try {
      const rawBody = (request as any).rawBody;
      let parsedBody = body;

      if (rawBody) {
        const rawText = Buffer.isBuffer(rawBody)
          ? rawBody.toString('utf8')
          : String(rawBody);
        try {
          parsedBody = rawText ? JSON.parse(rawText) : body;
        } catch {
          parsedBody = body;
        }
      }

      return await this.mtnWebhookService.handleWebhook(headers, parsedBody);
    } catch (error) {
      this.logger.error(
        `MTN webhook processing error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
