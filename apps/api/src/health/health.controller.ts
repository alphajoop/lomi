import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service';

/**
 * Platform health routes (same pattern as apps/mcp: GET /health + GET /ready).
 */
@Controller()
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  liveness() {
    return {
      ok: true,
      service: 'lomi-api',
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  async readiness(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.checkReadiness();
    if (!result.ok) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        ready: false,
        service: result.service,
        checks: result.checks,
        redis: result.redis,
      };
    }
    return {
      ready: true,
      service: result.service,
      checks: result.checks,
      redis: result.redis,
    };
  }

  @Get('health/redis')
  async redis(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.checkRedis();
    if (!result.ok) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    const { ok: _ok, ...body } = result;
    return body;
  }
}
