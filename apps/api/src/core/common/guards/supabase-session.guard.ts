import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../utils/supabase/supabase.service';

@Injectable()
export class SupabaseSessionGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const {
      data: { user },
      error,
    } = await this.supabase.getClient().auth.getUser(token);

    if (error || !user?.id) {
      throw new UnauthorizedException('Invalid session');
    }

    request.merchantId = user.id;
    request.supabaseAccessToken = token;
    request.supabaseUserEmail = user.email;

    return true;
  }
}
