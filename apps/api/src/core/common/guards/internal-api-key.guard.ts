import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret =
      this.configService.get<string>('INTERNAL_API_KEY') ||
      process.env.INTERNAL_API_KEY ||
      this.configService.get<string>('CRON_SECRET') ||
      process.env.CRON_SECRET;

    if (!secret) {
      throw new UnauthorizedException('Internal API operations are disabled');
    }

    const request = context.switchToHttp().getRequest();
    const header =
      request.headers['x-internal-key'] ?? request.headers['x-cron-secret'];

    if (typeof header !== 'string' || !this.safeEqual(header, secret)) {
      throw new UnauthorizedException('Invalid internal key');
    }

    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
