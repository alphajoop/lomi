import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../utils/supabase/supabase.service';

export interface PartnerContext {
  managementKeyId: string;
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
}

@Injectable()
export class PartnerKeyGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const managementKey = this.extractPartnerKey(request);

    if (!managementKey) {
      throw new UnauthorizedException('Partner management key is missing');
    }

    const { data, error } = await this.supabase.rpc(
      'verify_partner_management_key' as never,
      { p_management_key: managementKey } as never,
    );

    const row = (Array.isArray(data) ? data[0] : data) as unknown as
      | {
          is_valid: boolean;
          management_key_id: string;
          partner_id: string;
          partner_name: string;
          partner_slug: string;
          message?: string;
        }
      | undefined;

    if (error || !row?.is_valid) {
      throw new UnauthorizedException(row?.message || 'Invalid partner key');
    }

    request.partner = {
      managementKeyId: row.management_key_id,
      partnerId: row.partner_id,
      partnerName: row.partner_name,
      partnerSlug: row.partner_slug,
    } satisfies PartnerContext;

    return true;
  }

  private extractPartnerKey(request: {
    headers: Record<string, string | string[] | undefined>;
    authorization?: string;
  }): string | undefined {
    const header = request.headers['x-lomi-partner-key'];
    if (typeof header === 'string' && header.trim()) {
      return header.trim();
    }

    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token.startsWith('lomi_partner_')) {
        return token;
      }
    }

    return undefined;
  }
}
