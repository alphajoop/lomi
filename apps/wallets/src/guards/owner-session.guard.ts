import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OwnerSessionService } from '../services/owner-session.service.js';

export type OwnerRequest = Request & { ownerEmail?: string };

@Injectable()
export class OwnerSessionGuard implements CanActivate {
  constructor(private readonly sessions: OwnerSessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<OwnerRequest>();
    const header = req.headers.authorization;
    const token =
      header?.startsWith('Bearer ')
        ? header.slice(7).trim()
        : (req.headers['x-owner-token'] as string | undefined);
    if (!token) {
      throw new UnauthorizedException('Owner session required');
    }
    try {
      req.ownerEmail = this.sessions.resolveEmailFromToken(token);
    } catch {
      throw new UnauthorizedException('Invalid owner session');
    }
    return true;
  }
}
