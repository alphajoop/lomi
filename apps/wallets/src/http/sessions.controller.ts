import { Body, Controller, Post } from '@nestjs/common';
import { OwnerSessionService } from '../services/owner-session.service.js';

@Controller('v1/sessions')
export class SessionsController {
  constructor(private readonly sessions: OwnerSessionService) {}

  @Post()
  create(@Body() body: { email?: string }) {
    const email = body.email ?? '';
    const session = this.sessions.createSession(email);
    return { ok: true, ...session };
  }
}
