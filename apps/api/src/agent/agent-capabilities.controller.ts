import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { THROTTLE_LIMIT, THROTTLE_TTL_MS } from '../config/http.constants';

@Controller('agent')
@ApiTags('Agent')
export class AgentCapabilitiesController {
  @Get('capabilities')
  @SkipThrottle()
  @ApiOperation({
    summary:
      "Négociation des capacités de l'agent (surface de découverte non authentifiée)",
  })
  getCapabilities() {
    return {
      name: 'lomi.',
      api: {
        version: '1.1.0',
        base_url: 'https://api.lomi.africa',
        open_api: 'https://lomi.africa/openapi.json',
        agent_open_api: 'https://lomi.africa/agent-openapi.json',
        site: 'https://lomi.africa',
        agent_card: 'https://lomi.africa/.well-known/agent.json',
      },
      rate_limits: {
        default: {
          window_ms: THROTTLE_TTL_MS,
          max_requests: THROTTLE_LIMIT,
        },
        http_429: {
          retry_after_header: 'Retry-After (seconds when throttled)',
        },
      },
      features: {
        rest_api: true,
        webhooks: true,
        idempotency_keys: true,
        server_sent_events: '/agent/events',
        agent_subscriptions: '/agent/subscriptions',
        workflow_runs: '/agent/workflows',
        handoff: '/agent/handoff',
      },
    };
  }
}
