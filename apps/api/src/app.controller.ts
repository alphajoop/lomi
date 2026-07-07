import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { ApiKeyGuard } from './core/common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from './core/common/decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  getRobots(): string {
    return `User-agent: *
Disallow: /
`;
  }

  @Get('favicon.ico')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'image/x-icon')
  getFaviconIco() {
    // Return empty response for favicon requests to avoid 404s
    return Buffer.alloc(0);
  }

  @Get('favicon.png')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'image/png')
  getFaviconPng() {
    // Return empty response for favicon requests to avoid 404s
    return Buffer.alloc(0);
  }

  @Post('test/webhook-event')
  @UseGuards(ApiKeyGuard)
  async testWebhookEvent(
    @Body() body: { event: string; data: any },
    @CurrentUser() user: AuthContext,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const payload = {
      ...body.data,
      organization_id: user.organizationId,
      merchant_id: user.merchantId,
    };

    // Emit the event
    this.eventEmitter.emit(body.event, payload);

    return {
      success: true,
      message: `Event '${body.event}' emitted`,
      payload,
    };
  }
}
