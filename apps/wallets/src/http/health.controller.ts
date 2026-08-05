import { Controller, Get } from '@nestjs/common';
import { HANDLE_DOMAIN, PUBLIC_BASE_URL } from '../config.js';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'lomi-wallets',
      handle_domain: HANDLE_DOMAIN,
      public_base_url: PUBLIC_BASE_URL,
    };
  }
}
